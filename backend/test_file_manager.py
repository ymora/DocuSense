#!/usr/bin/env python3
"""
Script de test pour le système de gestion des fichiers par état d'analyse
"""

import os
import tempfile
import shutil
from utils.file_manager import file_manager
from config import Config

def create_test_files():
    """Crée des fichiers de test"""
    test_files = []
    
    # Créer un dossier temporaire pour les tests
    test_dir = tempfile.mkdtemp(prefix="docusense_test_")
    
    # Créer quelques fichiers de test
    test_files_data = [
        ("document1.pdf", "Contenu du document 1"),
        ("document2.docx", "Contenu du document 2"),
        ("email1.eml", "Contenu de l'email 1"),
        ("rapport.txt", "Contenu du rapport"),
        ("contrat.pdf", "Contenu du contrat")
    ]
    
    for filename, content in test_files_data:
        file_path = os.path.join(test_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        test_files.append(file_path)
    
    return test_dir, test_files

def test_file_registration():
    """Teste l'enregistrement des fichiers"""
    print("🧪 Test d'enregistrement des fichiers...")
    
    test_dir, test_files = create_test_files()
    
    try:
        # Enregistrer chaque fichier
        file_ids = []
        for file_path in test_files:
            file_id = file_manager.add_file(file_path, file_path)
            file_ids.append(file_id)
            print(f"  ✅ Fichier enregistré: {os.path.basename(file_path)} -> {file_id}")
        
        # Vérifier que les fichiers sont dans le dossier "pending"
        pending_files = file_manager.registry.get_files_by_status("pending")
        print(f"  📁 Fichiers en attente: {len(pending_files)}")
        
        return file_ids, test_dir
        
    except Exception as e:
        print(f"  ❌ Erreur lors de l'enregistrement: {e}")
        shutil.rmtree(test_dir, ignore_errors=True)
        return [], test_dir

def test_file_status_transitions():
    """Teste les transitions d'état des fichiers"""
    print("\n🧪 Test des transitions d'état...")
    
    file_ids, test_dir = test_file_registration()
    
    if not file_ids:
        return test_dir
    
    try:
        # Tester les transitions d'état
        for i, file_id in enumerate(file_ids):
            print(f"\n  📄 Test du fichier {i+1}:")
            
            # Démarrer l'analyse
            success = file_manager.start_analysis(file_id)
            print(f"    ⏳ En cours d'analyse: {'✅' if success else '❌'}")
            
            # Simuler une analyse réussie
            if i % 2 == 0:  # Fichiers pairs réussissent
                success = file_manager.complete_analysis(file_id, f"Analyse réussie du fichier {i+1}")
                print(f"    ✅ Analyse terminée: {'✅' if success else '❌'}")
            else:  # Fichiers impairs échouent
                success = file_manager.mark_as_failed(file_id, f"Erreur lors de l'analyse du fichier {i+1}")
                print(f"    ❌ Analyse échouée: {'✅' if success else '❌'}")
        
        # Vérifier les statistiques
        stats = file_manager.get_statistics()
        print(f"\n  📊 Statistiques finales:")
        for status, data in stats.items():
            print(f"    {status}: {data['count']} fichiers, {data['total_size']} octets")
        
        return test_dir
        
    except Exception as e:
        print(f"  ❌ Erreur lors des transitions: {e}")
        return test_dir

def test_file_archiving():
    """Teste l'archivage des fichiers"""
    print("\n🧪 Test d'archivage...")
    
    file_ids, test_dir = test_file_registration()
    
    if not file_ids:
        return test_dir
    
    try:
        # Marquer quelques fichiers comme terminés
        for i, file_id in enumerate(file_ids[:2]):
            file_manager.complete_analysis(file_id, f"Analyse terminée {i+1}")
        
        # Archiver les fichiers terminés
        completed_files = file_manager.registry.get_files_by_status("completed")
        for file_info in completed_files:
            success = file_manager.archive_file(file_info["id"])
            print(f"  📦 Archivage de {file_info['name']}: {'✅' if success else '❌'}")
        
        # Vérifier les statistiques après archivage
        stats = file_manager.get_statistics()
        print(f"  📊 Fichiers archivés: {stats.get('archived', {}).get('count', 0)}")
        
        return test_dir
        
    except Exception as e:
        print(f"  ❌ Erreur lors de l'archivage: {e}")
        return test_dir

def test_directory_scanning():
    """Teste le scan de répertoire"""
    print("\n🧪 Test de scan de répertoire...")
    
    test_dir, test_files = create_test_files()
    
    try:
        # Scanner le répertoire
        files_info = file_manager.get_files_in_directory(test_dir)
        print(f"  📁 Fichiers trouvés: {len(files_info)}")
        
        for file_info in files_info:
            print(f"    📄 {file_info['relative_path']} - {file_info['status']}")
        
        return test_dir
        
    except Exception as e:
        print(f"  ❌ Erreur lors du scan: {e}")
        return test_dir

def test_cleanup():
    """Teste le nettoyage des fichiers"""
    print("\n🧪 Test de nettoyage...")
    
    try:
        # Nettoyer les anciens fichiers (plus de 0 jours pour le test)
        cleaned_count = file_manager.cleanup_old_files(0)
        print(f"  🧹 Fichiers nettoyés: {cleaned_count}")
        
    except Exception as e:
        print(f"  ❌ Erreur lors du nettoyage: {e}")

def main():
    """Fonction principale de test"""
    print("🚀 Démarrage des tests du système de gestion des fichiers")
    print("=" * 60)
    
    # Créer les dossiers nécessaires
    for state_path in Config.FILE_STATES.values():
        os.makedirs(state_path, exist_ok=True)
    
    test_dirs = []
    
    try:
        # Tests
        test_dirs.append(test_file_registration()[1])
        test_dirs.append(test_file_status_transitions())
        test_dirs.append(test_file_archiving())
        test_dirs.append(test_directory_scanning())
        test_cleanup()
        
        print("\n" + "=" * 60)
        print("✅ Tous les tests terminés avec succès!")
        
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {e}")
    
    finally:
        # Nettoyer les fichiers de test
        print("\n🧹 Nettoyage des fichiers de test...")
        for test_dir in test_dirs:
            if test_dir and os.path.exists(test_dir):
                shutil.rmtree(test_dir, ignore_errors=True)
                print(f"  📁 Supprimé: {test_dir}")

if __name__ == "__main__":
    main() 