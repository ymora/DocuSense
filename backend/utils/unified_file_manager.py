"""
Gestionnaire de fichiers unifié pour DocuSense

Ce module implémente un système unifié de gestion des fichiers analysés
avec un format de nommage YYMMDD-STATUT-nom_original pour simplifier
la correspondance et améliorer les performances.
"""

import os
import json
import shutil
import hashlib
from datetime import datetime
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from functools import lru_cache

from config import Config


class UnifiedFileManager:
    """Gestionnaire de fichiers unifié avec index de recherche"""
    
    def __init__(self):
        self.analyzed_dir = Config.ANALYZED_FILES_FOLDER
        self.registry_file = os.path.join(self.analyzed_dir, "file_registry.json")
        self.index_file = os.path.join(self.analyzed_dir, "search_index.json")
        
        # Créer le répertoire s'il n'existe pas
        os.makedirs(self.analyzed_dir, exist_ok=True)
        
        # Charger le registre et l'index
        self.registry = self._load_registry()
        self.search_index = self._load_search_index()
        
        # Cache pour les recherches fréquentes
        self._file_hash_cache = {}
    
    def _load_registry(self) -> Dict:
        """Charge le registre des fichiers analysés"""
        if os.path.exists(self.registry_file):
            try:
                with open(self.registry_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {"files": {}, "index": {}}
        return {"files": {}, "index": {}}
    
    def _save_registry(self):
        """Sauvegarde le registre des fichiers"""
        try:
            with open(self.registry_file, 'w', encoding='utf-8') as f:
                json.dump(self.registry, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Erreur lors de la sauvegarde du registre: {e}")
    
    def _load_search_index(self) -> Dict:
        """Charge l'index de recherche"""
        if os.path.exists(self.index_file):
            try:
                with open(self.index_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError):
                return {}
        return {}
    
    def _save_search_index(self):
        """Sauvegarde l'index de recherche"""
        try:
            with open(self.index_file, 'w', encoding='utf-8') as f:
                json.dump(self.search_index, f, indent=2, ensure_ascii=False)
        except IOError as e:
            print(f"Erreur lors de la sauvegarde de l'index: {e}")
    
    def _calculate_file_hash(self, file_path: str) -> str:
        """Calcule le hash SHA256 d'un fichier"""
        if file_path in self._file_hash_cache:
            return self._file_hash_cache[file_path]
        
        sha256 = hashlib.sha256()
        try:
            with open(file_path, 'rb') as f:
                while chunk := f.read(65536):
                    sha256.update(chunk)
            hash_value = sha256.hexdigest()
            self._file_hash_cache[file_path] = hash_value
            return hash_value
        except Exception as e:
            print(f"Erreur lors du calcul du hash pour {file_path}: {e}")
            return ""
    
    def _generate_filename(self, original_name: str, status: str) -> str:
        """Génère un nom de fichier au format YYMMDD-STATUT-nom_original"""
        date_str = datetime.now().strftime("%y%m%d")
        safe_name = original_name.replace(" ", "_").replace("/", "_").replace("\\", "_")
        return f"{date_str}-{status}-{safe_name}"
    
    def _update_search_index(self, original_name: str, analyzed_filename: str):
        """Met à jour l'index de recherche"""
        if original_name not in self.search_index:
            self.search_index[original_name] = []
        
        if analyzed_filename not in self.search_index[original_name]:
            self.search_index[original_name].append(analyzed_filename)
            self._save_search_index()
    
    def add_file(self, original_path: str, status: str = "pending", analysis: str = None, error: str = None) -> str:
        """Ajoute un fichier au système unifié"""
        if not os.path.exists(original_path):
            raise FileNotFoundError(f"Fichier introuvable: {original_path}")
        
        original_name = os.path.basename(original_path)
        file_hash = self._calculate_file_hash(original_path)
        
        # Générer le nom du fichier analysé
        analyzed_filename = self._generate_filename(original_name, status)
        analyzed_path = os.path.join(self.analyzed_dir, analyzed_filename)
        
        # Copier le fichier
        shutil.copy2(original_path, analyzed_path)
        
        # Enregistrer les métadonnées
        file_info = {
            "original_name": original_name,
            "original_path": original_path,
            "hash": file_hash,
            "status": status,
            "analysis": analysis,
            "error": error,
            "created_at": datetime.now().isoformat(),
            "analyzed_at": datetime.now().isoformat() if analysis else None
        }
        
        self.registry["files"][analyzed_filename] = file_info
        
        # Mettre à jour l'index de recherche
        self._update_search_index(original_name, analyzed_filename)
        
        # Sauvegarder
        self._save_registry()
        
        return analyzed_filename
    
    def update_file_status(self, analyzed_filename: str, new_status: str, analysis: str = None, error: str = None):
        """Met à jour le statut d'un fichier analysé"""
        if analyzed_filename not in self.registry["files"]:
            raise KeyError(f"Fichier non enregistré: {analyzed_filename}")
        
        file_info = self.registry["files"][analyzed_filename]
        original_name = file_info["original_name"]
        
        # Générer le nouveau nom de fichier
        new_filename = self._generate_filename(original_name, new_status)
        new_path = os.path.join(self.analyzed_dir, new_filename)
        old_path = os.path.join(self.analyzed_dir, analyzed_filename)
        
        # Renommer le fichier
        if os.path.exists(old_path):
            shutil.move(old_path, new_path)
        
        # Mettre à jour les métadonnées
        file_info["status"] = new_status
        file_info["analyzed_at"] = datetime.now().isoformat()
        
        if analysis is not None:
            file_info["analysis"] = analysis
        
        if error is not None:
            file_info["error"] = error
        
        # Mettre à jour le registre
        self.registry["files"][new_filename] = file_info
        if analyzed_filename != new_filename:
            del self.registry["files"][analyzed_filename]
        
        # Mettre à jour l'index
        if analyzed_filename in self.search_index.get(original_name, []):
            self.search_index[original_name].remove(analyzed_filename)
        self._update_search_index(original_name, new_filename)
        
        # Sauvegarder
        self._save_registry()
        
        return new_filename
    
    @lru_cache(maxsize=1000)
    def get_file_status(self, original_path: str) -> str:
        """Récupère le statut d'un fichier original avec cache"""
        if not os.path.exists(original_path):
            return "unregistered"
        
        original_name = os.path.basename(original_path)
        original_hash = self._calculate_file_hash(original_path)
        
        # Recherche rapide par index
        candidates = self.search_index.get(original_name, [])
        
        for candidate in candidates:
            candidate_info = self.registry["files"].get(candidate)
            if candidate_info and candidate_info["hash"] == original_hash:
                return candidate_info["status"]
        
        # Si le fichier existe mais n'est pas analysé
        return "unanalyzed"
    
    def get_file_analysis(self, original_path: str) -> Optional[Dict]:
        """Récupère l'analyse d'un fichier original"""
        if not os.path.exists(original_path):
            return None
        
        original_name = os.path.basename(original_path)
        original_hash = self._calculate_file_hash(original_path)
        
        candidates = self.search_index.get(original_name, [])
        
        for candidate in candidates:
            candidate_info = self.registry["files"].get(candidate)
            if candidate_info and candidate_info["hash"] == original_hash:
                return {
                    "status": candidate_info["status"],
                    "analysis": candidate_info.get("analysis"),
                    "error": candidate_info.get("error"),
                    "analyzed_at": candidate_info.get("analyzed_at"),
                    "file_id": candidate
                }
        
        return None
    
    def get_files_in_directory(self, directory_path: str) -> List[Dict]:
        """Récupère tous les fichiers d'un répertoire avec leur statut"""
        files = []
        
        for root, dirs, filenames in os.walk(directory_path):
            for filename in filenames:
                file_path = os.path.join(root, filename)
                relative_path = os.path.relpath(file_path, directory_path)
                
                # Utiliser le nouveau système de correspondance
                status = self.get_file_status(file_path)
                analysis_info = self.get_file_analysis(file_path)
                
                stat = os.stat(file_path)
                file_info = {
                    "path": file_path,
                    "relative_path": relative_path,
                    "status": status,
                    "size": stat.st_size,
                    "modified": datetime.fromtimestamp(stat.st_mtime).isoformat()
                }
                
                if analysis_info:
                    file_info.update({
                        "analysis": analysis_info.get("analysis"),
                        "error": analysis_info.get("error"),
                        "analyzed_at": analysis_info.get("analyzed_at"),
                        "file_id": analysis_info.get("file_id")
                    })
                else:
                    file_info.update({
                        "analysis": None,
                        "error": None,
                        "analyzed_at": None,
                        "file_id": None
                    })
                
                files.append(file_info)
        
        return files
    
    def migrate_from_old_system(self, old_file_manager):
        """Migre les fichiers de l'ancien système vers le nouveau"""
        print("Début de la migration vers le système unifié...")
        
        # Récupérer tous les fichiers de l'ancien système
        old_files = old_file_manager.registry.get_all_files()
        
        migrated_count = 0
        for file_info in old_files:
            try:
                original_path = file_info["original_path"]
                status = file_info["status"]
                analysis = file_info.get("analysis")
                error = file_info.get("error")
                
                # Ajouter au nouveau système
                self.add_file(original_path, status, analysis, error)
                migrated_count += 1
                
            except Exception as e:
                print(f"Erreur lors de la migration de {file_info.get('name', 'unknown')}: {e}")
        
        print(f"Migration terminée: {migrated_count} fichiers migrés")
        return migrated_count


# Instance globale du gestionnaire unifié
unified_file_manager = UnifiedFileManager() 