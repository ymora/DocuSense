# DocuSense - Analyse intelligente de documents

## 📋 **Principe de fonctionnement**

### **Architecture modulaire**
DocuSense fonctionne avec une architecture client-serveur :
- **Frontend** : Interface React moderne avec TypeScript et Tailwind CSS
- **Backend** : API Flask Python pour l'analyse IA et la gestion des fichiers
- **IA** : Support d'OpenAI et Ollama (local) pour l'analyse de documents

### **Mode dégradé**
L'interface reste **entièrement visible et navigable** même sans backend connecté :
- ✅ Navigation dans l'arborescence
- ✅ Sélection de fichiers
- ✅ Affichage de l'interface
- ❌ Analyse IA des documents
- ❌ Enregistrement des fichiers dans le système
- ❌ Synchronisation des statuts

**Notification automatique** : Un message d'alerte informe l'utilisateur des limitations quand il tente d'utiliser des fonctionnalités nécessitant le backend.

## 🚀 **Utilisation**

### **Démarrage rapide**

1. **Backend** (recommandé) :
   ```bash
   cd backend
   python main.py
   ```
   Le serveur démarre sur `http://localhost:5000`

2. **Frontend** :
   ```bash
   cd frontend
   npm run dev
   ```
   L'interface est accessible sur `http://localhost:5173`

### **Utilisation sans backend**
L'interface est **toujours accessible** même sans backend :
- Ouvrez `http://localhost:5173` dans votre navigateur
- L'interface s'affiche complètement
- Un message d'alerte apparaît lors du clic sur "Choisir un dossier"
- Les fonctionnalités avancées sont désactivées

### **Fonctionnalités disponibles**

**Avec backend connecté :**
- 📁 Sélection et navigation dans les répertoires
- 🤖 Analyse IA des documents (PDF, DOCX, etc.)
- 📊 Gestion des statuts d'analyse en temps réel
- 📋 File d'analyse avec progression
- 🔄 Synchronisation automatique des statuts

**Sans backend :**
- 📁 Navigation dans l'interface
- 👀 Visualisation de l'arborescence
- ⚠️ Notifications d'état du système

## 🎨 **Interface utilisateur**

### **Panneau gauche - Navigation et sélection**

- [x] **Redimensionnement** : Largeur ajustable de 200px à 600px
- [x] **Titres organisés** : "Répertoire d'analyse" et "Arborescence" pour une meilleure structure
- [x] **Bouton dynamique** : Affiche le nom du répertoire sélectionné ou "Choisir un dossier"
- [x] **Légende permanente** : Visible en permanence à droite de l'icône de sélection
- [x] **Statut "non pris en charge"** : ⚪ pour les fichiers non enregistrés dans le système
- [x] **Actions conditionnelles** : Menu contextuel désactivé pour fichiers non pris en compte ou necessitant une selection multiple (comparaison)

### **Arborescence intelligente**

- [x] **Mode replié par défaut** : L'arborescence s'affiche repliée pour une meilleure lisibilité
- [x] **Boutons expand/collapse** : ▶ pour replié, ▼ pour déplié
- [x] **Indicateur de chargement** : Rond violet animé pendant le chargement de l'arborescence
- [x] **Statuts en temps réel** : Récupération automatique des statuts de tous les fichiers
- [x] **Indicateurs visuels** : Icônes colorées selon le statut d'analyse (fichiers uniquement)
- [x] **Navigation intuitive** : Clic pour sélectionner, double-clic pour analyser
- [x] **Protection contre les niveaux profonds** : Limitation à 10 niveaux maximum
- [x] **Limitation d'affichage** : Maximum 50 éléments par dossier pour les performances

### **Gestion des statuts et synchronisation**

- [x] **Récupération automatique** : Statuts récupérés depuis le backend pour tous les fichiers
- [x] **Cache intelligent** : Mise en cache des arborescences pour éviter les rechargements
- [x] **Synchronisation temps réel** : Mise à jour automatique des statuts toutes les 2 secondes
- [x] **Statuts hiérarchiques** : Gestion des statuts pour fichiers et dossiers
- [x] **Gestion d'erreurs** : Fallback vers "unregistered" en cas d'erreur de récupération

**Statuts d'analyse :**
- **⚪ Non pris en charge** : `text-neutral-400` - Fichier non enregistré dans le système
- **🟠 Non analysé** : `text-orange-400` - Fichier existant mais pas encore analysé
- **🟡 En attente** : `text-yellow-400` - Fichier enregistré, en attente d'analyse
- **🔵 En cours** : `text-blue-400` - Analyse en cours de traitement
- **🟢 Terminé** : `text-green-400` - Analyse terminée avec succès
- **🔴 Échec** : `text-red-400` - Analyse échouée

### **Correspondance des statuts d'analyse**

**Système de correspondance amélioré :**
- ✅ **Méthode 1** : Correspondance exacte par chemin original dans le registre
- ✅ **Méthode 2** : Correspondance par hash et nom de fichier (format HASH_nom)
- ✅ **Méthode 3** : Correspondance par format YYMMDD-HASH-nom (format historique)
- ✅ **Statut "Non analysé"** : Fichiers existants mais pas encore traités

**Formats de fichiers analysés supportés :**
- **Format actuel** : `HASH_nom_original` (ex: f95520cbecdae79814e79ba5fcbeea0c_test_file.txt)
- **Format historique** : `YYMMDD-HASH-nom_original` (ex: 250716-f95520cbecdae79814e79ba5fcbeea0c-test_file.txt)
- **Correspondance intelligente** : Reconnaissance automatique du format utilisé

**Améliorations de cohérence :**
- 🔍 **Détection automatique** : Identification des fichiers analysés même sans enregistrement
- 📊 **Statuts cohérents** : Plus de fichiers "non pris en charge" incorrects
- 🔄 **Synchronisation** : Mise à jour automatique des statuts lors du scan
- 📝 **Traçabilité** : Méthode de correspondance indiquée dans les métadonnées

### **Plan d'implémentation - Système unifié de fichiers analysés**

**Objectif :** Simplifier la correspondance et améliorer les performances

**Structure proposée :**
```
analyzed_files/
├── 250716-completed-document1.pdf
├── 250716-failed-document2.docx
├── 250716-pending-email1.eml
└── file_registry.json
```

**Format de nommage :** `YYMMDD-STATUT-nom_original`
- **Date** : Quand l'analyse a été effectuée (YYMMDD)
- **Statut** : completed, failed, pending, in_progress
- **Nom original** : Nom du fichier source

**Méthode de correspondance :**
1. **Recherche par nom** : Chercher les fichiers se terminant par `-nom_original`
2. **Vérification par hash** : Comparer le hash du fichier original avec celui stocké dans le JSON
3. **Index de recherche** : Cache en mémoire pour accélérer les recherches

**Optimisations prévues :**
- ✅ **Index en mémoire** : Recherche O(1) par nom de fichier
- ✅ **Cache LRU** : Résultats mis en cache pour éviter les re-calculs
- ✅ **Mise à jour incrémentale** : Pas de re-scan complet du répertoire
- ✅ **Migration automatique** : Conversion du système actuel vers le nouveau format

**Avantages :**
- 🚀 **Performance** : Un seul répertoire à scanner
- 🔍 **Simplicité** : Correspondance directe par nom
- 📊 **Cohérence** : Statut visible dans le nom du fichier
- 🔧 **Maintenabilité** : Structure claire et évolutive

### **Panneau de droite - File d'attente d'analyse**

- [x] **Organisation par tâches** : Fichiers groupés selon les prompts d'analyse du backend
- [x] **Redimensionnement** : Largeur ajustable de 300px à 500px
- [x] **Déplacement** : Panneau déplaçable dans l'interface
- [x] **Statuts en temps réel** : Mise à jour automatique des progressions
- [x] **Barres de progression** : Indicateurs visuels du pourcentage d'avancement
- [x] **Gestion des tâches** : Possibilité de mettre en pause, reprendre ou annuler
- [x] **Synchronisation backend** : File d'attente synchronisée avec le serveur d'analyse

### **Organisation de la file d'attente**

**Structure par prompts :**
- **Groupement intelligent** : Les fichiers sont organisés selon le type d'analyse demandée
- **Prompts du backend** : Chaque tâche correspond à un prompt d'analyse configuré
- **Types d'analyse** : Résumé, extraction de données, classification, etc.
- **Priorisation** : Les tâches sont traitées dans l'ordre de soumission
- **Mode IA** : Indication du mode utilisé (OpenAI ou Ollama local)

**Informations affichées :**
- 📄 **Nom du fichier** : Nom complet du document en cours d'analyse
- 🎯 **Type de tâche** : Prompt d'analyse appliqué (ex: "Résumé du document")
- 📊 **Progression** : Barre de progression avec pourcentage d'avancement
- 🔄 **Statut** : En attente, en cours, terminé, échec
- 🤖 **Mode IA** : OpenAI ou Ollama local selon la configuration

### **Menu contextuel et actions conditionnelles**

**Accès au menu :**
- **Clic droit** : Sur le nom d'un fichier dans l'arborescence
- **Actions disponibles** : Selon le format et la sélection de fichiers
- **Validation** : Actions envoyées en file d'attente après validation utilisateur

**Conditions d'activation :**
- ✅ **Formats supportés** : PDF, DOCX, DOC, EML, TXT, XLS, XLSX
- ✅ **Fichiers sélectionnés** : Actions disponibles selon le nombre de fichiers
- ✅ **Backend connecté** : Actions désactivées si serveur non disponible
- ✅ **Statut des fichiers** : Actions adaptées selon l'état d'enregistrement

**Types d'actions :**

**Actions d'analyse simple (1 fichier) :**
- 📝 **Résumé PDF/Word** : Résumé structuré des documents PDF ou Word
- 📧 **Synthèse Emails** : Synthèse claire et factuelle des échanges email
- 🔍 **Extraction de données** : Extraction structurée d'informations spécifiques
- 📋 **Classification** : Classification automatique selon type, secteur, urgence et confidentialité

**Actions de comparaison (2+ fichiers) :**
- 🔄 **Comparaison de documents** : Analyse comparative détaillée de contrats, polices, etc.
- 📊 **Synthèse multi-documents** : Synthèse globale et transversale de plusieurs documents
- 🎯 **Détection de différences** : Identification précise des différences et contradictions

**Prompts contextuels (1 fichier) :**
- 🎯 **Prompt général** : Analyse contextuelle basée sur le contenu du fichier
- 📋 **Prompt résumé** : Génération d'un prompt optimisé pour le résumé
- 🔍 **Prompt extraction** : Prompt spécialisé pour l'extraction de données
- ❓ **Questions pertinentes** : Génération de questions sur le document

**Actions de gestion :**
- 📋 **Enregistrer dans le système** : Ajouter le fichier à la base de données
- 🔄 **Rafraîchir le statut** : Mettre à jour l'état d'analyse
- ❌ **Annuler l'analyse** : Arrêter une analyse en cours

### **Workflow de sélection et validation**

**Étapes du processus :**

1. **Sélection de fichiers :**
   - Clic simple : Sélection d'un fichier (remplace la sélection actuelle)
   - Ctrl+clic : Ajoute/retire un fichier de la sélection multiple
   - Cmd+clic : Support Mac pour la sélection multiple
   - Clic droit : Ouverture du menu contextuel

2. **Vérification des conditions :**
   - Format de fichier supporté
   - Nombre de fichiers sélectionnés
   - Connexion au backend
   - Statut d'enregistrement des fichiers

3. **Affichage des actions :**
   - Actions d'analyse simple (1 fichier)
   - Actions de comparaison (2+ fichiers)
   - Actions de gestion (selon le contexte)

4. **Validation et envoi :**
   - Sélection de l'action par l'utilisateur
   - Vérification finale des conditions
   - Ajout automatique à la file d'attente
   - Confirmation visuelle de l'ajout

**Gestion des erreurs :**
- ⚠️ **Format non supporté** : Menu contextuel désactivé
- ⚠️ **Backend déconnecté** : Actions grisées avec message d'alerte
- ⚠️ **Fichiers non enregistrés** : Proposition d'enregistrement automatique
- ⚠️ **Sélection insuffisante** : Actions de comparaison désactivées

### **Prompts d'analyse et configuration**

**Prompts disponibles dans le backend :**

**Prompts mono-document :**
- `email_summary_fr` : Synthèse d'emails (EML)
- `pdf_word_summary_fr` : Résumé PDF/Word (PDF, DOCX, DOC)
- `data_extraction_fr` : Extraction de données (PDF, DOCX, DOC, XLS, XLSX)
- `document_classification_fr` : Classification automatique (PDF, DOCX, DOC, EML)

**Prompts multi-documents (2+ fichiers) :**
- `document_comparison_fr` : Comparaison détaillée (PDF, DOCX, DOC)
- `multi_document_synthesis_fr` : Synthèse transversale (PDF, DOCX, DOC, EML)
- `difference_detection_fr` : Détection de différences (PDF, DOCX, DOC)

**Configuration des prompts :**
- **Catégories** : Résumé, Extraction, Classification, Analyse, Synthèse
- **Langues** : Français (fr)
- **Limites** : 3000-7000 caractères selon le type
- **Types de documents** : Spécifiques à chaque prompt
- **Validation** : Vérification automatique du nombre minimum de documents

### **Prompts contextuels aux fichiers**

**Fonctionnalité :**
- 🎯 **Génération intelligente** : Création de prompts adaptés au contenu du fichier
- 📝 **Analyse contextuelle** : Prise en compte du contenu pour personnaliser les prompts
- 🔄 **Types variés** : Différents types de prompts selon les besoins

**Types de prompts contextuels :**
- **Général** : Analyse contextuelle basée sur le contenu
- **Résumé** : Prompt optimisé pour la création de résumés
- **Extraction** : Spécialisé pour l'extraction d'informations clés
- **Classification** : Pour la catégorisation automatique
- **Questions** : Génération de questions pertinentes
- **Points d'action** : Identification des actions à entreprendre

**Utilisation :**
- Clic droit sur un fichier → "Prompts contextuels"
- Sélection du type de prompt souhaité
- Génération automatique basée sur le contenu
- Affichage du prompt généré avec options de copie et d'analyse
- Intégration possible avec les analyses IA existantes

### **Sélection de fichiers et navigation**

**Modes de sélection :**
- **Clic simple** : Sélection d'un fichier (remplace la sélection actuelle)
- **Ctrl+clic** : Ajoute/retire un fichier de la sélection multiple
- **Cmd+clic** : Support Mac pour la sélection multiple
- **Clic droit** : Ouverture du menu contextuel avec actions disponibles

**Indicateurs visuels :**
- ✅ **Fichier sélectionné** : Icône de validation violette
- 🔢 **Numérotation** : Numéro d'ordre pour les sélections multiples
- 💡 **Conseils** : Indication "Utilisez Ctrl+clic pour sélectionner plusieurs fichiers"
- 🎯 **Actions adaptées** : Menu contextuel adapté au nombre de fichiers sélectionnés

**Actions selon la sélection :**
- **1 fichier** : Analyses simples, prompts contextuels, actions de gestion
- **2+ fichiers** : Analyses comparatives, synthèses multi-documents
- **Aucun fichier** : Actions limitées aux fonctions générales

### **Raccourcis clavier**

**Navigation et sélection :**
- **Clic simple** : Sélectionner un fichier
- **Ctrl+clic** : Ajouter/retirer un fichier de la sélection multiple
- **Cmd+clic** : Sélection multiple sur Mac
- **Clic droit** : Ouvrir le menu contextuel
- **Double-clic** : Analyser le fichier avec le premier prompt disponible

**Actions rapides :**
- **Ctrl+A** : Sélectionner tous les fichiers
- **Échap** : Désélectionner tous les fichiers et fermer le menu contextuel
- **F5** : Rafraîchir l'arborescence et les statuts des fichiers

**Interface :**
- **Indicateurs visuels** : Conseils affichés dans l'interface pour les raccourcis
- **Numérotation** : Numéros d'ordre pour les sélections multiples
- **Feedback visuel** : Confirmation des actions par des indicateurs

### **Gestion de la déconnexion backend**

**Interface en mode dégradé :**
- ✅ **Interface toujours visible** : L'application reste fonctionnelle même sans backend
- ✅ **Navigation préservée** : Sélection de dossiers et navigation dans l'arborescence
- ✅ **Messages informatifs** : Notifications claires sur l'état de la connexion

**Notifications visuelles :**
- 🔴 **Bannière d'alerte** : Notification rouge en haut du panneau gauche
- ⚠️ **Messages d'erreur** : Alertes détaillées avec instructions de résolution
- 🔴 **Indicateurs dans les menus** : Messages dans le menu contextuel
- 🔴 **File d'attente** : Notification dans le panneau de droite
- 🟣 **Rond violet tournant** : Indicateur de chargement de l'arborescence

**Fonctionnalités désactivées sans backend :**
- ❌ Analyse IA des documents
- ❌ Enregistrement des fichiers dans le système
- ❌ Synchronisation des statuts
- ❌ Gestion de la file d'attente d'analyse

**Instructions de reconnexion :**
- Messages automatiques avec étapes de résolution
- Instructions pour démarrer le backend (`python main.py`)
- Reconnexion automatique une fois le backend disponible
