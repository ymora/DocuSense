import os
import json
from docx import Document
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("La clé API OpenAI est manquante. Vérifiez le fichier .env.")

client = OpenAI(api_key=api_key)

# Charger le catalogue de prompts (une seule fois au démarrage)
with open("prompts/prompts.json", "r", encoding="utf-8") as f:
    PROMPTS_CATALOG = json.load(f)

def read_docx(path):
    """Lire le contenu d'un fichier .docx et retourner le texte brut"""
    try:
        doc = Document(path)
    except Exception as e:
        raise FileNotFoundError(f"Impossible d'ouvrir le document : {path}\n{e}")

    text = "\n".join([para.text for para in doc.paragraphs])
    return text.strip()

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

def analyse_document(path, prompt_id):
    """Analyse un document .docx avec un prompt choisi, via l'API OpenAI, et retourne un résumé"""

    text = read_docx(path)
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
