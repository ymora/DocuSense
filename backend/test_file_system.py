#!/usr/bin/env python3
"""
Script de test pour le système de gestion des fichiers par état
"""

import os
import sys
import json
from pathlib import Path

# Ajouter le répertoire parent au path pour importer les modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.file_manager import FileStateManager
from config import Config

def test_file_system():
    """Test du système de gestion des fichiers"""
    print("🧪 Test du système de gestion des fichiers par état")
    print("=" * 50)
    
    # Initialiser le gestionnaire
    file_manager = FileStateManager()
    
    # Créer un fichier de test
    test_file_path = "test_file.txt"
    with open(test_file_path, "w", encoding="utf-8") as f:
        f.write("Ceci est un fichier de test pour vérifier le système de gestion des fichiers.")
    
    print(f"📄 Fichier de test créé: {test_file_path}")
    
    try:
        # Test 1: Enregistrer un fichier
        print("\n1️⃣ Test d'enregistrement d'un fichier...")
        file_id = file_manager.add_file(test_file_path)
        print(f"✅ Fichier enregistré avec l'ID: {file_id}")
        
        # Test 2: Vérifier le statut
        print("\n2️⃣ Test de récupération du statut...")
        status = file_manager.get_file_status(test_file_path)
        print(f"✅ Statut du fichier: {status}")
        
        # Test 3: Marquer comme en cours d'analyse
        print("\n3️⃣ Test de passage en cours d'analyse...")
        success = file_manager.start_analysis(file_id)
        print(f"✅ Passage en cours d'analyse: {'Succès' if success else 'Échec'}")
        
        # Test 4: Marquer comme terminé
        print("\n4️⃣ Test de finalisation de l'analyse...")
        analysis_result = "Ce document contient des informations importantes sur le système de gestion des fichiers."
        success = file_manager.complete_analysis(file_id, analysis_result)
        print(f"✅ Finalisation de l'analyse: {'Succès' if success else 'Échec'}")
        
        # Test 5: Vérifier les statistiques
        print("\n5️⃣ Test des statistiques...")
        stats = file_manager.get_statistics()
        print(f"✅ Statistiques: {json.dumps(stats, indent=2, ensure_ascii=False)}")
        
        # Test 6: Lister les fichiers par statut
        print("\n6️⃣ Test de listing par statut...")
        completed_files = file_manager.registry.get_files_by_status("completed")
        print(f"✅ Fichiers terminés: {len(completed_files)}")
        for file_info in completed_files:
            print(f"   - {file_info['name']} (ID: {file_info['id']})")
        
        # Test 7: Vérifier la structure des répertoires
        print("\n7️⃣ Test de la structure des répertoires...")
        for status, path in Config.FILE_STATES.items():
            if os.path.exists(path):
                files_in_dir = [f for f in os.listdir(path) if os.path.isfile(os.path.join(path, f))]
                print(f"✅ {status}: {len(files_in_dir)} fichier(s) dans {path}")
            else:
                print(f"❌ {status}: Répertoire {path} n'existe pas")
        
        print("\n🎉 Tous les tests sont passés avec succès !")
        
    except Exception as e:
        print(f"❌ Erreur lors du test: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # Nettoyage
        if os.path.exists(test_file_path):
            os.remove(test_file_path)
            print(f"\n🧹 Fichier de test supprimé: {test_file_path}")

def test_directory_scanning():
    """Test du scan de répertoire"""
    print("\n" + "=" * 50)
    print("📁 Test du scan de répertoire")
    print("=" * 50)
    
    file_manager = FileStateManager()
    
    # Créer un répertoire de test avec quelques fichiers
    test_dir = "test_directory"
    os.makedirs(test_dir, exist_ok=True)
    
    test_files = [
        "document1.pdf",
        "document2.docx", 
        "image.jpg",
        "data.txt"
    ]
    
    for filename in test_files:
        filepath = os.path.join(test_dir, filename)
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"Contenu du fichier {filename}")
    
    print(f"📁 Répertoire de test créé: {test_dir}")
    print(f"📄 Fichiers créés: {', '.join(test_files)}")
    
    try:
        # Tester le scan du répertoire
        files_info = file_manager.get_files_in_directory(test_dir)
        print(f"\n✅ Scan du répertoire: {len(files_info)} fichiers trouvés")
        
        for file_info in files_info:
            print(f"   - {file_info['name']} (statut: {file_info.get('status', 'non enregistré')})")
            
    except Exception as e:
        print(f"❌ Erreur lors du scan: {e}")
    
    finally:
        # Nettoyage
        import shutil
        if os.path.exists(test_dir):
            shutil.rmtree(test_dir)
            print(f"\n🧹 Répertoire de test supprimé: {test_dir}")

if __name__ == "__main__":
    test_file_system()
    test_directory_scanning() 