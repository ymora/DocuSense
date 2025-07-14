import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from docx import Document
import fitz
import email
from email import policy
import pandas as pd

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("Clé API OpenAI manquante. Vérifiez .env")

client = OpenAI(api_key=api_key)

PROMPTS_PATH = "prompts/prompts_list.json"
with open(PROMPTS_PATH, "r", encoding="utf-8") as f:
    PROMPTS_CATALOG = json.load(f)

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
        case "pdf": return read_pdf(path)
        case "doc" | "docx": return read_docx(path)
        case "eml": return read_eml(path)
        case "txt": return read_txt(path)
        case "xls" | "xlsx": return read_excel(path)
        case _: raise ValueError(f"Type de fichier non supporté : .{ext}")

def analyse_document(path, prompt_id):
    prompt_meta = next((p for p in PROMPTS_CATALOG if p["id"] == prompt_id), None)
    if not prompt_meta:
        raise ValueError(f"Prompt introuvable : {prompt_id}")

    prompt_path = prompt_meta.get("content_file")
    if not prompt_path or not os.path.exists(prompt_path):
        raise FileNotFoundError(f"Fichier de prompt manquant : {prompt_path}")

    with open(prompt_path, "r", encoding="utf-8") as f:
        prompt_content = f.read()

    doc_text = read_file(path)
    if not doc_text.strip():
        if not doc_text.strip():
            return {
                "confirmation_required": True,
                "message": "Pas de texte détecté (doc scanné ?) \n Voulez-vous essayer d'extraire le texte avec OCR ?"
            }
            
    max_chars = prompt_meta.get("max_chars", 4000)

    final_prompt = f"{prompt_content}\n\nContenu du document :\n{doc_text[:max_chars]}"

    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": prompt_meta["system_role"]},
            {"role": "user", "content": final_prompt}
        ],
        temperature=0.2
    )
    return response.choices[0].message.content.strip()
