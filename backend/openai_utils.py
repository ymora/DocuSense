import os
import json
from docx import Document
from openai import OpenAI
from dotenv import load_dotenv

# Librairies additionnelles pour lecture d'autres formats
import fitz  # PyMuPDF pour PDF
import email
from email import policy
import pandas as pd

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("La clé API OpenAI est manquante. Vérifiez le fichier .env.")

client = OpenAI(api_key=api_key)

# Charger le catalogue de prompts (une seule fois au démarrage)
with open("prompts/prompts_list.json", "r", encoding="utf-8") as f:
    PROMPTS_CATALOG = json.load(f)


def read_docx(path):
    """Lire le contenu d'un fichier .docx"""
    try:
        doc = Document(path)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text.strip()
    except Exception as e:
        raise FileNotFoundError(f"Impossible d'ouvrir le document .docx : {path}\n{e}")


def read_pdf(path):
    """Lire le contenu d'un fichier PDF"""
    try:
        doc = fitz.open(path)
        text = ""
        for page in doc:
            text += page.get_text()
        return text.strip()
    except Exception as e:
        raise FileNotFoundError(f"Impossible d'ouvrir le document PDF : {path}\n{e}")


def read_eml(path):
    """Lire le contenu texte d'un fichier email .eml"""
    try:
        with open(path, "rb") as f:
            msg = email.message_from_binary_file(f, policy=policy.default)
        # Extraire le texte du message (partie texte seulement)
        if msg.is_multipart():
            parts = [part.get_content() for part in msg.walk() if part.get_content_type() == "text/plain"]
            return "\n".join(parts).strip()
        else:
            return msg.get_content().strip()
    except Exception as e:
        raise FileNotFoundError(f"Impossible d'ouvrir le fichier EML : {path}\n{e}")


def read_txt(path):
    """Lire un fichier texte brut"""
    try:
        with open(path, "r", encoding="utf-8") as f:
            return f.read().strip()
    except Exception as e:
        raise FileNotFoundError(f"Impossible d'ouvrir le fichier texte : {path}\n{e}")


def read_excel(path):
    """Lire un fichier Excel (.xls ou .xlsx), concaténer toutes les cellules en texte"""
    try:
        xls = pd.ExcelFile(path)
        text = ""
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name)
            text += f"\n-- Feuille: {sheet_name} --\n"
            text += df.fillna('').astype(str).agg(' '.join, axis=1).str.cat(sep='\n')
        return text.strip()
    except Exception as e:
        raise FileNotFoundError(f"Impossible d'ouvrir le fichier Excel : {path}\n{e}")


def load_prompt(prompt_id):
    """Charge le contenu d'un prompt depuis son fichier"""
    prompt_meta = next((p for p in PROMPTS_CATALOG if p["id"] == prompt_id), None)
    if not prompt_meta:
        raise ValueError(f"Prompt avec id '{prompt_id}' introuvable dans le catalogue.")

    prompt_path = prompt_meta["content_file"]
    if not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Fichier de prompt manquant : {prompt_path}")

    with open(prompt_path, "r", encoding="utf-8") as f:
        return f.read()


def read_file(path):
    """Détecte l’extension et appelle la bonne fonction de lecture"""
    ext = path.rsplit('.', 1)[1].lower()
    if ext in ["docx", "doc"]:
        return read_docx(path)
    elif ext == "pdf":
        return read_pdf(path)
    elif ext == "eml":
        return read_eml(path)
    elif ext == "txt":
        return read_txt(path)
    elif ext in ["xls", "xlsx"]:
        return read_excel(path)
    else:
        raise ValueError(f"Extension non supportée : .{ext}")


def analyse_document(path, prompt_id):
    """Analyse un document avec un prompt choisi, via l'API OpenAI, et retourne un résumé"""
    text = read_file(path)
    prompt_content = load_prompt(prompt_id)

    # Construire le prompt final
    prompt = f"""
{prompt_content}

Document :
{text[:4000]}  # limitation simple pour éviter les prompts trop longs
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": "Tu es un assistant juridique intelligent."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.2
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"Erreur lors de l'appel à l'API OpenAI : {str(e)}"
