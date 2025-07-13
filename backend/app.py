import os
import json
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from openai_utils import read_docx, read_pdf, read_eml, read_txt, read_excel, client  # à adapter selon tes fonctions

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
PROMPTS_FOLDER = "prompts"
PROMPTS_LIST_FILE = os.path.join(PROMPTS_FOLDER, "prompts_list.json")

ALLOWED_EXTENSIONS = {"pdf", "docx", "doc", "eml", "txt", "xls", "xlsx"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def read_file(filepath):
    ext = filepath.rsplit('.', 1)[1].lower()
    if ext == "docx" or ext == "doc":
        return read_docx(filepath)
    elif ext == "pdf":
        return read_pdf(filepath)
    elif ext == "eml":
        return read_eml(filepath)
    elif ext == "txt":
        return read_txt(filepath)
    elif ext == "xls" or ext == "xlsx":
        return read_excel(filepath)
    else:
        raise ValueError(f"Type de fichier non supporté : .{ext}")


def load_prompts():
    try:
        with open(PROMPTS_LIST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"Erreur chargement prompts list: {e}")
        return []


@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    prompts = load_prompts()
    return jsonify(prompts)


@app.route("/api/analyse", methods=["POST"])
def upload_and_analyse():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": f"Extension non autorisée. Extensions autorisées : {', '.join(ALLOWED_EXTENSIONS)}"}), 400

    prompt_id = request.form.get("prompt_id")
    if not prompt_id:
        return jsonify({"error": "prompt_id manquant"}), 400

    prompts = load_prompts()
    prompt_meta = next((p for p in prompts if p["id"] == prompt_id), None)
    if not prompt_meta:
        return jsonify({"error": "Prompt non trouvé"}), 400

    prompt_path = os.path.join(PROMPTS_FOLDER, prompt_meta["content_file"])
    if not os.path.isfile(prompt_path):
        return jsonify({"error": "Fichier prompt introuvable"}), 500

    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_content = f.read()

    filename = secure_filename(file.filename)
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)
    print(f"Fichier sauvegardé : {filepath}")
    print("Existe avant suppression ?", os.path.exists(filepath))

    try:
        document_text = read_file(filepath)
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
            print(f"Fichier supprimé : {filepath}")
        return jsonify({"error": f"Erreur lecture document : {str(e)}"}), 500

    final_prompt = prompt_content.replace("{{document}}", document_text[:4000])

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Tu es un assistant juridique intelligent."},
                {"role": "user", "content": final_prompt}
            ],
            temperature=0.2,
        )
        result = response.choices[0].message.content.strip()
    except Exception as e:
        if os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({"error": f"Erreur API OpenAI : {str(e)}"}), 500
    finally:
        if os.path.exists(filepath):
            os.remove(filepath)

    return jsonify({"resultat": result})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
