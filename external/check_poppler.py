import os
import sys

# 🔧 Remplace ce chemin par celui de ton dossier contenant pdftoppm.exe
POPPLER_PATH = r"../external/poppler-24.08.0/Library/bin/"

def check_poppler(poppler_path):
    """
    Vérifie la présence de l'exécutable 'pdftoppm' de Poppler dans un chemin donné.
    """
    exec_name = "pdftoppm.exe" if os.name == "nt" else "pdftoppm"
    exec_path = os.path.join(poppler_path, exec_name)

    if os.path.isfile(exec_path):
        return True, exec_path
    else:
        return False, f"Poppler non trouvé dans : {poppler_path}"

if __name__ == "__main__":
    ok, result = check_poppler(POPPLER_PATH)

    if ok:
        print(f"✅ Poppler trouvé : {result}")
        sys.exit(0)
    else:
        print(f"❌ Erreur : {result}")
        print("Merci de vérifier le chemin vers Poppler.")
        sys.exit(1)
