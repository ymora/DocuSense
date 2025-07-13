# DocuSense - Backend Flask

## Description

Ce projet backend en Flask permet d’analyser des documents Word (.docx) à l’aide de prompts personnalisables via l’API OpenAI.

L’utilisateur peut :
- Uploader un document `.docx` à analyser.
- Choisir un prompt spécifique parmi une liste organisée.
- Recevoir un résultat d’analyse textuelle générée par OpenAI selon le prompt sélectionné.

## Structure du projet

- `app.py` : Serveur Flask exposant les endpoints API.
- `openai_utils.py` : Fonctions pour lire les documents, construire et envoyer les prompts à OpenAI.
- `prompts/` :  
  - `prompts_list.json` : liste unique de tous les prompts disponibles avec métadonnées (id, titre, catégorie, langue, description, chemin fichier).
  - fichiers `.txt` : contenu textuel des prompts utilisés lors des appels OpenAI.
- `uploads/` : dossier temporaire pour stocker les fichiers uploadés (créé automatiquement).

## Routes API

### 1. GET `/api/prompts`

- Renvoie la liste complète des prompts disponibles, avec leurs métadonnées (id, titre, catégorie, langue, description).
- Le contenu textuel complet des prompts n’est **pas** renvoyé dans cette route, seulement les métadonnées.
- Permet au frontend d’afficher la liste des prompts et leur description pour que l’utilisateur puisse choisir.

### 2. POST `/api/analyse`

- Permet d’uploader un fichier `.docx` à analyser, avec un paramètre `prompt_id` qui identifie le prompt à utiliser.
- Le serveur :
  - Vérifie la présence du fichier et du `prompt_id`.
  - Charge la liste des prompts et retrouve celui correspondant au `prompt_id`.
  - Charge le contenu texte du prompt depuis son fichier `.txt`.
  - Lit le contenu texte du document `.docx` uploadé.
  - Injecte le texte du document dans le prompt, à la place du placeholder `{{document}}`.
  - Envoie le prompt final à l’API OpenAI (modèle GPT-4) avec un contexte système.
  - Retourne la réponse générée par OpenAI dans un JSON.
- Nettoie le fichier uploadé après analyse (suppression du fichier du serveur).

## Fonctionnalités techniques

- **Upload sécurisé** des fichiers avec `werkzeug.utils.secure_filename` pour éviter les risques liés aux noms de fichiers.
- **Création automatique** du dossier `uploads/` s’il n’existe pas.
- **Gestion des erreurs** robuste :
  - Erreurs lors de l’upload ou nom de fichier vide.
  - `prompt_id` manquant ou invalide.
  - Fichier prompt introuvable.
  - Erreurs à la lecture du document `.docx`.
  - Erreurs lors de l’appel à l’API OpenAI.
- **Chargement dynamique** des prompts depuis un fichier JSON unique (`prompts_list.json`) et leurs contenus `.txt` associés.
- **Injection de contenu** document dans le prompt via un placeholder `{{document}}` pour faciliter la gestion des prompts et éviter la duplication.
- **Limitation de la taille du texte injecté** (extrait les 4000 premiers caractères du document) pour respecter les contraintes de taille des prompts OpenAI.
- Utilisation du modèle GPT-4 avec un message système pour cadrer le rôle de l’assistant (ex : assistant juridique intelligent).
- Paramètre `temperature=0.2` pour obtenir des réponses plutôt factuelles et cohérentes, peu créatives.
- **Suppression automatique** des fichiers uploadés après traitement pour ne pas saturer le serveur.
- Préparation pour un futur frontend avec affichage et modification des prompts.

## Environnement et lancement

- Le projet utilise un fichier `.env` pour la clé API OpenAI (`OPENAI_API_KEY`).
- Le serveur Flask est lancé via `python app.py` avec l’adresse `0.0.0.0` sur le port `5000`.
- Mode debug activé par défaut pour faciliter le développement.

## Améliorations et extensions possibles

- Implémentation d’une interface frontend pour choisir/modifier les prompts en direct.
- Ajout de sauvegarde des prompts personnalisés par utilisateur.
- Support de formats supplémentaires (PDF, email brut, etc.).
- Gestion des utilisateurs et authentification.
- Historique des analyses et stockage des résultats.
- Validation plus fine des fichiers uploadés (taille, format, contenu).

---

**Note :** Ce backend est un prototype fonctionnel, conçu pour être extensible et intégré dans un projet plus vaste DocuSense.

---

