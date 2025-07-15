import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # backend/

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    POPPLER_PATH = os.getenv("POPPLER_PATH")

    # Dossiers d'upload et archive, relatifs à BASE_DIR, absolus ici pour éviter soucis
    UPLOAD_FOLDER = os.path.join(BASE_DIR, os.getenv("UPLOAD_FOLDER", "uploads"))
    ARCHIVE_FOLDER = os.path.join(BASE_DIR, os.getenv("ARCHIVE_FOLDER", "client_files"))

    # Dossier contenant les fichiers de prompt
    PROMPT_CONTENT_DIR = os.path.join(BASE_DIR, "prompts")

    # Fichier JSON listant les métadonnées des prompts
    PROMPTS_JSON = os.path.join(PROMPT_CONTENT_DIR, "prompts_list.json")

    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "eml"}
    
    
