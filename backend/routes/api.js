const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// Route pour récupérer les prompts disponibles
router.get('/prompts', (req, res) => {
  try {
    const promptsPath = path.join(__dirname, '..', 'prompts', 'prompts_list.json');
    
    if (!fs.existsSync(promptsPath)) {
      return res.json({ prompts: [] });
    }
    
    const promptsData = fs.readFileSync(promptsPath, 'utf8');
    const prompts = JSON.parse(promptsData);
    
    res.json({ prompts });
  } catch (error) {
    console.error('Erreur lors du chargement des prompts:', error);
    res.status(500).json({ error: 'Erreur lors du chargement des prompts' });
  }
});

// Route pour sélectionner un dossier
router.get('/select-folder', (req, res) => {
  const folderPath = req.query.path; // Chemin du dossier à sélectionner
  if (!folderPath) {
    return res.status(400).json({ error: 'Chemin du dossier manquant' });
  }

  fs.readdir(folderPath, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Erreur lors de la lecture du dossier' });
    }

    const fileList = files.map(file => {
      const filePath = path.join(folderPath, file);
      const stats = fs.statSync(filePath);
      return {
        id: file,
        name: file,
        status: 'unprocessed',
        selected: false,
        isDirectory: stats.isDirectory(),
      };
    });

    res.json(fileList);
  });
});

module.exports = router;