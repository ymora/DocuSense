"""
Gestionnaire de fichiers par répertoires selon l'état d'analyse

Ce module gère l'organisation des fichiers dans des dossiers selon leur état :
- pending : fichiers en attente d'analyse
- in_progress : fichiers en cours d'analyse
- completed : fichiers analysés avec succès
- failed : fichiers dont l'analyse a échoué
- archived : fichiers archivés
"""

import os
import json
import shutil
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path

from config import Config


class FileRegistry:
    """Registre central des fichiers avec leur état et métadonnées"""
    
    def __init__(self):
        self.registry_path = Config.FILE_REGISTRY
        self.registry = self._load_registry()
        self._ensure_directories()
    
    def _ensure_directories(self):
        """Crée les dossiers de gestion des fichiers s'ils n'existent pas"""
        for state_path in Config.FILE_STATES.values():
            os.makedirs(state_path, exist_ok=True)
        
        # Créer le dossier de base
        os.makedirs(Config.FILE_MANAGEMENT_BASE, exist_ok=True)
    
    def _load_registry(self) -> Dict:
        """Charge le registre des fichiers depuis le fichier JSON"""
        if os.path.exists(self.registry_path):
            try:
                with open(self.registry_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def _save_registry(self):
        """Sauvegarde le registre des fichiers dans le fichier JSON"""
        try:
            with open(self.registry_path, 'w', encoding='utf-8') as f:
                json.dump(self.registry, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Erreur lors de la sauvegarde du registre: {e}")
    
    def _generate_file_id(self, file_path: str) -> str:
        """Génère un ID unique pour un fichier basé sur son chemin et sa taille"""
        stat = os.stat(file_path)
        content = f"{file_path}_{stat.st_size}_{stat.st_mtime}"
        return hashlib.md5(content.encode()).hexdigest()
    
    def register_file(self, file_path: str, original_path: str = None) -> str:
        """Enregistre un nouveau fichier dans le système"""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Fichier introuvable: {file_path}")
        
        file_id = self._generate_file_id(file_path)
        stat = os.stat(file_path)
        
        file_info = {
            "id": file_id,
            "original_path": original_path or file_path,
            "current_path": file_path,
            "name": os.path.basename(file_path),
            "size": stat.st_size,
            "created_at": datetime.now().isoformat(),
            "modified_at": datetime.fromtimestamp(stat.st_mtime).isoformat(),
            "status": "pending",
            "analysis": None,
            "error": None,
            "moved_at": datetime.now().isoformat()
        }
        
        self.registry[file_id] = file_info
        self._save_registry()
        
        return file_id
    
    def update_file_status(self, file_id: str, status: str, analysis: str = None, error: str = None):
        """Met à jour le statut d'un fichier"""
        if file_id not in self.registry:
            raise KeyError(f"Fichier non enregistré: {file_id}")
        
        self.registry[file_id]["status"] = status
        self.registry[file_id]["modified_at"] = datetime.now().isoformat()
        
        if analysis is not None:
            self.registry[file_id]["analysis"] = analysis
        
        if error is not None:
            self.registry[file_id]["error"] = error
        
        self._save_registry()
    
    def get_file_info(self, file_id: str) -> Optional[Dict]:
        """Récupère les informations d'un fichier"""
        return self.registry.get(file_id)
    
    def get_files_by_status(self, status: str) -> List[Dict]:
        """Récupère tous les fichiers d'un statut donné"""
        return [info for info in self.registry.values() if info["status"] == status]
    
    def get_all_files(self) -> List[Dict]:
        """Récupère tous les fichiers enregistrés"""
        return list(self.registry.values())
    
    def find_file_by_path(self, file_path: str) -> Optional[str]:
        """Trouve l'ID d'un fichier par son chemin original"""
        for file_id, info in self.registry.items():
            if info["original_path"] == file_path:
                return file_id
        return None


class FileStateManager:
    """Gestionnaire des états de fichiers avec organisation par répertoires"""
    
    def __init__(self):
        self.registry = FileRegistry()
    
    def add_file(self, file_path: str, original_path: str = None) -> str:
        """Ajoute un fichier au système de gestion"""
        file_id = self.registry.register_file(file_path, original_path)
        
        # Déplacer le fichier dans le dossier "pending"
        pending_path = os.path.join(Config.FILE_STATES["pending"], f"{file_id}_{os.path.basename(file_path)}")
        shutil.copy2(file_path, pending_path)
        
        # Mettre à jour le chemin dans le registre
        self.registry.registry[file_id]["current_path"] = pending_path
        self.registry._save_registry()
        
        return file_id
    
    def move_file_to_state(self, file_id: str, target_status: str) -> bool:
        """Déplace un fichier vers un nouvel état"""
        if target_status not in Config.FILE_STATES:
            raise ValueError(f"État invalide: {target_status}")
        
        file_info = self.registry.get_file_info(file_id)
        if not file_info:
            return False
        
        current_path = file_info["current_path"]
        if not os.path.exists(current_path):
            return False
        
        # Créer le nouveau chemin
        new_filename = f"{file_id}_{file_info['name']}"
        new_path = os.path.join(Config.FILE_STATES[target_status], new_filename)
        
        try:
            # Déplacer le fichier
            shutil.move(current_path, new_path)
            
            # Mettre à jour le registre
            self.registry.registry[file_id]["current_path"] = new_path
            self.registry.registry[file_id]["status"] = target_status
            self.registry.registry[file_id]["moved_at"] = datetime.now().isoformat()
            self.registry._save_registry()
            
            return True
        except Exception as e:
            print(f"Erreur lors du déplacement du fichier: {e}")
            return False
    
    def start_analysis(self, file_id: str) -> bool:
        """Marque un fichier comme en cours d'analyse"""
        return self.move_file_to_state(file_id, "in_progress")
    
    def complete_analysis(self, file_id: str, analysis: str) -> bool:
        """Marque un fichier comme analysé avec succès"""
        success = self.move_file_to_state(file_id, "completed")
        if success:
            self.registry.update_file_status(file_id, "completed", analysis=analysis)
        return success
    
    def mark_as_failed(self, file_id: str, error: str) -> bool:
        """Marque un fichier comme échoué"""
        success = self.move_file_to_state(file_id, "failed")
        if success:
            self.registry.update_file_status(file_id, "failed", error=error)
        return success
    
    def archive_file(self, file_id: str) -> bool:
        """Archive un fichier"""
        return self.move_file_to_state(file_id, "archived")
    
    def get_file_status(self, file_path: str) -> Optional[str]:
        """Récupère le statut d'un fichier par son chemin original"""
        file_id = self.registry.find_file_by_path(file_path)
        if file_id:
            file_info = self.registry.get_file_info(file_id)
            return file_info["status"] if file_info else None
        return None

    def find_analyzed_file_by_original(self, original_file_path: str) -> Optional[Dict]:
        """Trouve un fichier analysé par son chemin original en utilisant plusieurs méthodes de correspondance"""
        original_name = os.path.basename(original_file_path)
        original_dir = os.path.dirname(original_file_path)
        
        # Méthode 1: Chercher dans le registre par chemin original
        file_id = self.registry.find_file_by_path(original_file_path)
        if file_id:
            file_info = self.registry.get_file_info(file_id)
            if file_info:
                return {
                    "status": file_info["status"],
                    "analysis": file_info.get("analysis"),
                    "error": file_info.get("error"),
                    "file_id": file_id,
                    "method": "registry_exact"
                }
        
        # Méthode 2: Chercher par nom de fichier dans tous les états
        for status, status_dir in Config.FILE_STATES.items():
            if os.path.exists(status_dir):
                for filename in os.listdir(status_dir):
                    # Le format actuel est: HASH_nom_original
                    if filename.endswith(f"_{original_name}"):
                        # Extraire le hash et vérifier dans le registre
                        hash_part = filename.split("_")[0]
                        for file_id, file_info in self.registry.registry.items():
                            if file_id == hash_part and file_info["name"] == original_name:
                                return {
                                    "status": file_info["status"],
                                    "analysis": file_info.get("analysis"),
                                    "error": file_info.get("error"),
                                    "file_id": file_id,
                                    "method": "hash_match"
                                }
        
        # Méthode 3: Chercher par nom de fichier dans les dossiers d'analyse (format YYMMDD-HASH-nom)
        analyzed_dirs = [
            Config.ANALYZED_FILES_FOLDER,
            os.path.join(Config.FILE_MANAGEMENT_BASE, "completed"),
            os.path.join(Config.FILE_MANAGEMENT_BASE, "failed")
        ]
        
        for analyzed_dir in analyzed_dirs:
            if os.path.exists(analyzed_dir):
                for filename in os.listdir(analyzed_dir):
                    # Format YYMMDD-HASH-nom_original
                    if filename.endswith(f"-{original_name}"):
                        # Extraire le hash et vérifier dans le registre
                        parts = filename.split("-")
                        if len(parts) >= 3:
                            hash_part = parts[1]
                            for file_id, file_info in self.registry.registry.items():
                                if file_id == hash_part and file_info["name"] == original_name:
                                    return {
                                        "status": file_info["status"],
                                        "analysis": file_info.get("analysis"),
                                        "error": file_info.get("error"),
                                        "file_id": file_id,
                                        "method": "date_hash_match"
                                    }
        
        return None

    def get_enhanced_file_status(self, file_path: str) -> str:
        """Récupère le statut d'un fichier avec correspondance améliorée"""
        # Vérifier d'abord dans le registre
        status = self.get_file_status(file_path)
        if status:
            return status
        
        # Chercher dans les fichiers analysés
        analyzed_info = self.find_analyzed_file_by_original(file_path)
        if analyzed_info:
            return analyzed_info["status"]
        
        # Si le fichier existe mais n'est pas dans le système, il est "non analysé"
        if os.path.exists(file_path):
            return "unanalyzed"
        
        return "unregistered"
    
    def get_files_in_directory(self, directory_path: str) -> List[Dict]:
        """Récupère tous les fichiers d'un répertoire avec leur statut amélioré"""
        files = []
        
        for root, dirs, filenames in os.walk(directory_path):
            for filename in filenames:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, directory_path)
                
                # Utiliser la fonction de correspondance améliorée
                enhanced_status = self.get_enhanced_file_status(file_path)
                
                # Chercher les informations d'analyse
                analyzed_info = self.find_analyzed_file_by_original(file_path)
                
                stat = os.stat(file_path)
                file_info = {
                    "path": file_path,
                    "relative_path": relative_path,
                    "status": enhanced_status,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                }
                
                # Ajouter les informations d'analyse si disponibles
                if analyzed_info:
                    file_info["analysis"] = analyzed_info.get("analysis")
                    file_info["error"] = analyzed_info.get("error")
                    file_info["file_id"] = analyzed_info.get("file_id")
                    file_info["correspondence_method"] = analyzed_info.get("method")
                else:
                    file_info["analysis"] = None
                    file_info["error"] = None
                
                files.append(file_info)
        
        return files
    
    def get_statistics(self) -> Dict:
        """Récupère les statistiques des fichiers par état"""
        stats = {}
        for status in Config.FILE_STATES.keys():
            files = self.registry.get_files_by_status(status)
            stats[status] = {
                "count": len(files),
                "total_size": sum(f["size"] for f in files)
            }
        
        # Ajouter les fichiers non enregistrés
        all_files = self.registry.get_all_files()
        registered_paths = {f["original_path"] for f in all_files}
        
        stats["unregistered"] = {
            "count": 0,
            "total_size": 0
        }
        
        return stats
    
    def cleanup_old_files(self, days: int = 30) -> int:
        """Nettoie les anciens fichiers archivés"""
        cutoff_date = datetime.now().timestamp() - (days * 24 * 60 * 60)
        archived_files = self.registry.get_files_by_status("archived")
        
        cleaned_count = 0
        for file_info in archived_files:
            moved_at = datetime.fromisoformat(file_info["moved_at"]).timestamp()
            if moved_at < cutoff_date:
                try:
                    if os.path.exists(file_info["current_path"]):
                        os.remove(file_info["current_path"])
                    del self.registry.registry[file_info["id"]]
                    cleaned_count += 1
                except Exception as e:
                    print(f"Erreur lors du nettoyage de {file_info['current_path']}: {e}")
        
        self.registry._save_registry()
        return cleaned_count


# Instance globale du gestionnaire
file_manager = FileStateManager() 