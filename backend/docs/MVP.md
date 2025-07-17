# 🎯 MVP – DocuSense (Minimum Viable Product)

## Objectif
Offrir une version utilisable localement de DocuSense permettant :
- L’analyse de documents PDF ou TXT avec OpenAI,
- La génération de résumés clairs et de métadonnées essentielles,
- Une interface simple permettant à l’utilisateur d’importer un document, lancer l’analyse, et consulter les résultats.

---

## ✅ Fonctionnalités du MVP

### 1. Interface utilisateur
- 📁 Upload de document (PDF / TXT)
- 📝 Affichage du résumé et des métadonnées extraites
- 🔁 Requête manuelle à l’IA (OpenAI) après accord explicite

### 2. Backend
- Extraction de texte depuis PDF / TXT
- Appel à l’API OpenAI pour résumé + métadonnées
- Retour structuré vers le frontend (JSON)

### 3. Sécurité & confidentialité
- Traitement local uniquement
- Envoi au modèle GPT **uniquement après consentement**
- Aucune conservation des fichiers ou textes traités

---

## 🔧 Technologies retenues

| Côté | Choix | Raison |
|------|-------|--------|
| Backend | Python + Flask | Léger, rapide à prototyper |
| Frontend | React + Tailwind + shadcn/ui | Moderne, extensible |
| Traitement IA | OpenAI (GPT-4 / GPT-3.5) | Qualité d’analyse inégalée |
| Application locale | Tauri (plus tard) | Sécurisé, natif, léger |
| Formats pris en charge | `.pdf`, `.txt` | Simples, standards |

---

## 🧪 Cas d’usage testés

- Contrat de travail
- Rapport technique de chantier
- Lettre de mise en demeure
- PV d’assemblée
- Conditions générales d’assurance

---

## 🚧 À venir après le MVP

- Vérification de conformité légale
- Détection des incohérences et clauses abusives
- Mode hors ligne (analyse locale sans OpenAI)
- Envoi direct depuis smartphone
- Historique des analyses

---

## 📂 Dossier concerné
- `frontend/src/pages/Analysis.jsx`
- `backend/app.py`
- `prompts/summary_prompt.txt`
- `prompts/metadata_prompt.txt`

