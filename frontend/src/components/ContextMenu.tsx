import React, { useState, useEffect } from 'react';

interface Prompt {
  id: string;
  title: string;
  description?: string;
  multi_document?: boolean;
}

interface ContextMenuProps {
  x: number;
  y: number;
  isVisible: boolean;
  onClose: () => void;
  onAnalyze: (promptId: string) => void;
  onCompare?: (promptId: string) => void;
  selectedCount: number;
  hasSelectedFiles: boolean;
  selectedItems?: Array<{ path: string; type: 'file' | 'directory'; name: string }>;
}

const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  isVisible,
  onClose,
  onAnalyze,
  onCompare,
  selectedCount,
  hasSelectedFiles,
  selectedItems = []
}) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [showPromptSelector, setShowPromptSelector] = useState(false);

  // Analyser la sélection pour déterminer le contexte
  const analyzeSelection = () => {
    const files = selectedItems.filter(item => item.type === 'file');
    const directories = selectedItems.filter(item => item.type === 'directory');
    
    return {
      fileCount: files.length,
      directoryCount: directories.length,
      totalCount: selectedItems.length,
      hasFiles: files.length > 0,
      hasDirectories: directories.length > 0,
      isMixed: files.length > 0 && directories.length > 0,
      isFilesOnly: files.length > 0 && directories.length === 0,
      isDirectoriesOnly: directories.length > 0 && files.length === 0
    };
  };

  const selection = analyzeSelection();

  // Générer le message de sélection approprié
  const getSelectionMessage = () => {
    if (selection.totalCount === 0) return 'Aucune sélection';
    
    const parts = [];
    
    if (selection.fileCount > 0) {
      parts.push(`${selection.fileCount} fichier${selection.fileCount > 1 ? 's' : ''}`);
    }
    
    if (selection.directoryCount > 0) {
      parts.push(`${selection.directoryCount} dossier${selection.directoryCount > 1 ? 's' : ''}`);
    }
    
    return parts.join(' et ');
  };

  // Déterminer si la comparaison est possible
  const canCompare = () => {
    // Besoin d'au moins 2 éléments pour comparer
    if (selection.totalCount < 2) return false;
    
    // Si on a des dossiers, on peut toujours comparer (ils contiennent des fichiers)
    if (selection.hasDirectories) return true;
    
    // Si on a seulement des fichiers, besoin d'au moins 2 fichiers
    return selection.fileCount >= 2;
  };

  // Déterminer le texte du bouton d'analyse
  const getAnalyzeButtonText = () => {
    if (selection.totalCount === 0) return 'Analyser';
    
    if (selection.isFilesOnly) {
      if (selection.fileCount === 1) return 'Analyser ce fichier';
      return `Analyser ${selection.fileCount} fichier${selection.fileCount > 1 ? 's' : ''}`;
    }
    
    if (selection.isDirectoriesOnly) {
      if (selection.directoryCount === 1) return 'Analyser ce dossier';
      return `Analyser ${selection.directoryCount} dossier${selection.directoryCount > 1 ? 's' : ''}`;
    }
    
    if (selection.isMixed) {
      return `Analyser la sélection (${selection.totalCount} élément${selection.totalCount > 1 ? 's' : ''})`;
    }
    
    return 'Analyser la sélection';
  };

  // Déterminer le texte du bouton de comparaison
  const getCompareButtonText = () => {
    if (!canCompare()) return 'Comparer';
    
    if (selection.isFilesOnly) {
      return `Comparer ${selection.fileCount} fichier${selection.fileCount > 1 ? 's' : ''}`;
    }
    
    if (selection.isDirectoriesOnly) {
      return `Comparer ${selection.directoryCount} dossier${selection.directoryCount > 1 ? 's' : ''}`;
    }
    
    if (selection.isMixed) {
      return `Comparer la sélection (${selection.totalCount} élément${selection.totalCount > 1 ? 's' : ''})`;
    }
    
    return 'Comparer les documents';
  };

  useEffect(() => {
    if (isVisible) {
      fetch('/api/prompts')
        .then(res => res.json())
        .then(data => {
          setPrompts(Array.isArray(data) ? data : []);
          if (data.length > 0) {
            // Sélectionner automatiquement un prompt approprié selon le contexte
            if (canCompare()) {
              // Chercher d'abord un prompt multi-document
              const multiDocPrompt = data.find(p => p.multi_document);
              if (multiDocPrompt) {
                setSelectedPrompt(multiDocPrompt.id);
              } else {
                setSelectedPrompt(data[0].id);
              }
            } else {
              // Pour une sélection simple, sélectionner un prompt individuel
              const singleDocPrompt = data.find(p => !p.multi_document);
              if (singleDocPrompt) {
                setSelectedPrompt(singleDocPrompt.id);
              } else {
                setSelectedPrompt(data[0].id);
              }
            }
          }
        })
        .catch(err => {
          console.error('Erreur lors du chargement des prompts:', err);
          setPrompts([]);
        });
    }
  }, [isVisible, selection]);

  const handleAnalyze = () => {
    if (selectedPrompt) {
      onAnalyze(selectedPrompt);
      onClose();
    }
  };

  const handleCompare = () => {
    if (selectedPrompt && onCompare) {
      onCompare(selectedPrompt);
      onClose();
    }
  };

  // Filtrer les prompts selon le contexte
  const multiDocPrompts = prompts.filter(p => p.multi_document);
  const singleDocPrompts = prompts.filter(p => !p.multi_document);
  const comparisonAvailable = canCompare() && multiDocPrompts.length > 0;

  if (!isVisible) return null;

  return (
    <>
      {/* Menu contextuel principal */}
      <div
        className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg min-w-48"
        style={{ left: x, top: y }}
      >
        {/* En-tête */}
        <div className="px-4 py-2 border-b border-neutral-600">
          <div className="text-sm text-neutral-300">
            {getSelectionMessage()}
          </div>
          {!comparisonAvailable && multiDocPrompts.length > 0 && (
            <div className="text-xs text-yellow-400 mt-1">
              ⚠️ Sélectionnez au moins 2 éléments pour la comparaison
            </div>
          )}
          {selection.isMixed && (
            <div className="text-xs text-blue-400 mt-1">
              💡 Sélection mixte : fichiers et dossiers
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="py-1">
          {/* Sélecteur de prompt */}
          <div className="px-4 py-2 border-b border-neutral-600">
            <div className="text-xs text-neutral-400 mb-2">Stratégie d'analyse :</div>
            {prompts.length > 0 ? (
              <>
                <select
                  value={selectedPrompt}
                  onChange={(e) => setSelectedPrompt(e.target.value)}
                  className="w-full bg-neutral-700 border border-neutral-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-violet-500"
                >
                  {comparisonAvailable && (
                    <optgroup label="Comparaison multi-documents">
                      {multiDocPrompts.map((prompt) => (
                        <option key={prompt.id} value={prompt.id}>
                          {prompt.title}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  <optgroup label="Analyse individuelle">
                    {singleDocPrompts.map((prompt) => (
                      <option key={prompt.id} value={prompt.id}>
                        {prompt.title}
                      </option>
                    ))}
                  </optgroup>
                </select>
                {selectedPrompt && prompts.find(p => p.id === selectedPrompt)?.description && (
                  <div className="text-xs text-neutral-500 mt-1">
                    {prompts.find(p => p.id === selectedPrompt)?.description}
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-red-400 py-2">
                ⚠️ Aucune stratégie disponible
              </div>
            )}
          </div>

          {/* Bouton d'analyse */}
          <button
            onClick={handleAnalyze}
            disabled={!selectedPrompt || prompts.length === 0}
            className="w-full px-4 py-2 text-left text-sm text-white hover:bg-violet-600/20 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <span className="text-violet-400">⚡</span>
            {getAnalyzeButtonText()}
          </button>

          {/* Bouton de comparaison */}
          {comparisonAvailable && selectedPrompt && prompts.find(p => p.id === selectedPrompt)?.multi_document && onCompare && (
            <button
              onClick={handleCompare}
              className="w-full px-4 py-2 text-left text-sm text-white hover:bg-blue-600/20 transition-colors flex items-center gap-2 border-t border-neutral-600"
            >
              <span className="text-blue-400">🔍</span>
              {getCompareButtonText()}
            </button>
          )}

          {/* Messages d'information contextuels */}
          {!comparisonAvailable && multiDocPrompts.length > 0 && (
            <div className="px-4 py-2 text-xs text-neutral-400 border-t border-neutral-600">
              {selection.totalCount === 0 && (
                <span>💡 Sélectionnez des fichiers ou dossiers pour commencer</span>
              )}
              {selection.totalCount === 1 && (
                <span>💡 Sélectionnez au moins 2 éléments pour activer la comparaison</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour fermer le menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
    </>
  );
};

export default ContextMenu; 