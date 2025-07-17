frontend/src/
│
├── App.tsx ✅ Point d’entrée
├── api.ts ✅ Fonctions `fetchPrompts`, `sendAnalysis`
├── components/
│   ├── TopBar.tsx ✅ (logo, sélecteur de mode IA, profil)
│   ├── LeftPanel.tsx ✅ (liste fichiers, drag & drop)
│   ├── MainPanel.tsx ✅ (résumé fichier + prompts)
│   ├── RightPanel.tsx ✅ (actions synthèse, reanalyse…)
│   ├── FileItem.tsx ✅ (composant individuel pour chaque fichier)
│   └── DropZone.tsx ✅ (zone de glisser-déposer)
