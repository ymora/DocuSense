import os
from flask import Flask, request, jsonify
from werkzeug.utils import secure_filename
from utils.document_handler import load_prompts_metadata, read_file, process_document
from utils.logging_config import setup_logging
from config import Config

app = Flask(__name__)
app.config.from_object(Config)

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['ARCHIVE_FOLDER'], exist_ok=True)

logger = setup_logging()


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']


@app.route("/api/prompts", methods=["GET"])
def get_prompts():
    prompts = load_prompts_metadata(app.config['PROMPTS_JSON'])
    return jsonify(prompts)


@app.route("/api/analyse-locale", methods=["POST"])
def analyse_locale():
    if "file" not in request.files:
        return jsonify({"error": "Aucun fichier envoyé"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Nom de fichier vide"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Extension non autorisée"}), 400

    temp_path = os.path.join(app.config['UPLOAD_FOLDER'], "temp_" + secure_filename(file.filename))
    file.save(temp_path)

    try:
        text = read_file(temp_path)
        if not text.strip():
            return jsonify({
                "confirmation_required": True,
                "message": "Aucun texte détecté. Voulez-vous lancer l'extraction OCR ?"
            }), 200

        nb_mots = len(text.split())
        extrait = "\n".join(text.splitlines()[:10])
        result = f"Texte extrait : {nb_mots} mots\n\nPremières lignes :\n{extrait}"

    except Exception as e:
        logger.exception("Erreur lecture fichier")
        return jsonify({"error": f"Erreur lecture fichier : {str(e)}"}), 500
    finally:
        os.remove(temp_path)

    return jsonify({"resultat": result})


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

    try:
        result = process_document(file, prompt_id, use_ocr)
        if result.get("confirmation_required"):
            return jsonify(result), 200
        return jsonify({"resultat": result["resultat"]})

    except Exception as e:
        logger.exception("Erreur lors de l'analyse")
        return jsonify({"error": f"Erreur lors de l'analyse : {str(e)}"}), 500


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
