import os
import json
import hashlib
import shutil
from datetime import datetime
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from openai_utils import analyse_document  # à adapter ou remplacer selon usage
import fitz
import pytesseract
from PIL import Image
from pdf2image import convert_from_path
import tempfile
import pandas as pd
from docx import Document
import email
from email import policy

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
ARCHIVE_FOLDER = "client_files"
PROMPTS_JSON = os.path.join("prompts", "prompts_list.json")
ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "eml", "txt", "xls", "xlsx"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(ARCHIVE_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def file_hash(filepath, block_size=65536):
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(block_size):
            sha256.update(chunk)
    return sha256.hexdigest()


def load_prompts_metadata():
    if not os.path.exists(PROMPTS_JSON):
        return []
    with open(PROMPTS_JSON, 'r', encoding='utf-8') as f:
        prompts = json.load(f)
    return [
        {
            "id": p.get("id"),
            "title": p.get("title"),
            "category": p.get("category"),
            "language": p.get("language"),
            "description": p.get("description")
        }
        for p in prompts
    ]


@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    prompts = load_prompts_metadata()
    return jsonify(prompts)


def read_docx(path):
    doc = Document(path)
    return "\n".join([p.text for p in doc.paragraphs]).strip()


def read_pdf(path):
    doc = fitz.open(path)
    return "".join(page.get_text() for page in doc).strip()


def read_eml(path):
    with open(path, "rb") as f:
        msg = email.message_from_binary_file(f, policy=policy.default)
    if msg.is_multipart():
        parts = [p.get_content() for p in msg.walk() if p.get_content_type() == "text/plain"]
        return "\n".join(parts).strip()
    return msg.get_content().strip()


def read_txt(path):
    with open(path, "r", encoding="utf-8") as f:
        return f.read().strip()


def read_excel(path):
    xls = pd.ExcelFile(path)
    text = ""
    for sheet in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet)
        text += f"\n-- Feuille: {sheet} --\n"
        text += df.fillna('').astype(str).agg(' '.join, axis=1).str.cat(sep='\n')
    return text.strip()


def read_file(path):
    ext = path.rsplit(".", 1)[1].lower()
    match ext:
        case "pdf":
            return read_pdf(path)
        case "doc" | "docx":
            return read_docx(path)
        case "eml":
            return read_eml(path)
        case "txt":
            return read_txt(path)
        case "xls" | "xlsx":
            return read_excel(path)
        case _:
            raise ValueError(f"Type de fichier non supporté : .{ext}")


def perform_ocr(path):
    ext = path.rsplit(".", 1)[1].lower()
    text = ""

    if ext == "pdf":
        # Convertir PDF en images
        images = convert_from_path(path)
        for img in images:
            text += pytesseract.image_to_string(img, lang='fra') + "\n"
    else:
        # Pour images ou autres fichiers, ouvrir avec PIL
        img = Image.open(path)
        text = pytesseract.image_to_string(img, lang='fra')

    return text.strip()


def analyse_document_with_text(text, prompt_id):
    # Charge les métadonnées du prompt
    with open(PROMPTS_JSON, "r", encoding="utf-8") as f:
        prompts = json.load(f)
    prompt_meta = next((p for p in prompts if p["id"] == prompt_id), None)
    if not prompt_meta:
        raise ValueError(f"Prompt introuvable : {prompt_id}")

    prompt_path = prompt_meta.get("content_file")
    if not prompt_path or not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Fichier de prompt manquant : {prompt_path}")

    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_content = f.read()

    max_chars = prompt_meta.get("max_chars", 4000)

    final_prompt = f"{prompt_content}\n\nContenu du document :\n{text[:max_chars]}"

    # Utilise ici ta fonction d'appel OpenAI habituelle (exemple simplifié)
    response = analyse_document(final_prompt, prompt_meta["system_role"])  
    # Tu peux adapter analyse_document pour prendre le prompt complet + rôle system

    return response.strip()


@app.route("/api/analyse", methods=["POST"])
def upload_and_analyse():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Extension non autorisée"}), 400

    prompt_id = request.form.get("prompt_id")
    if not prompt_id:
        return jsonify({"error": "prompt_id manquant"}), 400

    use_ocr = request.form.get("use_ocr", "false").lower() == "true"

    temp_path = os.path.join(UPLOAD_FOLDER, "temp_" + secure_filename(file.filename))
    file.save(temp_path)

    h = file_hash(temp_path)
    ext = os.path.splitext(file.filename)[1].lower()
    date_str = datetime.now().strftime("%y%m%d")

    new_filename = f"{date_str}-{h}-{secure_filename(file.filename)}"
    new_path = os.path.join(UPLOAD_FOLDER, new_filename)

    if not os.path.exists(new_path):
        os.rename(temp_path, new_path)
    else:
        os.remove(temp_path)

    try:
        doc_text = read_file(new_path)

        if not doc_text.strip():
            if not use_ocr:
                return jsonify({
                    "confirmation_required": True,
                    "message": "Pas de texte détecté (doc scanné ?). Voulez-vous extraire le texte avec OCR ?"
                }), 200

            doc_text = perform_ocr(new_path)
            if not doc_text.strip():
                return jsonify({"error": "Même après OCR, aucun texte détecté."}), 400

        result = analyse_document_with_text(doc_text, prompt_id)

        archive_path = os.path.join(ARCHIVE_FOLDER, new_filename)
        if not os.path.exists(archive_path):
            shutil.move(new_path, archive_path)

    except Exception as e:
        failed_filename = f"{date_str}-{h}-{secure_filename(file.filename)}-failed{ext}"
        failed_path = os.path.join(UPLOAD_FOLDER, failed_filename)
        if os.path.exists(new_path):
            os.rename(new_path, failed_path)
        return jsonify({"error": f"Erreur lors de l'analyse : {str(e)}"}), 500

    return jsonify({"resultat": result})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
