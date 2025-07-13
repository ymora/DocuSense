# Architecture Overview

# 🏗️ ARCHITECTURE DU PROJET — DocuSense

## 📁 Structure des dossiers

```
DocuSense/
├── backend/                     # Scripts de traitement, analyse et API
│   ├── main.py                  # Point d’entrée de l’analyse
│   ├── openai_utils.py          # Fonctions pour l’interface avec OpenAI
│   └── utils.py                 # Fonctions utilitaires
│
├── frontend/                    # Interface utilisateur
│   ├── public/                  # Fichiers statiques
│   ├── src/                     # Code source React
│   │   ├── components/          # Composants UI
│   │   ├── pages/               # Pages principales
│   │   └── App.tsx              # Entrée principale React
│   └── tailwind.config.js       # Configuration Tailwind CSS
│
├── client_files/                # Documents de l’utilisateur à analyser (non versionnés)
│   └── Exemple.docx             # Exemple de document
│
├── docs/                        # Documentation projet
│   ├── README.md                # Présentation globale
│   ├── ARCHITECTURE.md          # Ce fichier
│   └── DEV_NOTES.md             # Notes de développement
│
├── .env                         # Clé API OpenAI (non versionnée)
├── .gitignore                   # Fichiers/dossiers ignorés
├── LICENSE.md                   # Licence du projet
├── CONTRIBUTING.md              # Guide de contribution
├── package.json / tauri.conf.json / vite.config.ts
└── requirements.txt             # Dépendances Python
```

## ⚙️ Technologies principales

| Domaine        | Outils / Langages                       |
|----------------|------------------------------------------|
| **Frontend**   | React, Tailwind CSS, ShadCN, Vite        |
| **Backend**    | Python (FastAPI ou script simple)        |
| **Analyse IA** | OpenAI GPT (via API)                     |
| **Desktop App**| Tauri (léger, rapide, Rust+JS)           |
| **Mobile**     | Extension future via React Native ou PWA |

## 🔒 Données et Sécurité

- Les fichiers utilisateurs sont stockés **localement** dans `/client_files/`
- L’analyse se fait par **envoi vers l’API OpenAI**, uniquement **avec autorisation explicite**
- Aucune donnée n’est conservée en ligne
- Cryptage, sandboxing et isolation par session à venir

## 🔄 Fonctionnalités principales prévues

- 🔍 Lecture et parsing des fichiers DOCX/PDF
- 🧠 Résumé factuel par IA
- 📌 Extraction des métadonnées clés
- 🚩 Détection de clauses douteuses ou incohérences
- 📁 Historique d’analyse (non synchronisé)
- 🌍 Interface multilingue (prévue)
- 📡 Connexion possible avec smartphone (proposition en cours)

## 🔄 Modules à venir

- Système de feedback intégré
- Amélioration continue des prompts
- Mode hors-ligne avec IA locale (optionnel)
- Extension plugins / API tierces
- Collaboration multi-utilisateurs

## ✅ MVP (version minimale)

- Traitement d’un fichier DOCX local
- Envoi via OpenAI (clé API perso)
- Résumé et extraction affichés en console
- Interface simple via terminal ou frontend React
