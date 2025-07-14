import os
import json
import hashlib
import shutil
from datetime import datetime
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from openai_utils import analyse_document

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
            "titre": p.get("titre"),
            "categorie": p.get("categorie"),
            "langue": p.get("langue"),
            "description": p.get("description")
        }
        for p in prompts
    ]


@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    prompts = load_prompts_metadata()
    return jsonify(prompts)


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

    # Sauvegarde temporaire dans uploads sous nom temporaire
    temp_path = os.path.join(UPLOAD_FOLDER, "temp_" + secure_filename(file.filename))
    file.save(temp_path)

    # Calcul hash
    h = file_hash(temp_path)
    ext = os.path.splitext(file.filename)[1].lower()
    date_str = datetime.now().strftime("%y%m%d")

    new_filename = f"{date_str}-{h}-{secure_filename(file.filename)}"
    new_path = os.path.join(UPLOAD_FOLDER, new_filename)

    # Renommage fichier uploadé
    if not os.path.exists(new_path):
        os.rename(temp_path, new_path)
    else:
        os.remove(temp_path)

    try:
        # Analyse sur le fichier renommé
        result = analyse_document(new_path, prompt_id)

        # Déplacement vers archive si succès
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
