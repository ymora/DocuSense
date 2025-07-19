import React, { useRef, useState } from 'react';
import { TreeNode } from '../types';

interface AnalysisTask {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived';
  progress: number;
  error?: string;
  strategy?: string;
}

interface LeftPanelProps {
  directoryTree: TreeNode[];
  selectedFiles: Set<string>;
  analysisQueue: AnalysisTask[];
  onFileSelect: (filePath: string, isMultiSelect?: boolean) => void;
  onContextMenu: (event: React.MouseEvent, filePath: string) => void;
  onDirectorySelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const LeftPanel: React.FC<LeftPanelProps> = ({
  directoryTree,
  selectedFiles,
  analysisQueue,
  onFileSelect,
  onContextMenu,
  onDirectorySelect
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [selectedDirectoryName, setSelectedDirectoryName] = useState<string>('');

  // Fonction pour détecter les fichiers non gérés
  const getUnsupportedFilesCount = () => {
    const supportedExtensions = ['pdf', 'docx', 'doc', 'eml', 'txt', 'xls', 'xlsx'];
    let unsupportedCount = 0;
    
    const countUnsupportedInTree = (nodes: TreeNode[]) => {
      nodes.forEach(node => {
        if (node.type === 'file') {
          const extension = node.name.split('.').pop()?.toLowerCase();
          if (extension && !supportedExtensions.includes(extension)) {
            unsupportedCount++;
          }
        } else if (node.children) {
          countUnsupportedInTree(node.children);
        }
      });
    };
    
    countUnsupportedInTree(directoryTree);
    return unsupportedCount;
  };

  // Fonction pour obtenir l'état d'un fichier depuis l'arborescence
  const getFileStatus = (nodePath: string): string | null => {
    // Chercher dans l'arborescence
    const findNodeStatus = (nodes: TreeNode[]): string | null => {
      for (const node of nodes) {
        if (node.path === nodePath) {
          return node.status || null;
        }
        if (node.children) {
          const result = findNodeStatus(node.children);
          if (result) return result;
        }
      }
      return null;
    };
    
    return findNodeStatus(directoryTree);
  };

  // Fonction pour obtenir l'état d'un répertoire (basé sur ses fichiers)
  const getDirectoryStatus = (node: TreeNode): string | null => {
    if (!node.children) return null;

    const getAllFilesInDirectory = (nodes: TreeNode[]): TreeNode[] => {
      const files: TreeNode[] = [];
      for (const child of nodes) {
        if (child.type === 'file') {
          files.push(child);
        } else if (child.type === 'directory' && child.children) {
          files.push(...getAllFilesInDirectory(child.children));
        }
      }
      return files;
    };

    const filesInDir = getAllFilesInDirectory(node.children);
    if (filesInDir.length === 0) return null;

    // Vérifier les états de tous les fichiers du répertoire
    const fileStatuses = filesInDir.map(file => file.status).filter(status => status !== null);

    if (fileStatuses.length === 0) return null;

    // Déterminer l'état global du répertoire
    if (fileStatuses.some(status => status === 'failed')) return 'failed';
    if (fileStatuses.some(status => status === 'in_progress')) return 'in_progress';
    if (fileStatuses.every(status => status === 'completed')) return 'completed';
    if (fileStatuses.some(status => status === 'pending')) return 'pending';
    if (fileStatuses.some(status => status === 'archived')) return 'archived';
    if (fileStatuses.some(status => status === 'unregistered')) return 'unregistered';

    return null;
  };

  // Fonction pour obtenir l'icône d'état avec les nouveaux statuts
  const getStatusIcon = (status: string | null) => {
    if (!status) return null;
    
    const statusConfig = {
      pending: { icon: '🟡', color: 'text-yellow-400', title: 'En attente' },
      in_progress: { icon: '🔵', color: 'text-blue-400', title: 'En cours' },
      completed: { icon: '🟢', color: 'text-green-400', title: 'Terminé' },
      failed: { icon: '🔴', color: 'text-red-400', title: 'Échec' },
      archived: { icon: '⚫', color: 'text-gray-400', title: 'Archivé' },
      unregistered: { icon: '⚪', color: 'text-gray-300', title: 'Non enregistré' }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    
    return (
      <span className={`text-xs ${config.color}`} title={config.title}>
        {config.icon}
      </span>
    );
  };

  const toggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
        // Quand on ouvre un dossier, il devient la sélection active
        onFileSelect(folderPath, false);
      }
      return newSet;
    });
  };

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isSelected = selectedFiles.has(node.path);
    const isFile = node.type === 'file';
    const isExpanded = expandedFolders.has(node.path);
    
    // Obtenir l'état du fichier ou répertoire
    const status = isFile ? getFileStatus(node.path) : getDirectoryStatus(node);
    const statusIcon = getStatusIcon(status);
    
    // Vérifier si le fichier est non géré
    const isUnsupported = isFile && (() => {
      const supportedExtensions = ['pdf', 'docx', 'doc', 'eml', 'txt', 'xls', 'xlsx'];
      const extension = node.name.split('.').pop()?.toLowerCase();
      return extension && !supportedExtensions.includes(extension);
    })();

  return (
      <div key={node.path} style={{ paddingLeft: `${level * 16}px` }}>
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded transition-colors ${
            isSelected ? 'bg-violet-600/30 text-violet-200' : 'text-neutral-300'
          } ${isUnsupported ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-violet-600/20'}`}
          onClick={(e) => {
            // Empêcher l'analyse des fichiers non gérés
            if (isUnsupported) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            
            if (isFile) {
              // Vérifier si Ctrl/Cmd est pressé pour la sélection multiple
              const isMultiSelect = e.ctrlKey || e.metaKey;
              onFileSelect(node.path, isMultiSelect);
            } else {
              toggleFolder(node.path);
            }
          }}
          onContextMenu={(e) => {
            // Empêcher le menu contextuel pour les fichiers non gérés
            if (isUnsupported) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            onContextMenu(e, node.path);
          }}
        >
          {/* Indicateur d'état */}
          {statusIcon && (
            <span className="flex-shrink-0">
              {statusIcon}
            </span>
          )}
          
          {/* Indicateur de fichier non géré */}
          {isUnsupported && (
            <span className="flex-shrink-0 text-orange-400 text-xs" title="Fichier non analysable">
              ⚠️
            </span>
          )}
          
          <span className="text-sm">
            {isFile ? '📄' : (isExpanded ? '📂' : '📁')}
          </span>
          
          <span className="flex-1 min-w-0 truncate text-sm">
            {node.name}
          </span>
          
          {/* Indicateur de sélection multiple */}
          {isFile && selectedFiles.has(node.path) && (
            <span className="flex-shrink-0 text-violet-400 text-xs">
              ✓
            </span>
          )}
      </div>

        {/* Rendu récursif des enfants */}
        {!isFile && isExpanded && node.children && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const handleFolderClick = () => {
    fileInputRef.current?.click();
  };

  const handleDirectorySelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    onDirectorySelect(event);
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setSelectedDirectoryName(file.name);
    }
  };

  const unsupportedCount = getUnsupportedFilesCount();

  return (
    <div className="w-80 bg-neutral-900 border-r border-neutral-700 flex flex-col">
      {/* En-tête */}
      <div className="p-4 border-b border-neutral-700">
        <h2 className="text-lg font-semibold text-white mb-2">Explorateur de fichiers</h2>
        
        {/* Sélecteur de répertoire */}
        <div className="space-y-2">
          <button
            onClick={handleFolderClick}
            className="w-full bg-violet-600 hover:bg-violet-700 text-white py-2 px-3 rounded text-sm transition-colors"
          >
            📁 Sélectionner un répertoire
          </button>
          
              <input
            ref={fileInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleDirectorySelect}
            className="hidden"
          />
          
          {selectedDirectoryName && (
            <div className="text-xs text-neutral-400">
              Répertoire sélectionné: {selectedDirectoryName}
            </div>
          )}
        </div>
        
        {/* Statistiques */}
        {directoryTree.length > 0 && (
          <div className="mt-4 p-3 bg-neutral-800 rounded text-xs">
            <div className="text-neutral-300 mb-2">Statistiques:</div>
            <div className="space-y-1 text-neutral-400">
              <div>📁 Dossiers: {directoryTree.filter(n => n.type === 'directory').length}</div>
              <div>📄 Fichiers: {directoryTree.filter(n => n.type === 'file').length}</div>
              {unsupportedCount > 0 && (
                <div className="text-orange-400">⚠️ Non supportés: {unsupportedCount}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Arborescence */}
      <div className="flex-1 overflow-y-auto p-2">
        {directoryTree.length === 0 ? (
          <div className="text-center text-neutral-500 py-8">
            <div className="text-2xl mb-2">📁</div>
            <div>Sélectionnez un répertoire pour commencer</div>
          </div>
        ) : (
          <div className="space-y-1">
            {directoryTree.map(node => renderTreeNode(node))}
          </div>
        )}
      </div>

      {/* Légende des statuts */}
      {directoryTree.length > 0 && (
        <div className="p-3 border-t border-neutral-700 bg-neutral-800">
          <div className="text-xs text-neutral-300 mb-2">Légende des statuts:</div>
          <div className="grid grid-cols-2 gap-1 text-xs text-neutral-400">
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">🟡</span>
              <span>En attente</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-blue-400">🔵</span>
              <span>En cours</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-400">🟢</span>
              <span>Terminé</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-red-400">🔴</span>
              <span>Échec</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-400">⚫</span>
              <span>Archivé</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-gray-300">⚪</span>
              <span>Non enregistré</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
