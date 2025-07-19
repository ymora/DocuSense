#!/usr/bin/env python3
"""
Script de test pour l'IA locale avec Ollama
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from utils.local_ai import local_ai
from utils.document_handler import process_document
import tempfile

def test_ollama_connection():
    """Test de la connexion à Ollama"""
    print("🔍 Test de connexion à Ollama...")
    
    if local_ai.is_available():
        print("✅ Ollama est disponible")
        models = local_ai.get_available_models()
        print(f"📋 Modèles disponibles: {models}")
        return True
    else:
        print("❌ Ollama n'est pas disponible")
        print("💡 Assurez-vous qu'Ollama est installé et en cours d'exécution:")
        print("   ollama serve")
        return False

def test_model_download():
    """Test du téléchargement du modèle"""
    print("\n📥 Test du téléchargement du modèle...")
    
    if local_ai.ensure_model_available("llama3.1:8b"):
        print("✅ Modèle Llama 3.1 8B disponible")
        return True
    else:
        print("❌ Impossible de télécharger le modèle")
        return False

def test_analysis():
    """Test d'analyse de document"""
    print("\n🧠 Test d'analyse de document...")
    
    # Créer un document de test
    test_content = """
    CONTRAT DE TRAVAIL
    
    Entre les soussignés :
    - L'entreprise ABC, représentée par M. Dupont
    - M. Martin, employé
    
    Il est convenu ce qui suit :
    
    Article 1 - Objet
    Le présent contrat a pour objet l'embauche de M. Martin en qualité de développeur.
    
    Article 2 - Durée
    Le contrat est conclu pour une durée indéterminée à compter du 1er janvier 2024.
    
    Article 3 - Rémunération
    Le salaire mensuel brut est fixé à 3500 euros.
    
    Article 4 - Lieu de travail
    Le travail s'effectue dans les locaux de l'entreprise à Paris.
    """
    
    # Créer un fichier temporaire
    with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False) as f:
        f.write(test_content)
        temp_file = f.name
    
    try:
        # Analyser le document
        result = process_document(temp_file, "pdf_word_summary_fr", "local")
        
        if result.get('success'):
            print("✅ Analyse réussie")
            print("📄 Résultat:")
            print("-" * 50)
            print(result.get('analysis', '')[:500] + "...")
            print("-" * 50)
            return True
        else:
            print(f"❌ Erreur d'analyse: {result.get('error', 'Erreur inconnue')}")
            return False
            
    except Exception as e:
        print(f"❌ Exception lors de l'analyse: {e}")
        return False
    finally:
        # Nettoyer le fichier temporaire
        if os.path.exists(temp_file):
            os.unlink(temp_file)

def test_direct_api():
    """Test direct de l'API Ollama"""
    print("\n🔌 Test direct de l'API Ollama...")
    
    prompt = "Résume ce document en 3 points clés : Ce contrat de travail concerne l'embauche de M. Martin comme développeur pour un salaire de 3500 euros brut mensuel."
    system_role = "Tu es un assistant spécialisé dans l'analyse de documents juridiques."
    
    result = local_ai.analyze_document(prompt, system_role)
    
    if result.get('success'):
        print("✅ Test API réussi")
        print("📄 Réponse:")
        print("-" * 50)
        print(result.get('analysis', '')[:300] + "...")
        print("-" * 50)
        print(f"🤖 Modèle utilisé: {result.get('model', 'N/A')}")
        return True
    else:
        print(f"❌ Erreur API: {result.get('error', 'Erreur inconnue')}")
        return False

def main():
    """Fonction principale de test"""
    print("🧪 Tests de l'IA locale DocuSense")
    print("=" * 50)
    
    tests = [
        ("Connexion Ollama", test_ollama_connection),
        ("Téléchargement modèle", test_model_download),
        ("Test API direct", test_direct_api),
        ("Analyse document", test_analysis)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        print(f"\n🧪 {test_name}")
        print("-" * 30)
        try:
            success = test_func()
            results.append((test_name, success))
        except Exception as e:
            print(f"❌ Exception: {e}")
            results.append((test_name, False))
    
    # Résumé
    print("\n" + "=" * 50)
    print("📊 RÉSUMÉ DES TESTS")
    print("=" * 50)
    
    passed = 0
    for test_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            passed += 1
    
    print(f"\n🎯 {passed}/{len(results)} tests réussis")
    
    if passed == len(results):
        print("🎉 Tous les tests sont passés ! L'IA locale fonctionne correctement.")
    else:
        print("⚠️ Certains tests ont échoué. Vérifiez la configuration d'Ollama.")
    
    return passed == len(results)

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 