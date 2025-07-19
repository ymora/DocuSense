#!/usr/bin/env python3
"""
Script de migration vers le système unifié de fichiers analysés

Ce script migre les fichiers de l'ancien système (répertoires séparés par statut)
vers le nouveau système unifié (un seul répertoire avec nommage YYMMDD-STATUT-nom).
"""

import os
import sys
import shutil
from datetime import datetime

# Ajouter le répertoire parent au path pour les imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.file_manager import file_manager as old_file_manager
from utils.unified_file_manager import unified_file_manager


def backup_old_system():
    """Sauvegarde l'ancien système avant migration"""
    backup_dir = f"backup_old_system_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    os.makedirs(backup_dir, exist_ok=True)
    
    # Sauvegarder le répertoire file_management
    if os.path.exists("file_management"):
        shutil.copytree("file_management", os.path.join(backup_dir, "file_management"))
        print(f"✅ Ancien système sauvegardé dans {backup_dir}")
    
    return backup_dir


def migrate_system():
    """Migre l'ancien système vers le nouveau système unifié"""
    print("🚀 Début de la migration vers le système unifié...")
    
    # Sauvegarde
    backup_dir = backup_old_system()
    
    try:
        # Migration des fichiers
        migrated_count = unified_file_manager.migrate_from_old_system(old_file_manager)
        
        print(f"✅ Migration réussie: {migrated_count} fichiers migrés")
        print(f"📁 Nouveau répertoire: {unified_file_manager.analyzed_dir}")
        print(f"📄 Registre: {unified_file_manager.registry_file}")
        print(f"🔍 Index: {unified_file_manager.index_file}")
        
        # Afficher quelques statistiques
        print("\n📊 Statistiques du nouveau système:")
        status_counts = {}
        for file_info in unified_file_manager.registry["files"].values():
            status = file_info["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        
        for status, count in status_counts.items():
            print(f"  - {status}: {count} fichiers")
        
        print(f"\n💾 Sauvegarde conservée dans: {backup_dir}")
        print("⚠️  Vous pouvez supprimer cette sauvegarde une fois que vous êtes satisfait du nouveau système")
        
        return True
        
    except Exception as e:
        print(f"❌ Erreur lors de la migration: {e}")
        print(f"🔄 Restauration depuis la sauvegarde: {backup_dir}")
        
        # Restaurer depuis la sauvegarde
        if os.path.exists(os.path.join(backup_dir, "file_management")):
            if os.path.exists("file_management"):
                shutil.rmtree("file_management")
            shutil.copytree(os.path.join(backup_dir, "file_management"), "file_management")
            print("✅ Système restauré depuis la sauvegarde")
        
        return False


def test_new_system():
    """Teste le nouveau système"""
    print("\n🧪 Test du nouveau système...")
    
    # Tester la récupération des statuts
    test_files = []
    for file_info in unified_file_manager.registry["files"].values():
        if os.path.exists(file_info["original_path"]):
            test_files.append(file_info["original_path"])
            break
    
    if test_files:
        test_file = test_files[0]
        status = unified_file_manager.get_file_status(test_file)
        analysis = unified_file_manager.get_file_analysis(test_file)
        
        print(f"✅ Test réussi pour {os.path.basename(test_file)}:")
        print(f"  - Statut: {status}")
        print(f"  - Analyse disponible: {analysis is not None}")
    else:
        print("⚠️  Aucun fichier de test trouvé")


if __name__ == "__main__":
    print("🔄 Migration vers le système unifié de fichiers analysés")
    print("=" * 60)
    
    # Vérifier que l'ancien système existe
    if not os.path.exists("file_management"):
        print("❌ Ancien système non trouvé. Migration impossible.")
        sys.exit(1)
    
    # Demander confirmation
    response = input("Voulez-vous procéder à la migration ? (y/N): ")
    if response.lower() != 'y':
        print("❌ Migration annulée")
        sys.exit(0)
    
    # Procéder à la migration
    success = migrate_system()
    
    if success:
        test_new_system()
        print("\n🎉 Migration terminée avec succès!")
        print("💡 Le nouveau système est maintenant actif")
    else:
        print("\n❌ Migration échouée")
        sys.exit(1) 