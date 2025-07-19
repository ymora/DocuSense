// src/api/index.ts

export async function fetchPrompts() {
  const response = await fetch("/api/prompts");
  if (!response.ok) {
    throw new Error("Erreur lors du chargement des prompts");
  }
  return response.json();
}

export async function fetchAIStatus() {
  const response = await fetch("/api/ai-status");
  if (!response.ok) {
    throw new Error("Erreur lors de la vérification du statut IA");
  }
  return response.json();
}

export async function analyzeFile(
  filePath: string,
  promptId: string,
  iaMode: 'openai' | 'local' = 'openai',
  options: { overwrite?: boolean } = {}
) {
  console.log(`📤 Envoi analyse avec promptId = ${promptId}, mode = ${iaMode}`);
  
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_path: filePath,
      prompt_id: promptId,
      ia_mode: iaMode,
      overwrite: options.overwrite || false
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erreur serveur");
  }

  return response.json();
}

export async function analyzeMultipleFiles(
  filePaths: string[],
  promptId: string,
  iaMode: 'openai' | 'local' = 'openai'
) {
  console.log(`📤 Envoi analyse multi-documents avec promptId = ${promptId}, mode = ${iaMode}`);
  
  const response = await fetch("/api/analyze-multi", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_paths: filePaths,
      prompt_id: promptId,
      ia_mode: iaMode
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erreur serveur");
  }

  return response.json();
}

export async function getFileMetadata(filePath: string) {
  const response = await fetch("/api/file-metadata", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      file_path: filePath
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erreur serveur");
  }

  return response.json();
}

export async function sendAnalysis(
  file: File,
  promptId: string,
  options: { use_ocr?: boolean } = {}
) {
  console.log("📤 Envoi analyse avec promptId =", promptId);
  const formData = new FormData();
  formData.append("file", file);
  formData.append("prompt_id", promptId);

  if (options.use_ocr) {
    formData.append("use_ocr", "true");
  }

  const response = await fetch("/api/analyse", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erreur serveur");
  }

  return response.json();
}

export async function getTreeStructure(directoryPath: string) {
  try {
    const response = await fetch(`/api/tree-structure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ path: directoryPath }),
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la récupération de l\'arborescence');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur getTreeStructure:', error);
    return { success: false, error: error.message };
  }
}

// Gestion de la file d'analyse
export const getAnalysisQueue = async () => {
  try {
    const response = await fetch('/api/analysis-queue');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de la récupération de la file d\'analyse');
  } catch (error) {
    console.error('Erreur API getAnalysisQueue:', error);
    return [];
  }
};

export const addToAnalysisQueue = async (tasks: any[]) => {
  try {
    const response = await fetch('/api/analysis-queue', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tasks }),
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de l\'ajout à la file d\'analyse');
  } catch (error) {
    console.error('Erreur API addToAnalysisQueue:', error);
    return { success: false, error };
  }
};

export const updateAnalysisTask = async (taskId: string, updates: any) => {
  try {
    const response = await fetch(`/api/analysis-queue/${taskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de la mise à jour de la tâche');
  } catch (error) {
    console.error('Erreur API updateAnalysisTask:', error);
    return { success: false, error };
  }
};

export const clearAnalysisQueue = async () => {
  try {
    const response = await fetch('/api/analysis-queue', {
      method: 'DELETE',
    });
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors du nettoyage de la file d\'analyse');
  } catch (error) {
    console.error('Erreur API clearAnalysisQueue:', error);
    return { success: false, error };
  }
};

// Gestion des fichiers par état - CORRIGÉ pour correspondre aux routes backend
export const registerFile = async (filePath: string, originalPath?: string) => {
  try {
    const response = await fetch('/api/file-management/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_path: filePath,
        original_path: originalPath || filePath
      }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de l\'enregistrement du fichier');
  } catch (error) {
    console.error('Erreur API registerFile:', error);
    return { success: false, error };
  }
};

export const getFileStatus = async (filePath: string) => {
  try {
    const response = await fetch(`/api/file-management/status?file_path=${encodeURIComponent(filePath)}`);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de la récupération du statut');
  } catch (error) {
    console.error('Erreur API getFileStatus:', error);
    return { success: false, error };
  }
};

export const getFilesByStatus = async (status?: string) => {
  try {
    const url = status 
      ? `/api/file-management/files?status=${encodeURIComponent(status)}`
      : '/api/file-management/files';
    
    const response = await fetch(url);
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de la récupération des fichiers');
  } catch (error) {
    console.error('Erreur API getFilesByStatus:', error);
    return { success: false, error };
  }
};

export const getFileStatistics = async () => {
  try {
    const response = await fetch('/api/file-management/statistics');
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de la récupération des statistiques');
  } catch (error) {
    console.error('Erreur API getFileStatistics:', error);
    return { success: false, error };
  }
};

export const scanDirectoryWithStatus = async (directoryPath: string) => {
  try {
    const response = await fetch('/api/file-management/scan-directory', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ directory_path: directoryPath }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors du scan du répertoire');
  } catch (error) {
    console.error('Erreur API scanDirectoryWithStatus:', error);
    return { success: false, error };
  }
};

export const archiveFile = async (fileId: string) => {
  try {
    const response = await fetch('/api/file-management/archive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_id: fileId }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de l\'archivage du fichier');
  } catch (error) {
    console.error('Erreur API archiveFile:', error);
    return { success: false, error };
  }
};

export const cleanupOldFiles = async (days: number = 30) => {
  try {
    const response = await fetch('/api/file-management/cleanup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ days }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors du nettoyage des fichiers');
  } catch (error) {
    console.error('Erreur API cleanupOldFiles:', error);
    return { success: false, error };
  }
};

// Prompts contextuels
export const getContextualPrompt = async (
  filePath: string, 
  promptType: 'general' | 'summary' | 'extraction' | 'classification' | 'questions' | 'action_items' = 'general'
) => {
  try {
    const response = await fetch('/api/contextual-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file_path: filePath,
        prompt_type: promptType
      }),
    });
    
    if (response.ok) {
      return await response.json();
    }
    throw new Error('Erreur lors de la génération du prompt contextuel');
  } catch (error) {
    console.error('Erreur API getContextualPrompt:', error);
    return { success: false, error };
  }
};
