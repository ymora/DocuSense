import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))  # backend/

class Config:
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
    POPPLER_PATH = os.getenv("POPPLER_PATH")

    # Dossier des fichiers analysés
    ANALYZED_FILES_FOLDER = os.path.join(BASE_DIR, os.getenv("ANALYZED_FILES_FOLDER", "analyzed_files"))

    # Dossier contenant les fichiers de prompt
    PROMPT_CONTENT_DIR = os.path.join(BASE_DIR, "prompts")

    # Fichier JSON listant les métadonnées des prompts
    PROMPTS_JSON = os.path.join(PROMPT_CONTENT_DIR, "prompts_list.json")

    ALLOWED_EXTENSIONS = {"pdf", "png", "jpg", "jpeg", "doc", "docx", "eml"}
    
    # Système de gestion des fichiers par état d'analyse
    FILE_MANAGEMENT_BASE = os.path.join(BASE_DIR, "file_management")
    
    # Dossiers par état d'analyse
    FILE_STATES = {
        "pending": os.path.join(FILE_MANAGEMENT_BASE, "pending"),
        "in_progress": os.path.join(FILE_MANAGEMENT_BASE, "in_progress"),
        "completed": os.path.join(FILE_MANAGEMENT_BASE, "completed"),
        "failed": os.path.join(FILE_MANAGEMENT_BASE, "failed"),
        "archived": os.path.join(FILE_MANAGEMENT_BASE, "archived")
    }
    
    # Fichier de métadonnées pour le suivi des fichiers
    FILE_REGISTRY = os.path.join(FILE_MANAGEMENT_BASE, "file_registry.json")
    
    
