#!/usr/bin/env python3
"""
Script d'installation d'Ollama pour DocuSense
"""

import os
import sys
import subprocess
import platform
import requests
import zipfile
import tarfile
from pathlib import Path

def check_ollama_installed():
    """Vérifie si Ollama est déjà installé"""
    try:
        result = subprocess.run(['ollama', '--version'], 
                              capture_output=True, text=True, timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError):
        return False

def install_ollama_windows():
    """Installe Ollama sur Windows"""
    print("📥 Installation d'Ollama sur Windows...")
    
    # URL de téléchargement pour Windows
    url = "https://github.com/ollama/ollama/releases/latest/download/ollama-windows-amd64.zip"
    
    try:
        # Télécharger Ollama
        print("Téléchargement en cours...")
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        # Sauvegarder le fichier
        zip_path = "ollama-windows-amd64.zip"
        with open(zip_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        # Extraire
        print("Extraction en cours...")
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(".")
        
        # Déplacer dans un dossier approprié
        ollama_dir = Path.home() / "ollama"
        ollama_dir.mkdir(exist_ok=True)
        
        # Copier les fichiers
        if os.path.exists("ollama.exe"):
            import shutil
            shutil.move("ollama.exe", ollama_dir / "ollama.exe")
        
        # Nettoyer
        os.remove(zip_path)
        
        print(f"✅ Ollama installé dans {ollama_dir}")
        print("🚀 Pour démarrer Ollama, exécutez:")
        print(f"   {ollama_dir / 'ollama.exe'} serve")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de l'installation: {e}")
        return False

def install_ollama_linux():
    """Installe Ollama sur Linux"""
    print("📥 Installation d'Ollama sur Linux...")
    
    try:
        # Utiliser le script d'installation officiel
        cmd = "curl -fsSL https://ollama.ai/install.sh | sh"
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Ollama installé avec succès")
            print("🚀 Pour démarrer Ollama, exécutez:")
            print("   ollama serve")
            return True
        else:
            print(f"❌ Erreur lors de l'installation: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors de l'installation: {e}")
        return False

def install_ollama_macos():
    """Installe Ollama sur macOS"""
    print("📥 Installation d'Ollama sur macOS...")
    
    try:
        # Utiliser Homebrew si disponible
        result = subprocess.run(['brew', '--version'], 
                              capture_output=True, text=True)
        
        if result.returncode == 0:
            # Installation via Homebrew
            print("Installation via Homebrew...")
            subprocess.run(['brew', 'install', 'ollama'], check=True)
            print("✅ Ollama installé avec succès")
            print("🚀 Pour démarrer Ollama, exécutez:")
            print("   ollama serve")
            return True
        else:
            # Installation manuelle
            print("Installation manuelle...")
            cmd = "curl -fsSL https://ollama.ai/install.sh | sh"
            subprocess.run(cmd, shell=True, check=True)
            print("✅ Ollama installé avec succès")
            print("🚀 Pour démarrer Ollama, exécutez:")
            print("   ollama serve")
            return True
            
    except Exception as e:
        print(f"❌ Erreur lors de l'installation: {e}")
        return False

def download_model():
    """Télécharge le modèle Llama 3.1 8B"""
    print("📥 Téléchargement du modèle Llama 3.1 8B...")
    
    try:
        # Vérifier qu'Ollama est en cours d'exécution
        response = requests.get("http://localhost:11434/api/tags", timeout=5)
        if response.status_code != 200:
            print("⚠️ Ollama n'est pas en cours d'exécution")
            print("🚀 Démarrez Ollama avec: ollama serve")
            return False
        
        # Télécharger le modèle
        print("Téléchargement en cours (cela peut prendre plusieurs minutes)...")
        response = requests.post(
            "http://localhost:11434/api/pull",
            json={"name": "llama3.1:8b"},
            timeout=300  # 5 minutes
        )
        
        if response.status_code == 200:
            print("✅ Modèle téléchargé avec succès")
            return True
        else:
            print(f"❌ Erreur lors du téléchargement: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Erreur lors du téléchargement: {e}")
        return False

def main():
    """Fonction principale"""
    print("🤖 Installation d'Ollama pour DocuSense")
    print("=" * 50)
    
    # Vérifier si Ollama est déjà installé
    if check_ollama_installed():
        print("✅ Ollama est déjà installé")
    else:
        # Installer selon la plateforme
        system = platform.system().lower()
        
        if system == "windows":
            success = install_ollama_windows()
        elif system == "linux":
            success = install_ollama_linux()
        elif system == "darwin":  # macOS
            success = install_ollama_macos()
        else:
            print(f"❌ Plateforme non supportée: {system}")
            return False
        
        if not success:
            print("❌ Échec de l'installation d'Ollama")
            return False
    
    # Télécharger le modèle
    print("\n" + "=" * 50)
    download_model()
    
    print("\n🎉 Installation terminée!")
    print("📖 Pour plus d'informations, consultez: https://ollama.ai")
    
    return True

if __name__ == "__main__":
    main() 