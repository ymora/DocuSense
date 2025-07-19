/**
 * Application principale DocuSense
 * 
 * Fonctionnalités :
 * - Sélection et gestion de répertoires
 * - Affichage de l'arborescence avec indicateurs d'état
 * - Analyse de fichiers avec IA
 * - Statistiques en temps réel
 * - Gestion des fichiers par état d'analyse
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFileManager } from './hooks/useFileManager';
import { fetchPrompts, getAnalysisQueue, addToAnalysisQueue, clearAnalysisQueue, getContextualPrompt } from './api';
import { FileInfo, AnalysisTask, ContextualPrompt, PromptType } from './types';
import TopBar from './components/TopBar';

function App() {
  // États principaux
  const [backendStatus, setBackendStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const [selectedMode, setSelectedMode] = useState('openai');
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
  }>({ visible: false, x: 0, y: 0 });
  const [prompts, setPrompts] = useState<any[]>([]);

  // Référence pour l'input de sélection de fichier
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Référence pour le panneau de file d'attente
  const queuePanelRef = useRef<HTMLDivElement>(null);

  // Gestionnaire de fichiers avec le nouveau système
  const {
    files,
    selectedFiles,
    treeData,
    selectedDirectory,
    isLoading,
    statistics,
    selectedFileInfos,
    hasSelectedFiles,
    hasFiles,
    buildTreeWithCache,
    handleFileSelect,
    handleFileDeselect,
    clearSelection,
    selectAllFiles,
    updateFileStatus,
    registerFileInSystem,
    refreshFileStatuses,
    setSelectedDirectory
  } = useFileManager();

  // États pour le redimensionnement du panneau gauche
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [isDragging, setIsDragging] = useState(false);
  
  // État pour gérer l'expansion des dossiers
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // File d'analyse - synchronisée avec le backend
  const [analysisQueue, setAnalysisQueue] = useState<AnalysisTask[]>([]);
  const [isQueueVisible, setIsQueueVisible] = useState(true);
  const [isQueueExpanded, setIsQueueExpanded] = useState(true);
  const [isQueuePaused, setIsQueuePaused] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // États pour les prompts contextuels
  const [contextualPrompt, setContextualPrompt] = useState<ContextualPrompt | null>(null);
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [showContextualPrompt, setShowContextualPrompt] = useState(false);

  // États pour la file d'analyse déplaçable et redimensionnable
  const [queuePosition, setQueuePosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 300 });
  const [queueSize, setQueueSize] = useState({ width: 400, height: 300 });
  const [isQueueDragging, setIsQueueDragging] = useState(false);
  const [isQueueResizing, setIsQueueResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Vérification du statut du backend
  useEffect(() => {
    const checkBackendStatus = async () => {
      try {
        const response = await fetch('/api/health');
        setBackendStatus(response.ok ? 'connected' : 'disconnected');
      } catch (error) {
        setBackendStatus('disconnected');
      }
    };

    checkBackendStatus();
    const interval = setInterval(checkBackendStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Chargement des prompts
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const promptsData = await fetchPrompts();
        setPrompts(promptsData);
      } catch (error) {
        console.error('Erreur lors du chargement des prompts:', error);
        // Garder les prompts existants ou utiliser des prompts par défaut
        if (prompts.length === 0) {
          setPrompts([
            { id: 'default', name: 'Analyse générale', description: 'Analyse basique du document' }
          ]);
        }
      }
    };

    // Charger les prompts même si le backend n'est pas connecté
    loadPrompts();
  }, [backendStatus, prompts.length]);

  // Chargement de la file d'analyse depuis le backend
  useEffect(() => {
    const loadAnalysisQueue = async () => {
      if (backendStatus === 'connected') {
        try {
          const queue = await getAnalysisQueue();
          setAnalysisQueue(queue);
        } catch (error) {
          console.error('Erreur lors du chargement de la file d\'analyse:', error);
          // Garder la file d'analyse existante en cas d'erreur
        }
      }
    };

    loadAnalysisQueue();
    
    // Synchronisation en temps réel de la file d'analyse
    const interval = setInterval(loadAnalysisQueue, 2000); // Toutes les 2 secondes
    
    return () => clearInterval(interval);
  }, [backendStatus]);

  // Gestion de la sélection de répertoire
  const handleDirectorySelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (!selectedFiles) return;

    // Construire l'arborescence avec le nouveau système
    const directoryName = selectedFiles[0]?.webkitRelativePath.split('/')[0] || 'Documents';
    setSelectedDirectory(directoryName);
    
    // Construire l'arborescence avec cache et statuts du backend
    await buildTreeWithCache(Array.from(selectedFiles), directoryName);
  }, [buildTreeWithCache, setSelectedDirectory]);

  // Gestion de la sélection de répertoire avec webkitdirectory
  const handleDirectorySelectWithWebkit = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('handleDirectorySelectWithWebkit appelé');
    const selectedFiles = event.target.files;
    console.log('Fichiers sélectionnés:', selectedFiles);
    
    if (!selectedFiles) {
      console.log('Aucun fichier sélectionné');
      return;
    }

    // Construire l'arborescence avec le nouveau système
    const directoryName = selectedFiles[0]?.webkitRelativePath.split('/')[0] || 'Documents';
    console.log('Nom du répertoire:', directoryName);
    setSelectedDirectory(directoryName);
    
    // Construire l'arborescence avec cache et statuts du backend
    console.log('Appel de buildTreeWithCache...');
    await buildTreeWithCache(Array.from(selectedFiles), directoryName);
    console.log('buildTreeWithCache terminé');
  }, [buildTreeWithCache, setSelectedDirectory]);

  // Fonction pour obtenir les détails des éléments sélectionnés
  const getSelectedItemsDetails = useCallback(() => {
    const selectedItems: Array<{ path: string; type: 'file' | 'directory'; name: string }> = [];
    
    selectedFiles.forEach((path) => {
      // Vérifier si c'est un fichier supporté ou un répertoire
      const isDirectory = path.endsWith('/') || !path.includes('.');
      selectedItems.push({
        path: path,
        type: isDirectory ? 'directory' : 'file',
        name: path.split('/').pop() || path
      });
    });
    
    return selectedItems;
  }, [selectedFiles, treeData]);

  // Fonction pour vérifier si les fichiers sélectionnés sont pris en compte
  const areSelectedFilesRegistered = useCallback(() => {
    const selectedItems = getSelectedItemsDetails();
    const filesToCheck = selectedItems.filter(item => item.type === 'file');
    
    if (filesToCheck.length === 0) return false;
    
    return filesToCheck.every(file => {
      const fileInfo = files.find(f => f.path === file.path);
      return fileInfo && fileInfo.status !== 'unregistered';
    });
  }, [getSelectedItemsDetails, files]);

  // Gestion du clic droit
  const handleContextMenu = useCallback((event: React.MouseEvent, filePath: string) => {
    event.preventDefault();
    
    // Vérifier si le fichier est supporté
    const isFileSupported = (filePath: string) => {
      const supportedExtensions = ['pdf', 'docx', 'doc', 'eml', 'txt', 'xls', 'xlsx'];
      const extension = filePath.split('.').pop()?.toLowerCase();
      return extension && supportedExtensions.includes(extension);
    };
    
    // Empêcher le menu contextuel pour les fichiers non gérés
    if (filePath.includes('.') && !isFileSupported(filePath)) {
      console.log('Menu contextuel ignoré pour fichier non supporté:', filePath);
      return;
    }
    
    // Si le fichier n'est pas sélectionné, le sélectionner (remplacer la sélection actuelle)
    if (!selectedFiles.has(filePath)) {
      handleFileSelect(filePath, false);
    }

    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY
    });
  }, [selectedFiles, handleFileSelect]);

  // Gestion de la sélection de fichiers
  const handleFileSelection = useCallback((filePath: string, event: React.MouseEvent) => {
    const isCtrlPressed = event.ctrlKey || event.metaKey; // Support Ctrl (Windows/Linux) et Cmd (Mac)
    const isShiftPressed = event.shiftKey;
    
    if (isCtrlPressed) {
      // Sélection multiple : ajouter/retirer de la sélection
      if (selectedFiles.has(filePath)) {
        handleFileDeselect(filePath);
      } else {
        handleFileSelect(filePath, true);
      }
    } else if (isShiftPressed && selectedFiles.size > 0) {
      // Sélection de plage avec Shift (à implémenter si nécessaire)
      // Pour l'instant, on traite comme une sélection simple
      handleFileSelect(filePath, false);
    } else {
      // Sélection simple : remplacer la sélection actuelle
      handleFileSelect(filePath, false);
    }
  }, [selectedFiles, handleFileSelect, handleFileDeselect]);

  // Gestion de l'analyse de fichiers
  const handleAnalyzeFiles = useCallback(async (promptId: string, iaMode: 'openai' | 'local' = 'openai') => {
    if (!hasSelectedFiles) return;

    const selectedItems = getSelectedItemsDetails();
    const filesToAnalyze = selectedItems.filter(item => item.type === 'file');

    if (filesToAnalyze.length === 0) {
      console.log('Aucun fichier à analyser');
      return;
    }

    // Vérifier si le backend est connecté
    if (backendStatus !== 'connected') {
      alert('⚠️ Backend non connecté\n\nImpossible d\'analyser les fichiers car le serveur backend n\'est pas disponible.\n\nPour activer l\'analyse IA :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
      return;
    }

    setIsAnalyzing(true);

    try {
      // Enregistrer les fichiers non enregistrés dans le système
      for (const file of filesToAnalyze) {
        const fileInfo = files.find(f => f.path === file.path);
        if (fileInfo && fileInfo.status === 'unregistered') {
          await registerFileInSystem(file.path);
        }
      }

      // Ajouter à la file d'analyse
      const tasks = filesToAnalyze.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        filePath: file.path,
        fileName: file.name,
        status: 'pending' as const,
        progress: 0,
        promptId: promptId,
        iaMode: iaMode
      }));

      await addToAnalysisQueue(tasks);

      // Fermer le menu contextuel
      setContextMenu({ visible: false, x: 0, y: 0 });

      console.log(`Analyse lancée pour ${filesToAnalyze.length} fichier(s) avec le prompt ${promptId}`);
    } catch (error) {
      console.error('Erreur lors du lancement de l\'analyse:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors du lancement de l'analyse: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [hasSelectedFiles, backendStatus, getSelectedItemsDetails, files, registerFileInSystem, addToAnalysisQueue]);

  // Gestion du double-clic sur un fichier
  const handleFileDoubleClick = useCallback(async (filePath: string) => {
    // Vérifier si c'est un fichier supporté
    const isFileSupported = (filePath: string) => {
      const supportedExtensions = ['pdf', 'docx', 'doc', 'eml', 'txt', 'xls', 'xlsx'];
      const extension = filePath.split('.').pop()?.toLowerCase();
      return extension && supportedExtensions.includes(extension);
    };
    
    if (!isFileSupported(filePath)) {
      console.log('Double-clic ignoré pour fichier non supporté:', filePath);
      return;
    }
    
    // Sélectionner le fichier
    handleFileSelect(filePath, false);
    
    // Vérifier si le backend est connecté avant d'analyser
    if (backendStatus !== 'connected') {
      alert('⚠️ Backend non connecté\n\nImpossible d\'analyser le fichier car le serveur backend n\'est pas disponible.\n\nPour activer l\'analyse IA :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
      return;
    }
    
    // Analyser avec le premier prompt disponible
    if (prompts.length > 0) {
      const firstPrompt = prompts[0];
      await handleAnalyzeFiles(firstPrompt.id, selectedMode as 'openai' | 'local');
    } else {
      alert('Aucun prompt disponible pour l\'analyse.');
    }
  }, [prompts, backendStatus, selectedMode, handleFileSelect, handleAnalyzeFiles]);

  // Actions rapides
  const handleRegisterSelectedFiles = useCallback(async () => {
    if (!hasSelectedFiles) return;

    // Vérifier si le backend est connecté
    if (backendStatus !== 'connected') {
      alert('⚠️ Backend non connecté\n\nImpossible d\'enregistrer les fichiers car le serveur backend n\'est pas disponible.\n\nPour activer l\'enregistrement :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
      return;
    }

    const selectedItems = getSelectedItemsDetails();
    const filesToRegister = selectedItems.filter(item => item.type === 'file');

    for (const file of filesToRegister) {
      const fileInfo = files.find(f => f.path === file.path);
      if (fileInfo && fileInfo.status === 'unregistered') {
        try {
          await registerFileInSystem(file.path);
        } catch (error) {
          console.error(`Erreur lors de l'enregistrement de ${file.name}:`, error);
        }
      }
    }
  }, [hasSelectedFiles, backendStatus, getSelectedItemsDetails, files, registerFileInSystem]);

  const handleViewAnalyses = useCallback(() => {
    // Vérifier si le backend est connecté
    if (backendStatus !== 'connected') {
      alert('⚠️ Backend non connecté\n\nImpossible d\'afficher les analyses car le serveur backend n\'est pas disponible.\n\nPour accéder aux analyses :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
      return;
    }
    
    // Ouvrir une nouvelle fenêtre ou onglet pour voir les analyses
    window.open('/api/analyzed-files', '_blank');
  }, [backendStatus]);

  const handleClearQueue = useCallback(async () => {
    if (analysisQueue.length === 0) return;

    // Vérifier si le backend est connecté
    if (backendStatus !== 'connected') {
      alert('⚠️ Backend non connecté\n\nImpossible de nettoyer la file car le serveur backend n\'est pas disponible.\n\nPour gérer la file d\'analyse :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
      return;
    }

    try {
      await clearAnalysisQueue();
      setAnalysisQueue([]);
    } catch (error) {
      console.error('Erreur lors du nettoyage de la file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors du nettoyage de la file: ${errorMessage}`);
    }
  }, [analysisQueue.length, backendStatus, clearAnalysisQueue]);

  // Gestion des prompts contextuels
  const handleGenerateContextualPrompt = useCallback(async (filePath: string, promptType: PromptType = 'general') => {
    // Vérifier si le backend est connecté
    if (backendStatus !== 'connected') {
      alert('⚠️ Backend non connecté\n\nImpossible de générer un prompt contextuel car le serveur backend n\'est pas disponible.\n\nPour activer cette fonctionnalité :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
      return;
    }

    setIsGeneratingPrompt(true);
    try {
      const result = await getContextualPrompt(filePath, promptType);
      if (result.success) {
        setContextualPrompt(result);
        setShowContextualPrompt(true);
      } else {
        alert(`Erreur lors de la génération du prompt: ${result.error}`);
      }
    } catch (error) {
      console.error('Erreur lors de la génération du prompt contextuel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      alert(`Erreur lors de la génération du prompt contextuel: ${errorMessage}`);
    } finally {
      setIsGeneratingPrompt(false);
    }
  }, [backendStatus]);

  // Fermer le menu contextuel en cliquant ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu({ visible: false, x: 0, y: 0 });
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu.visible]);

  // Gestion des raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Échap : Désélectionner tous les fichiers
      if (event.key === 'Escape') {
        clearSelection();
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
      
      // Ctrl+A : Sélectionner tous les fichiers
      if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
        event.preventDefault();
        if (hasFiles) {
          selectAllFiles();
        }
      }
      
      // F5 : Rafraîchir l'arborescence
      if (event.key === 'F5') {
        event.preventDefault();
        if (selectedDirectory) {
          refreshFileStatuses();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [clearSelection, hasFiles, selectAllFiles, selectedDirectory, refreshFileStatuses]);

  // Gestion du redimensionnement du panneau gauche
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      const newWidth = e.clientX;
      if (newWidth >= 200 && newWidth <= 600) {
        setLeftPanelWidth(newWidth);
      }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Gestion du déplacement de la file d'analyse
  const handleQueueMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).closest('.queue-header')) {
      setIsQueueDragging(true);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      e.preventDefault();
    }
  }, []);

  const handleQueueMouseMove = useCallback((e: MouseEvent) => {
    if (isQueueDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Limiter la position aux bords de l'écran
      const maxX = window.innerWidth - queueSize.width;
      const maxY = window.innerHeight - queueSize.height;
      
      setQueuePosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isQueueDragging, dragOffset, queueSize]);

  const handleQueueMouseUp = useCallback(() => {
    setIsQueueDragging(false);
    setIsQueueResizing(false);
  }, []);

  // Gestion du redimensionnement de la file d'analyse
  const handleQueueResizeMouseDown = useCallback((e: React.MouseEvent) => {
    setIsQueueResizing(true);
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleQueueResizeMouseMove = useCallback((e: MouseEvent) => {
    if (isQueueResizing) {
      const newWidth = e.clientX - queuePosition.x;
      const newHeight = e.clientY - queuePosition.y;
      
      // Limiter la taille minimale et maximale
      const minWidth = 300;
      const minHeight = 200;
      const maxWidth = window.innerWidth - queuePosition.x;
      const maxHeight = window.innerHeight - queuePosition.y;
      
      setQueueSize({
        width: Math.max(minWidth, Math.min(newWidth, maxWidth)),
        height: Math.max(minHeight, Math.min(newHeight, maxHeight))
      });
    }
  }, [isQueueResizing, queuePosition]);

  useEffect(() => {
    if (isQueueDragging || isQueueResizing) {
      document.addEventListener('mousemove', isQueueDragging ? handleQueueMouseMove : handleQueueResizeMouseMove);
      document.addEventListener('mouseup', handleQueueMouseUp);
      return () => {
        document.removeEventListener('mousemove', isQueueDragging ? handleQueueMouseMove : handleQueueResizeMouseMove);
        document.removeEventListener('mouseup', handleQueueMouseUp);
      };
    }
  }, [isQueueDragging, isQueueResizing, handleQueueMouseMove, handleQueueResizeMouseMove, handleQueueMouseUp]);

  // Rendu de l'arborescence
  const renderTreeNode = (node: any, level: number = 0) => {
    // Protection contre les nœuds invalides
    if (!node || !node.path || !node.name) {
      return null;
    }

    // Protection contre les niveaux trop profonds
    if (level > 10) {
      return null;
    }

    const isSelected = selectedFiles.has(node.path);
    const isFile = node.type === 'file';
    const isExpanded = expandedFolders.has(node.path);
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
            isSelected ? 'bg-violet-600/30 text-violet-200' : 'text-neutral-300'
          } cursor-pointer hover:bg-violet-600/20`}
          onClick={(e) => handleFileSelection(node.path, e)}
          onContextMenu={(e) => handleContextMenu(e, node.path)}
          onDoubleClick={() => handleFileDoubleClick(node.path)}
          title={`${isFile ? 'Fichier' : 'Répertoire'}: ${node.name}${isFile ? ' - Double-clic pour analyser' : ''}`}
        >
          {/* Bouton expand/collapse pour les dossiers */}
          {!isFile && hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newExpanded = new Set(expandedFolders);
                if (isExpanded) {
                  newExpanded.delete(node.path);
                } else {
                  newExpanded.add(node.path);
                }
                setExpandedFolders(newExpanded);
              }}
              className="text-neutral-400 hover:text-neutral-200 text-xs w-4 h-4 flex items-center justify-center"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          
          {/* Espaceur pour les fichiers */}
          {isFile && <div className="w-4" />}
          
          {/* Indicateur de statut - seulement pour les fichiers */}
          {isFile && node.status && (
            <span className={`text-xs ${
              node.status === 'pending' ? 'text-yellow-400' :
              node.status === 'in_progress' ? 'text-blue-400' :
              node.status === 'completed' ? 'text-green-400' :
              node.status === 'failed' ? 'text-red-400' :
              node.status === 'unanalyzed' ? 'text-orange-400' :
              'text-neutral-400'
            }`}>
              {node.status === 'pending' ? '🟡' :
               node.status === 'in_progress' ? '🔵' :
               node.status === 'completed' ? '🟢' :
               node.status === 'failed' ? '🔴' :
               node.status === 'unanalyzed' ? '🟠' : '⚪'}
            </span>
          )}
          
          <span className="text-sm">
            {isFile ? '📄' : '📁'}
          </span>
          
          <span className="flex-1 min-w-0 truncate text-sm">
            {node.name}
          </span>
          
          {/* Indicateur de sélection */}
          {isSelected && (
            <span className="flex-shrink-0 text-violet-400 text-xs">
              ✓
            </span>
          )}
          
          {/* Indicateur de sélection multiple */}
          {selectedFiles.size > 1 && isSelected && (
            <span className="flex-shrink-0 text-violet-300 text-xs ml-1">
              {Array.from(selectedFiles).indexOf(node.path) + 1}
            </span>
          )}
        </div>
        
        {/* Rendu récursif des enfants avec protection - seulement si déplié */}
        {!isFile && hasChildren && isExpanded && (
          <div>
            {node.children.slice(0, 50).map((child: any) => renderTreeNode(child, level + 1))}
            {node.children.length > 50 && (
              <div className="text-xs text-neutral-500 px-2 py-1">
                ... et {node.children.length - 50} autres éléments
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-screen bg-neutral-900 text-white flex flex-col">
      {/* Barre supérieure */}
      <TopBar
        backendStatus={backendStatus}
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        isQueueVisible={isQueueVisible}
        onToggleQueue={() => setIsQueueVisible(!isQueueVisible)}
      />

      {/* Contenu principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panneau gauche - Sélection de répertoire et arborescence */}
        <div className="bg-neutral-900 text-white p-4 min-w-[200px] max-w-[600px] flex flex-col">
          {/* Titre Répertoire d'analyse */}
          <div className="text-lg font-semibold mb-3 text-neutral-200">
            Répertoire d'analyse
          </div>

          {/* Notification de statut backend */}
          {backendStatus === 'disconnected' && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-lg">
              <div className="flex items-center gap-2 text-red-300">
                <span className="text-lg">⚠️</span>
                <div>
                  <div className="font-medium text-sm">Backend déconnecté</div>
                  <div className="text-xs text-red-400">
                    L'analyse IA n'est pas disponible. L'interface reste fonctionnelle pour la navigation.
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Sélecteur de répertoire */}
          <div className="mb-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleDirectorySelectWithWebkit}
              {...{ webkitdirectory: "" }}
              className="hidden"
            />
            <button
              onClick={() => {
                console.log('Bouton "Choisir un dossier" cliqué');
                if (backendStatus !== 'connected') {
                  alert('⚠️ Backend non connecté\n\nL\'interface reste visible et fonctionnelle pour la navigation, mais les fonctionnalités suivantes ne sont pas disponibles :\n\n• Analyse IA des documents\n• Enregistrement des fichiers dans le système\n• Synchronisation des statuts avec le backend\n• File d\'attente d\'analyse\n\nPour activer l\'analyse IA :\n1. Ouvrez un terminal\n2. Naviguez vers le dossier backend\n3. Lancez : python main.py\n\nL\'interface se reconnectera automatiquement.');
                  return;
                }
                console.log('Backend connecté, ouverture du sélecteur de fichiers');
                fileInputRef.current?.click();
              }}
              className="w-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 px-3 py-2 rounded border border-neutral-600 hover:border-neutral-500 transition-colors"
            >
              📁 {selectedDirectory || 'Choisir un dossier'}
            </button>
          </div>

          {/* Légende des statuts - visible en permanence */}
          <div className="mt-4 p-3 bg-neutral-800 rounded text-xs">
            <div className="text-neutral-300 font-medium mb-2">Statuts d'analyse :</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-1">
                <span>⚪</span>
                <span className="text-neutral-400">Non pris en charge</span>
            </div>
              <div className="flex items-center gap-1">
                <span>🟠</span>
                <span className="text-orange-400">Non analysé</span>
          </div>
              <div className="flex items-center gap-1">
                <span>🟡</span>
                <span className="text-yellow-400">En attente</span>
          </div>
              <div className="flex items-center gap-1">
                <span>🔵</span>
                <span className="text-blue-400">En cours</span>
            </div>
              <div className="flex items-center gap-1">
                <span>🟢</span>
                <span className="text-green-400">Terminé</span>
              </div>
              <div className="flex items-center gap-1">
                <span>🔴</span>
                <span className="text-red-400">Échec</span>
          </div>
            </div>
            </div>

          {/* Titre Arborescence */}
          <div className="text-lg font-semibold mt-6 mb-3 text-neutral-200">
            Arborescence
          </div>

          {/* Zone d'arborescence avec ronds de couleur */}
          <div className="flex-1 p-4 overflow-y-auto">
            {isLoading ? (
              <div className="text-center text-neutral-500 py-8">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-500"></div>
                  <div className="text-2xl">📂</div>
                </div>
                <div className="text-sm">Chargement de l'arborescence...</div>
              </div>
            ) : treeData.length === 0 ? (
              <div className="text-center text-neutral-500 py-8">
                <div className="text-2xl mb-2">📂</div>
                <div className="text-sm">Aucun fichier à afficher</div>
              </div>
            ) : (
              <div className="space-y-1">
                {Array.isArray(treeData) && treeData.slice(0, 100).map((node: any) => renderTreeNode(node))}
                {Array.isArray(treeData) && treeData.length > 100 && (
                  <div className="text-xs text-neutral-500 px-2 py-1 text-center">
                    ... et {treeData.length - 100} autres éléments
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Séparateur redimensionnable */}
        <div
          className="w-1 bg-neutral-700 cursor-col-resize hover:bg-violet-500 transition-colors"
          onMouseDown={handleMouseDown}
        />

        {/* Panneau central - Détails et résultats */}
        <div className="flex-1 flex flex-col">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-white mb-4">Détails</h2>
            
            {hasSelectedFiles ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 p-4 rounded">
                  <h3 className="text-white font-medium mb-2">
                    Fichiers sélectionnés ({selectedFileInfos.length})
                    {selectedFileInfos.length > 1 && (
                      <span className="text-xs text-neutral-400 ml-2">
                        💡 Utilisez Ctrl+clic pour sélectionner plusieurs fichiers
                      </span>
                    )}
                    <div className="text-xs text-neutral-500 mt-1">
                      💡 Raccourcis : Échap (désélectionner), Ctrl+A (tout sélectionner), F5 (rafraîchir)
                    </div>
                  </h3>
                  <div className="space-y-2">
                    {selectedFileInfos.map(file => (
                      <div key={file.path} className="flex items-center gap-2 text-neutral-300">
                        <span>📄 {file.name}</span>
                        <span className="text-xs text-neutral-500">({(file.size / 1024).toFixed(1)} KB)</span>
                        <span className={`text-xs ${
                          file.status === 'pending' ? 'text-yellow-400' :
                          file.status === 'in_progress' ? 'text-blue-400' :
                          file.status === 'completed' ? 'text-green-400' :
                          file.status === 'failed' ? 'text-red-400' :
                          file.status === 'unanalyzed' ? 'text-orange-400' :
                          'text-neutral-400'
                        }`}>
                          {file.status === 'pending' ? '🟡' :
                           file.status === 'in_progress' ? '🔵' :
                           file.status === 'completed' ? '🟢' :
                           file.status === 'failed' ? '🔴' :
                           file.status === 'unanalyzed' ? '🟠' : '⚪'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Menu contextuel */}
                {contextMenu.visible && (
                  <div
                    className="fixed bg-neutral-800 border border-neutral-600 rounded shadow-lg z-50 min-w-[200px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                  >
                    <div className="p-2 border-b border-neutral-600">
                      <div className="text-sm font-medium text-neutral-300">Actions</div>
                    </div>
                    
                    {/* Actions d'analyse */}
                    <div className="p-1">
                      <div className="text-xs text-neutral-500 px-2 py-1">Analyses IA :</div>
                      {backendStatus !== 'connected' && (
                        <div className="px-3 py-2 text-xs text-red-400 bg-red-900/30 rounded mb-1">
                          ⚠️ Backend déconnecté - Analyses non disponibles
                        </div>
                      )}
                      {prompts.map(prompt => (
                        <button
                          key={prompt.id}
                          onClick={() => handleAnalyzeFiles(prompt.id, selectedMode as 'openai' | 'local')}
                          disabled={isAnalyzing || backendStatus !== 'connected' || !areSelectedFilesRegistered()}
                          className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm disabled:opacity-50"
                          title={backendStatus !== 'connected' ? 'Backend déconnecté - Impossible d\'analyser' : ''}
                        >
                          📝 {prompt.title}
                        </button>
                      ))}
                    </div>

                    {/* Prompts contextuels */}
                    <div className="p-1 border-t border-neutral-600">
                      <div className="text-xs text-neutral-500 px-2 py-1">Prompts contextuels :</div>
                      {backendStatus !== 'connected' && (
                        <div className="px-3 py-2 text-xs text-red-400 bg-red-900/30 rounded mb-1">
                          ⚠️ Backend déconnecté - Prompts non disponibles
                        </div>
                      )}
                      {selectedFileInfos.length === 1 && (
                        <>
                          <button
                            onClick={() => handleGenerateContextualPrompt(selectedFileInfos[0].path, 'general')}
                            disabled={isGeneratingPrompt || backendStatus !== 'connected'}
                            className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm disabled:opacity-50"
                            title={backendStatus !== 'connected' ? 'Backend déconnecté - Impossible de générer' : 'Générer un prompt général'}
                          >
                            🎯 Prompt général
                          </button>
                          <button
                            onClick={() => handleGenerateContextualPrompt(selectedFileInfos[0].path, 'summary')}
                            disabled={isGeneratingPrompt || backendStatus !== 'connected'}
                            className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm disabled:opacity-50"
                            title={backendStatus !== 'connected' ? 'Backend déconnecté - Impossible de générer' : 'Générer un prompt de résumé'}
                          >
                            📋 Prompt résumé
                          </button>
                          <button
                            onClick={() => handleGenerateContextualPrompt(selectedFileInfos[0].path, 'extraction')}
                            disabled={isGeneratingPrompt || backendStatus !== 'connected'}
                            className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm disabled:opacity-50"
                            title={backendStatus !== 'connected' ? 'Backend déconnecté - Impossible de générer' : 'Générer un prompt d\'extraction'}
                          >
                            🔍 Prompt extraction
                          </button>
                          <button
                            onClick={() => handleGenerateContextualPrompt(selectedFileInfos[0].path, 'questions')}
                            disabled={isGeneratingPrompt || backendStatus !== 'connected'}
                            className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm disabled:opacity-50"
                            title={backendStatus !== 'connected' ? 'Backend déconnecté - Impossible de générer' : 'Générer des questions'}
                          >
                            ❓ Questions pertinentes
                          </button>
                        </>
                      )}
                    </div>

                    {/* Actions rapides */}
                    <div className="p-1 border-t border-neutral-600">
                      <div className="text-xs text-neutral-500 px-2 py-1">Actions rapides :</div>
                      {backendStatus !== 'connected' && (
                        <div className="px-3 py-2 text-xs text-red-400 bg-red-900/30 rounded mb-1">
                          ⚠️ Backend déconnecté - Enregistrement non disponible
                        </div>
                      )}
                      <button
                        onClick={() => handleRegisterSelectedFiles()}
                        disabled={isAnalyzing || backendStatus !== 'connected'}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-700 rounded text-sm disabled:opacity-50"
                        title={backendStatus !== 'connected' ? 'Backend déconnecté - Impossible d\'enregistrer' : ''}
                      >
                        📋 Enregistrer dans le système
                      </button>
                    </div>
                  </div>
                )}

                {/* Affichage du prompt contextuel */}
                {showContextualPrompt && contextualPrompt && (
                  <div className="bg-neutral-800 p-4 rounded mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">Prompt contextuel généré</h3>
                      <button
                        onClick={() => setShowContextualPrompt(false)}
                        className="text-neutral-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="bg-neutral-900 p-3 rounded text-sm text-neutral-300 font-mono whitespace-pre-wrap">
                      {contextualPrompt.contextual_prompt}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(contextualPrompt.contextual_prompt || '');
                          alert('Prompt copié dans le presse-papiers !');
                        }}
                        className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-xs"
                      >
                        📋 Copier
                      </button>
                      <button
                        onClick={() => {
                          if (selectedFileInfos.length === 1) {
                            // Utiliser le prompt contextuel pour analyser le fichier
                            const promptText = contextualPrompt.contextual_prompt || '';
                            // Ici on pourrait ajouter une fonction pour analyser avec un prompt personnalisé
                            alert('Fonctionnalité d\'analyse avec prompt personnalisé à implémenter');
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                      >
                        🚀 Analyser avec ce prompt
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <div className="text-2xl mb-2">📄</div>
                <div className="text-sm">Sélectionnez des fichiers pour voir les détails</div>
              </div>
            )}
          </div>
        </div>

        {/* Panneau de droite - File d'attente d'analyse */}
        {isQueueVisible && (
          <>
            <div
              className="w-1 bg-neutral-700 cursor-col-resize hover:bg-violet-500 transition-colors"
              onMouseDown={handleQueueResizeMouseDown}
            />
            <div
              ref={queuePanelRef}
              className="bg-neutral-900 text-white p-4 min-w-[300px] max-w-[500px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">File d'attente</h2>
                <button
                  onClick={() => setIsQueueVisible(false)}
                  className="text-neutral-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {backendStatus !== 'connected' && (
                  <div className="mb-4 p-3 bg-red-900/30 border border-red-500 rounded-lg">
                    <div className="flex items-center gap-2 text-red-300">
                      <span className="text-sm">⚠️</span>
                      <div className="text-xs">
                        <div className="font-medium">Backend déconnecté</div>
                        <div className="text-red-400">La file d'attente n'est pas synchronisée</div>
                      </div>
                    </div>
                  </div>
                )}
                {analysisQueue.length === 0 ? (
                  <div className="text-center text-neutral-500 py-8">
                    <div className="text-2xl mb-2">⏳</div>
                    <div className="text-sm">
                      {backendStatus === 'connected' ? 'Aucune analyse en cours' : 'File d\'attente non disponible'}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {analysisQueue.map((item, index) => (
                      <div key={index} className="bg-neutral-800 p-3 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-neutral-300 truncate">
                            {item.fileName}
                          </span>
                          <span className={`text-xs ${
                            item.status === 'pending' ? 'text-yellow-400' :
                            item.status === 'in_progress' ? 'text-blue-400' :
                            item.status === 'completed' ? 'text-green-400' :
                            item.status === 'failed' ? 'text-red-400' :
                            'text-neutral-400'
                          }`}>
                            {item.status === 'pending' ? '🟡' :
                             item.status === 'in_progress' ? '🔵' :
                             item.status === 'completed' ? '🟢' :
                             item.status === 'failed' ? '🔴' : '⚪'}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-500">
                          Analyse en cours...
                        </div>
                        {item.progress && (
                          <div className="mt-2">
                            <div className="w-full bg-neutral-700 rounded-full h-1">
                              <div
                                className="bg-violet-500 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${item.progress}%` }}
                              />
                            </div>
                            <div className="text-xs text-neutral-400 mt-1">
                              {item.progress}%
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;