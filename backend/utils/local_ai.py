import os
import json
import requests
from typing import Dict, Any, Optional
from config import Config

class LocalAI:
    """Classe pour gérer l'IA locale avec Ollama"""
    
    def __init__(self, base_url: str = "http://localhost:11434"):
        self.base_url = base_url
        self.model = "llama3.1:8b"  # Modèle léger mais efficace
        self.available_models = []
        self._check_ollama_status()
    
    def _check_ollama_status(self) -> bool:
        """Vérifie si Ollama est disponible et récupère les modèles"""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.available_models = [model['name'] for model in data.get('models', [])]
                return True
        except Exception as e:
            print(f"⚠️ Ollama non disponible: {e}")
            return False
        return False
    
    def is_available(self) -> bool:
        """Vérifie si l'IA locale est disponible"""
        return self._check_ollama_status()
    
    def get_available_models(self) -> list:
        """Retourne la liste des modèles disponibles"""
        return self.available_models
    
    def ensure_model_available(self, model_name: str = None) -> bool:
        """S'assure que le modèle demandé est disponible, sinon le télécharge"""
        if model_name is None:
            model_name = self.model
            
        if model_name in self.available_models:
            return True
            
        try:
            print(f"📥 Téléchargement du modèle {model_name}...")
            response = requests.post(
                f"{self.base_url}/api/pull",
                json={"name": model_name},
                timeout=300  # 5 minutes pour le téléchargement
            )
            if response.status_code == 200:
                self.available_models.append(model_name)
                print(f"✅ Modèle {model_name} téléchargé avec succès")
                return True
        except Exception as e:
            print(f"❌ Erreur lors du téléchargement du modèle {model_name}: {e}")
            return False
        return False
    
    def analyze_document(self, prompt: str, system_role: str, model_name: str = None) -> Dict[str, Any]:
        """Analyse un document avec l'IA locale"""
        if model_name is None:
            model_name = self.model
            
        if not self.ensure_model_available(model_name):
            return {
                "success": False,
                "error": f"Modèle {model_name} non disponible"
            }
        
        try:
            # Préparer le prompt pour Ollama
            messages = [
                {"role": "system", "content": system_role},
                {"role": "user", "content": prompt}
            ]
            
            response = requests.post(
                f"{self.base_url}/api/chat",
                json={
                    "model": model_name,
                    "messages": messages,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,
                        "top_p": 0.9,
                        "num_predict": 2048
                    }
                },
                timeout=120  # 2 minutes pour l'analyse
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "analysis": data.get("message", {}).get("content", "").strip(),
                    "model": model_name,
                    "usage": data.get("usage", {})
                }
            else:
                return {
                    "success": False,
                    "error": f"Erreur Ollama: {response.status_code}"
                }
                
        except requests.exceptions.Timeout:
            return {
                "success": False,
                "error": "Timeout lors de l'analyse (plus de 2 minutes)"
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Erreur lors de l'analyse: {str(e)}"
            }
    
    def get_model_info(self, model_name: str = None) -> Dict[str, Any]:
        """Récupère les informations sur un modèle"""
        if model_name is None:
            model_name = self.model
            
        try:
            response = requests.post(
                f"{self.base_url}/api/show",
                json={"name": model_name},
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Erreur lors de la récupération des infos du modèle: {e}")
        
        return {}

# Instance globale
local_ai = LocalAI() 