import os
import time

UPLOAD_FOLDER = "uploads"
RETENTION_DAYS = 7
SECONDS_IN_DAY = 86400

def list_old_files():
    now = time.time()
    cutoff = now - (RETENTION_DAYS * SECONDS_IN_DAY)
    old_files = []

    for filename in os.listdir(UPLOAD_FOLDER):
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        if os.path.isfile(filepath):
            mtime = os.path.getmtime(filepath)
            if mtime < cutoff:
                old_files.append(filename)
    return old_files

def main():
    old_files = list_old_files()
    if not old_files:
        print("Aucun fichier à supprimer.")
        return

    print("Fichiers plus vieux que 7 jours :")
    for f in old_files:
        print(f" - {f}")

    answer = input("Confirmez-vous la suppression de ces fichiers ? (oui/non) : ").strip().lower()
    if answer in ("oui", "o", "yes", "y"):
        for f in old_files:
            os.remove(os.path.join(UPLOAD_FOLDER, f))
        print(f"{len(old_files)} fichiers supprimés.")
    else:
        print("Suppression annulée.")

if __name__ == "__main__":
    main()
