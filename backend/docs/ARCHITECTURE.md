# 🏗️ ARCHITECTURE DU PROJET — DocuSense

## 📁 Structure des dossiers

DocuSense/  
├── backend/ # Scripts de traitement, analyse et API  
│   ├── main.py # Point d’entrée de l’analyse  
│   ├── routes.py # Routes Flask pour l’API (à venir ou en cours)  
│   ├── openai_utils.py # Fonctions pour l’interface avec OpenAI  
│   ├── utils.py # Fonctions utilitaires (lecture fichiers, helpers)  
│   └── external/          # (optionnel) Contient les binaires Poppler si inclusion locale  
│       └── poppler/  
│           └── bin/  
│               └── ...  
│  
├── prompts/ # Prompts personnalisés au format texte et leur catalogue  
│   ├── prompts_list.json # Fichier central listant tous les prompts disponibles  
│   └── email_summary_fr.txt # Exemple de prompt individuel  
│  
├── frontend/ # Interface utilisateur  
│   ├── public/ # Fichiers statiques  
│   ├── src/ # Code source React  
│   │   ├── components/ # Composants UI  
│   │   │   ├── OCRConfirmationDialog.jsx  # Boîte de dialogue confirmation OCR  
│   │   │   └── ...  
│   │   ├── pages/ # Pages principales  
│   │   └── App.tsx # Entrée principale React  
│   └── tailwind.config.js # Configuration Tailwind CSS  
│  
├── client_files/ # Documents de l’utilisateur à analyser (non versionnés)  
│   └── Exemple.docx # Exemple de document utilisateur  
│  
├── docs/ # Documentation projet  
│   ├── README.md # Présentation globale  
│   ├── ARCHITECTURE.md # Ce fichier  
│   └── DEV_NOTES.md # Notes de développement  
│  
├── .env # Clé API OpenAI (ex : OPENAI_API_KEY=sk-...) utilisée par Flask & OpenAI  
├── .gitignore # Fichiers/dossiers ignorés  
├── LICENSE.md # Licence du projet  
├── CONTRIBUTING.md # Guide de contribution  
├── package.json / tauri.conf.json / vite.config.ts  
└── requirements.txt # Dépendances Python avec commentaires explicatifs  

---

## ⚙️ Technologies principales

| Domaine        | Outils / Langages                         |
|----------------|------------------------------------------|
| **Frontend**   | React, Tailwind CSS, ShadCN, Vite        |
| **Backend**    | Python (Flask, script modulaire)         |
| **Analyse IA** | OpenAI GPT (via API)                      |
| **Desktop App**| Tauri (léger, rapide, Rust+JS)            |
| **Mobile**     | Extension future via React Native ou PWA |

---

## 🔒 Données et Sécurité

- Les fichiers utilisateurs sont stockés **localement** dans `/client_files/`  
- L’analyse se fait par **envoi vers l’API OpenAI**, uniquement **avec autorisation explicite**  
- Aucune donnée n’est conservée en ligne  
- Traitement local des documents (aucun upload tiers)  
- Sandbox / chiffrement local à étudier  

---

## 🔄 Fonctionnalités principales prévues

- 🔍 Lecture et parsing multi-format : DOCX, PDF, EML, Excel, TXT  
- 🧠 Résumé factuel par IA basé sur prompts personnalisés  
- 📌 Extraction des métadonnées clés  
- 🚩 Détection de clauses douteuses ou incohérences  
- 📁 Historique d’analyse (non synchronisé)  
- 🌍 Interface multilingue (prévue)  
- 📡 Connexion possible avec smartphone (proposition en cours)  

---

## 🆕 OCR et gestion des documents scannés

- 🔎 **Détection automatique** : Lors de la lecture d’un PDF, si aucun texte n’est détecté, le backend renvoie un message au frontend indiquant que le document est potentiellement une image ou un scan.  
- ✅ **Confirmation utilisateur** : L’interface affiche une boîte de dialogue élégante pour demander si l’utilisateur souhaite lancer l’extraction OCR du document.  
- 🖼️ **Conversion PDF → Images** :  
  - Utilisation de `pdf2image` + `PIL` pour convertir les pages PDF en images.  
- 📝 **Extraction OCR** :  
  - L’OCR (via Tesseract, ou autre moteur si intégré) est lancé uniquement si l’utilisateur accepte.  
- 📦 **Dépendance externe** :  
  - Poppler est nécessaire pour la conversion PDF→images.  
  - Installation requise séparément (globale ou locale dans `/backend/external/poppler/`).  
  - Documentation fournie avec lien et instructions d’installation.  
- 🔄 **Flux de traitement** :  
  1. Upload et analyse classique du document.  
  2. Si texte absent et confirmation reçue → conversion PDF→images puis OCR → extraction texte → nouvelle analyse.  
- 🖥️ **Frontend** :  
  - Affiche une boîte de dialogue pour confirmation OCR (composant `OCRConfirmationDialog.jsx`).  
  - En fonction de la réponse, relance la requête API avec flag OCR activé.

---

## 📦 Dépendances et prérequis

- **Python packages** :  
  - `Flask` >= 2.3.0  
  - `Werkzeug` >= 2.3.0  
  - `openai` >= 1.2.3  
  - `python-dotenv` >= 1.0.0  
  - `python-docx` >= 0.8.11  
  - `pymupdf` (alias `fitz`) >= 1.22.0  
  - `pandas` >= 2.0.0  
  - `openpyxl` >= 3.1.0  
  - `xlrd` >= 2.0.1  
  - `chardet` >= 5.1.0 (optionnel)  
  - `pdf2image` >= 1.17.0  
  - `Pillow` >= 11.3.0  

- **Outils externes** :  
  - **Poppler** (nécessaire pour `pdf2image`)  
    - À installer séparément (non disponible via pip)  
    - [https://poppler.freedesktop.org/](https://poppler.freedesktop.org/)  
    - Peut être inclus dans le projet sous `/backend/external/poppler/` pour portabilité, ou installé globalement.  

- **Outils de dev (optionnels)** :  
  - `ipython` >= 8.10.0  
  - `python-magic-bin` (Windows uniquement)  

---

## ✅ MVP (version minimale)

- Traitement d’un fichier DOCX local  
- Envoi via OpenAI (clé API perso via `.env`)  
- Résumé et extraction affichés en console ou frontend React simple  
- Gestion basique des erreurs et validations  
- **Ajout OCR avec confirmation utilisateur pour les PDF scannés** (optionnel, selon retour utilisateur)

---

## 📚 Documentation et notes

- `docs/README.md` : Présentation globale du projet  
- `docs/ARCHITECTURE.md` : Ce fichier, pour la structure et fonctionnement global  
- `docs/DEV_NOTES.md` : Notes et astuces techniques de développement  

---

Si tu veux, je peux aussi te générer la doc complémentaire d’installation de Poppler, et un exemple simple de dialogue confirmation OCR côté React.  
Tu en penses quoi ?  
