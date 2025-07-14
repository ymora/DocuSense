# 🏗️ ARCHITECTURE DU PROJET — DocuSense

## 📁 Structure des dossiers

DocuSense/
├── backend/ # Scripts de traitement, analyse et API
│ ├── main.py # Point d’entrée de l’analyse
│ ├── routes.py # Routes Flask pour l’API (à venir ou en cours)
│ ├── openai_utils.py # Fonctions pour l’interface avec OpenAI
│ └── utils.py # Fonctions utilitaires (lecture fichiers, helpers)
│
├── prompts/ # Prompts personnalisés au format texte et leur catalogue
│ ├── prompts_list.json # Fichier central listant tous les prompts disponibles
│ └── email_summary_fr.txt # Exemple de prompt individuel
│
├── frontend/ # Interface utilisateur
│ ├── public/ # Fichiers statiques
│ ├── src/ # Code source React
│ │ ├── components/ # Composants UI
│ │ ├── pages/ # Pages principales
│ │ └── App.tsx # Entrée principale React
│ └── tailwind.config.js # Configuration Tailwind CSS
│
├── client_files/ # Documents de l’utilisateur à analyser (non versionnés)
│ └── Exemple.docx # Exemple de document utilisateur
│
├── docs/ # Documentation projet
│ ├── README.md # Présentation globale
│ ├── ARCHITECTURE.md # Ce fichier
│ └── DEV_NOTES.md # Notes de développement
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
|----------------|--------------------------------------------|
| **Frontend**   | React, Tailwind CSS, ShadCN, Vite          |
| **Backend**    | Python (Flask, script modulaire)           |
| **Analyse IA** | OpenAI GPT (via API)                       |
| **Desktop App**| Tauri (léger, rapide, Rust+JS)             |
| **Mobile**     | Extension future via React Native ou PWA   |

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

## 🔄 Modules à venir

- Système de feedback intégré
- Amélioration continue des prompts
- Mode hors-ligne avec IA locale (optionnel)
- Extension plugins / API tierces
- Collaboration multi-utilisateurs

---

## ✅ MVP (version minimale)

- Traitement d’un fichier DOCX local
- Envoi via OpenAI (clé API perso via `.env`)
- Résumé et extraction affichés en console
- Interface simple via terminal ou frontend React
