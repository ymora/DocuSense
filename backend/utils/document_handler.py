import os
import json
import fitz  # PyMuPDF
import pytesseract
import shutil
import hashlib
import pandas as pd
from PIL import Image
from datetime import datetime
from docx import Document
from pdf2image import convert_from_path
from email import policy
from flask import current_app
import email
from config import Config
from werkzeug.utils import secure_filename
from utils.openai_utils import call_openai_api
from utils.local_ai import local_ai


# ---------- Lecture de fichiers selon leur type ----------
def read_docx(path):
    doc = Document(path)
    return "\n".join(p.text for p in doc.paragraphs).strip()

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


# ---------- OCR ----------
def perform_ocr(path):
    ext = path.rsplit(".", 1)[1].lower()
    text = ""

    if ext == "pdf":
        if not os.path.exists(Config.POPPLER_PATH):
            raise FileNotFoundError(f"Poppler non trouvé au chemin {Config.POPPLER_PATH}. Vérifiez le .env.")
        images = convert_from_path(path, poppler_path=Config.POPPLER_PATH)
        for img in images:
            text += pytesseract.image_to_string(img, lang='fra') + "\n"
    else:
        img = Image.open(path)
        text = pytesseract.image_to_string(img, lang='fra')

    return text.strip()


# ---------- Hash ----------
def file_hash(path, block_size=65536):
    sha256 = hashlib.sha256()
    with open(path, 'rb') as f:
        while chunk := f.read(block_size):
            sha256.update(chunk)
    return sha256.hexdigest()


# ---------- Analyse avec IA (OpenAI ou Locale) ----------
def load_prompts_metadata(prompts_json_path):
    if not os.path.exists(prompts_json_path):
        return []
    with open(prompts_json_path, 'r', encoding='utf-8') as f:
        prompts = json.load(f)
    return prompts

def analyse_document_with_text(text, prompt_id, ia_mode="openai"):
    if not os.path.exists(Config.PROMPTS_JSON):
        raise FileNotFoundError("Fichier de prompt introuvable")

    with open(Config.PROMPTS_JSON, "r", encoding="utf-8") as f:
        prompts = json.load(f)

    prompt_meta = next((p for p in prompts if p["id"] == prompt_id), None)
    if not prompt_meta:
        raise ValueError(f"Prompt introuvable : {prompt_id}")

    prompt_filename = prompt_meta.get("content_file")
    if not prompt_filename:
        raise ValueError("Le champ 'content_file' est manquant")

    prompt_path = os.path.join(Config.PROMPT_CONTENT_DIR, prompt_filename)
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Fichier de prompt manquant : {prompt_path}")

    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_content = f.read()

    if not text.strip():
        # Texte vide : on demande confirmation pour OCR
        return {
            "confirmation_required": True,
            "message": "Pas de texte détecté (document scanné ?). Voulez-vous essayer d'extraire le texte avec OCR ?"
        }

    max_chars = prompt_meta.get("max_chars", 4000)
    final_prompt = f"{prompt_content}\n\nContenu du document :\n{text[:max_chars]}"

    # Choisir le mode d'IA
    if ia_mode == "local":
        if not local_ai.is_available():
            return {
                "success": False,
                "error": "IA locale non disponible. Vérifiez qu'Ollama est installé et en cours d'exécution."
            }
        
        result = local_ai.analyze_document(final_prompt, prompt_meta["system_role"])
        if result.get("success"):
            return result.get("analysis", "")
        else:
            raise Exception(result.get("error", "Erreur IA locale"))
    else:
        # Mode OpenAI par défaut
        response = call_openai_api(final_prompt, prompt_meta["system_role"])
        return response.strip()


# ---------- Traitement complet ----------
def process_document(file_path, prompt_id, ia_mode="openai", use_ocr=False):
    """Traite un document avec l'IA spécifiée"""
    try:
        # Lire le contenu du fichier
        doc_text = read_file(file_path)
        
        if not doc_text.strip():
            if not use_ocr:
                return {
                    "success": False,
                    "confirmation_required": True,
                    "message": "Pas de texte détecté. Voulez-vous extraire le texte avec OCR ?"
                }
            doc_text = perform_ocr(file_path)

        # Analyser avec l'IA
        result = analyse_document_with_text(doc_text, prompt_id, ia_mode)
        
        return {
            "success": True,
            "analysis": result,
            "ia_mode": ia_mode
        }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


# ---------- Traitement multi-documents ----------
def process_multiple_documents(file_paths, prompt_id, ia_mode="openai", use_ocr=False):
    """Traite plusieurs documents avec l'IA pour comparaison"""
    try:
        # Lire le contenu de tous les fichiers
        documents_content = []
        
        for file_path in file_paths:
            try:
                doc_text = read_file(file_path)
                
                if not doc_text.strip():
                    if not use_ocr:
                        return {
                            "success": False,
                            "confirmation_required": True,
                            "message": f"Pas de texte détecté dans {os.path.basename(file_path)}. Voulez-vous extraire le texte avec OCR ?"
                        }
                    doc_text = perform_ocr(file_path)
                
                # Ajouter le nom du fichier et son contenu
                documents_content.append({
                    "name": os.path.basename(file_path),
                    "path": file_path,
                    "content": doc_text
                })
                
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Erreur lors de la lecture de {os.path.basename(file_path)}: {str(e)}"
                }
        
        # Charger le prompt
        if not os.path.exists(Config.PROMPTS_JSON):
            raise FileNotFoundError("Fichier de prompt introuvable")

        with open(Config.PROMPTS_JSON, "r", encoding="utf-8") as f:
            prompts = json.load(f)

        prompt_meta = next((p for p in prompts if p["id"] == prompt_id), None)
        if not prompt_meta:
            raise ValueError(f"Prompt introuvable : {prompt_id}")

        prompt_filename = prompt_meta.get("content_file")
        if not prompt_filename:
            raise ValueError("Le champ 'content_file' est manquant")

        prompt_path = os.path.join(Config.PROMPT_CONTENT_DIR, prompt_filename)
        if not os.path.exists(prompt_path):
            raise FileNotFoundError(f"Fichier de prompt manquant : {prompt_path}")

        with open(prompt_path, "r", encoding="utf-8") as f:
            prompt_content = f.read()

        # Préparer le contenu des documents pour le prompt
        documents_text = ""
        for i, doc in enumerate(documents_content, 1):
            documents_text += f"\n--- DOCUMENT {i}: {doc['name']} ---\n"
            documents_text += doc['content']
            documents_text += "\n"

        max_chars = prompt_meta.get("max_chars", 6000)
        final_prompt = f"{prompt_content}\n\n{documents_text[:max_chars]}"

        # Choisir le mode d'IA
        if ia_mode == "local":
            if not local_ai.is_available():
                return {
                    "success": False,
                    "error": "IA locale non disponible. Vérifiez qu'Ollama est installé et en cours d'exécution."
                }
            
            result = local_ai.analyze_document(final_prompt, prompt_meta["system_role"])
            if result.get("success"):
                return {
                    "success": True,
                    "analysis": result.get("analysis", ""),
                    "ia_mode": ia_mode
                }
            else:
                raise Exception(result.get("error", "Erreur IA locale"))
        else:
            # Mode OpenAI par défaut
            response = call_openai_api(final_prompt, prompt_meta["system_role"])
            return {
                "success": True,
                "analysis": response.strip(),
                "ia_mode": ia_mode
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }
