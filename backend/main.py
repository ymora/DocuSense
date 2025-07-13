import os
from openai_utils import analyse_document
from app import app

def lancer_api():
    """
    Lance le serveur Flask en mode développement.
    """
    app.run(debug=True, host="0.0.0.0", port=5000)

def analyser_fichier_localement():
    """
    Analyse un document local sans passer par l'API (mode script).
    """
    chemin_doc = os.path.join("client_files", "Exemple.docx")
    
    if not os.path.exists(chemin_doc):
        print(f"❌ Fichier non trouvé : {chemin_doc}")
        return

    resultat = analyse_document(chemin_doc)
    print("=== Analyse du document ===")
    print(resultat)

if __name__ == "__main__":
    MODE = "api"  # 🔁 Change ici entre "api" ou "local"

    if MODE == "api":
        lancer_api()
    elif MODE == "local":
        analyser_fichier_localement()
    else:
        print("❌ Mode invalide. Utilisez 'api' ou 'local'.")
