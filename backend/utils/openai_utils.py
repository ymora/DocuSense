import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from docx import Document
import fitz
import email
from email import policy
import pandas as pd
from config import Config

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("Clé API OpenAI manquante. Vérifiez .env")

client = OpenAI(api_key=api_key)

with open(Config.PROMPTS_JSON, "r", encoding="utf-8") as f:
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

def call_openai_api(prompt_text, system_role):
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": system_role},
            {"role": "user", "content": prompt_text}
        ],
        temperature=0.2
    )
    return response.choices[0].message.content.strip()