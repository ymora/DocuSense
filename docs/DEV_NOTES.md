# DEV_NOTES.md

---

## ✅ Décisions prises

- L’analyse sera effectuée par défaut via OpenAI (GPT) avec accord explicite de l’utilisateur pour chaque document.  
- Aucune donnée n’est stockée côté serveur.

- **Alternative IA interne locale** :  
  Une option sera proposée à l’utilisateur pour effectuer l’analyse via un modèle IA embarqué dans l’application, sans envoi de données à un service externe.

---

## ⚖️ Comparatif des solutions IA

| Solution                      | Avantages                                           | Inconvénients                                    |
|------------------------------|----------------------------------------------------|-------------------------------------------------|
| **OpenAI GPT (cloud)**        | - Modèle très performant et à jour                  | - Envoi de données à un service externe          |
|                              | - Facilité d’intégration via API                    | - Nécessite une connexion internet                |
|                              | - Résultats souvent plus précis                      | - Coût lié à l’utilisation de l’API               |
|                              | - Support et mises à jour assurés                    |                                                   |
|                              |                                                    |                                                   |
| **IA interne locale**         | - Confidentialité maximale (données jamais envoyées) | - Performances moindres selon matériel utilisateur |
|                              | - Fonctionne hors-ligne                              | - Modèles plus lourds à intégrer et maintenir      |
|                              | - Indépendance vis-à-vis de tiers                    | - Complexité technique plus élevée                  |
|                              |                                                    |                                                   |

---

## ⚙️ Stratégie multi-supports DocuSense – Résumé

- DocuSense démarre en priorité sur desktop (PC/Mac/Linux), plus adapté aux tâches complexes de lecture, analyse et synthèse de documents juridiques ou techniques.  
- L’interface sera pensée responsive et modulaire, basée sur React + Tailwind + shadcn/ui, pour préparer une future extension vers le web ou mobile.  
- Objectifs clés :  
  - Une expérience fluide et puissante sur ordinateur (via Electron ou Tauri).  
  - Une ouverture future vers les usages mobiles via PWA ou React Native.  
  - Une interface épurée, moderne et accessible à la fois pour experts et novices.

---

## 💡 Idées en réflexion

### Envoi facile de documents depuis smartphone vers PC

Permettre à l’utilisateur d’envoyer facilement des documents depuis son smartphone vers l’application DocuSense qui tourne sur son PC, sans passer par l’email (trop contraignant), afin d’assurer un workflow simple, rapide et sécurisé.

---

### Solutions envisagées

#### 1. Mini appli mobile dédiée (Android/iOS)

- Application mobile pour sélectionner et envoyer directement les documents vers le PC via Wi-Fi, Bluetooth ou serveur local.  
- DocuSense sur PC surveille un dossier « Entrée mobile » pour déclencher l’analyse automatique.  
- Sécurisé via authentification et chiffrement.  
- Notifications push possibles.  

*Avantages* : simplicité utilisateur, rapidité, contrôle total.  
*Inconvénients* : développement mobile additionnel, gestion réseau locale.

---

#### 2. Dossier partagé réseau / Cloud personnel

- Configuration d’un dossier sur PC accessible via réseau local (SMB) ou cloud privé (Nextcloud, Syncthing).  
- Smartphone dépose les documents dans ce dossier via client SMB ou app cloud.  
- DocuSense surveille ce dossier et analyse automatiquement les nouveaux fichiers.  

*Avantages* : pas de dev mobile spécifique, s’appuie sur outils existants, relativement simple.  
*Inconvénients* : configuration réseau/dossier à gérer, dépendance à la fiabilité réseau.

---

#### 3. Envoi simplifié via messagerie intégrée (pas email classique)

- DocuSense génère une adresse mail ou canal sécurisé unique.  
- L’utilisateur envoie les documents via smartphone à cette adresse.  
- DocuSense récupère les documents et les analyse.  

*Avantages* : simplicité d’usage, automatisation possible.  
*Inconvénients* : nécessite serveur intermédiaire (cloud), moins local.

---

## 🔧 Choix techniques et priorités MVP

- MVP basé sur desktop, interface simple, analyse via OpenAI avec accord utilisateur.  
- Prévoir surveillance d’un dossier local pour intégrer les documents mobiles (option 2), facile à implémenter rapidement.  
- Interface en React + Tailwind (modularité et évolutivité).  
- Extension mobile envisagée post-MVP via PWA ou React Native.

---

## 📌 À surveiller / À développer plus tard

- Développement d’une mini appli mobile dédiée (solution 1).  
- Mise en place d’un serveur intermédiaire sécurisé pour messagerie intégrée (solution 3).  
- Intégration avancée de la confidentialité et chiffrement bout à bout.  
- Interface collaborative et gestion multi-utilisateurs.  
- Automatisation poussée des feedbacks utilisateurs et gestion de roadmap dynamique.

---

## 📝 Notes diverses

- Toujours garder transparence sur le traitement des données utilisateurs.  
- Prévoir documentation claire sur le consentement et la sécurité.  
- Favoriser modularité dans le code pour intégrer facilement de nouvelles sources d’input.

---

*Ce fichier évoluera au fur et à mesure des échanges et du développement.*
