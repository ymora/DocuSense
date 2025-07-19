import React, { useState } from 'react';

interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: TreeNode[];
  status?: 'unprocessed' | 'processed' | 'error' | 'in_progress' | 'partial';
}

interface FileTreeProps {
  data: TreeNode[];
  selectedFiles: Set<string>;
  onFileSelect: (filePath: string, isSelected: boolean) => void;
  onFileDeselect: (filePath: string) => void;
}

const FileTree: React.FC<FileTreeProps> = ({ data, selectedFiles, onFileSelect }) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleNodeClick = (node: TreeNode, event?: React.MouseEvent) => {
    if (node.type === 'directory') {
      // Pour les dossiers, cliquer sélectionne/désélectionne tous les fichiers du répertoire
      // Sauf si on clique sur l'icône d'expansion
      const target = event?.target as HTMLElement;
      if (target && target.closest('button')) {
        // Clic sur le bouton d'expansion - juste étendre/réduire
        toggleExpanded(node.path);
      } else {
        // Clic ailleurs sur le répertoire - basculer la sélection de tous les fichiers
        toggleDirectorySelection(node);
      }
    } else {
      onFileSelect(node.path, !selectedFiles.has(node.path));
    }
  };

  const toggleDirectorySelection = (directory: TreeNode) => {
    const allFilesInDirectory: string[] = [];
    
    const collectFiles = (node: TreeNode) => {
      if (node.type === 'file') {
        allFilesInDirectory.push(node.path);
      } else if (node.children) {
        node.children.forEach(collectFiles);
      }
    };
    
    collectFiles(directory);
    
    // Vérifier si tous les fichiers du répertoire sont déjà sélectionnés
    const allSelected = allFilesInDirectory.every(filePath => selectedFiles.has(filePath));
    
    if (allSelected) {
      // Désélectionner tous les fichiers du répertoire
      allFilesInDirectory.forEach(filePath => {
        if (selectedFiles.has(filePath)) {
          onFileSelect(filePath, false);
        }
      });
    } else {
      // Sélectionner tous les fichiers du répertoire
      allFilesInDirectory.forEach(filePath => {
        if (!selectedFiles.has(filePath)) {
          onFileSelect(filePath, true);
        }
      });
    }
  };

  const toggleExpanded = (path: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'processed': return '✅';
      case 'in_progress': return '🔄';
      case 'error': return '❌';
      case 'partial': return '⚠️';
      case 'unprocessed': return '📄';
      default: return '📄';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'processed': return 'text-green-400';
      case 'in_progress': return 'text-yellow-400';
      case 'error': return 'text-red-400';
      case 'partial': return 'text-blue-400';
      case 'unprocessed': return 'text-neutral-400';
      default: return 'text-neutral-400';
    }
  };

  const getStatusBackground = (status?: string) => {
    switch (status) {
      case 'processed': return 'bg-green-500/15 border-green-500/30';
      case 'in_progress': return 'bg-yellow-500/15 border-yellow-500/30';
      case 'error': return 'bg-red-500/15 border-red-500/30';
      case 'partial': return 'bg-blue-500/15 border-blue-500/30';
      case 'unprocessed': return 'bg-neutral-500/10 border-neutral-500/20';
      default: return 'bg-neutral-500/10 border-neutral-500/20';
    }
  };

  const getStatusDotColor = (status?: string) => {
    switch (status) {
      case 'processed': return 'bg-green-400 shadow-green-400/50';
      case 'in_progress': return 'bg-yellow-400 shadow-yellow-400/50';
      case 'error': return 'bg-red-400 shadow-red-400/50';
      case 'partial': return 'bg-blue-400 shadow-blue-400/50';
      case 'unprocessed': return 'bg-neutral-500 shadow-neutral-500/50';
      default: return 'bg-neutral-500 shadow-neutral-500/50';
    }
  };

  const getStatusTooltip = (status?: string) => {
    switch (status) {
      case 'processed': return 'Fichier traité avec succès';
      case 'in_progress': return 'Analyse en cours';
      case 'error': return 'Erreur lors du traitement';
      case 'partial': return 'Traitement partiel';
      case 'unprocessed': return 'Fichier non traité';
      default: return 'État inconnu';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const renderNode = (node: TreeNode, level: number = 0) => {
    const isDirectory = node.type === 'directory';
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.path);
    const isSelected = selectedFiles.has(node.path);
    const statusColor = getStatusColor(node.status);
    const statusBackground = getStatusBackground(node.status);
    const statusDotColor = getStatusDotColor(node.status);

    return (
      <div key={node.path}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 ${
            isSelected 
              ? 'bg-violet-600/30 border-2 border-violet-500/70 shadow-sm' 
              : `hover:bg-neutral-800/80 hover:border hover:border-neutral-600/50 ${statusBackground} border border-transparent`
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={(event) => handleNodeClick(node, event)}
        >
          {/* Indicateur d'état - seulement si pas sélectionné */}
          {!isSelected && (
            <div 
              className={`w-2 h-2 rounded-full ${statusDotColor} cursor-help shadow-sm`}
              title={getStatusTooltip(node.status)}
            />
          )}
          
          {/* Icône d'expansion pour les dossiers */}
          {isDirectory && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(node.path);
              }}
              className={`text-neutral-400 hover:text-white transition-colors ${
                hasChildren ? 'font-bold' : 'opacity-50'
              }`}
              title={hasChildren ? "Clic pour étendre/réduire le répertoire" : "Répertoire vide"}
            >
              {hasChildren ? (isExpanded ? '▼' : '▶') : '📁'}
            </button>
          )}
          
          {/* Icône de fichier */}
          {!isDirectory && <span className="text-neutral-400">📄</span>}
          
          {/* Nom du fichier/dossier */}
          <span className={`flex-1 text-sm font-medium ${
            isSelected 
              ? 'text-violet-100 font-semibold' 
              : isDirectory 
                ? 'text-white cursor-pointer hover:text-violet-200' 
                : 'text-neutral-200'
          }`}>
            {node.name}
            {isDirectory && hasChildren && (
              <span className="text-xs text-neutral-500 ml-1">(cliquer pour basculer sélection)</span>
            )}
          </span>
          
          {/* Taille du fichier */}
          {!isDirectory && node.size && (
            <span className="text-xs text-neutral-500 bg-neutral-800/50 px-2 py-1 rounded">
              {(node.size / 1024).toFixed(1)} KB
            </span>
          )}
          
          {/* Indicateur de sélection */}
          {isSelected && (
            <span className="text-violet-300 text-sm font-bold">✓</span>
          )}
        </div>
        
        {/* Enfants avec ligne de connexion */}
        {isDirectory && hasChildren && isExpanded && (
          <div className="relative">
            {/* Ligne de connexion verticale */}
            <div 
              className="absolute left-0 top-0 w-px bg-neutral-700"
              style={{ 
                left: `${level * 16 + 20}px`,
                height: '100%'
              }}
            />
            {node.children!.map((child, index) => (
              <div key={child.path} className="relative">
                {/* Ligne de connexion horizontale */}
                <div 
                  className="absolute top-4 w-3 h-px bg-neutral-700"
                  style={{ 
                    left: `${level * 16 + 20}px`
                  }}
                />
                {renderNode(child, level + 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500 p-8">
        <div className="text-center bg-neutral-900/50 border border-neutral-700/50 rounded-lg p-6">
          <div className="text-4xl mb-3">🌳</div>
          <p className="text-neutral-400 font-medium">Aucune arborescence à afficher</p>
          <p className="text-neutral-500 text-sm mt-1">Sélectionnez un répertoire pour commencer</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-1">
      {data.map((node) => renderNode(node))}
    </div>
  );
};

export default FileTree; 