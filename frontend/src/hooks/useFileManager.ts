import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { scanDirectoryWithStatus, getFileStatus, registerFile, getFileStatistics } from '../api';

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived' | 'unregistered';
  analysis?: any;
  lastModified?: number;
  fileId?: string;
  error?: string;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  children?: TreeNode[];
  status?: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived' | 'unregistered';
  lastModified?: number;
  fileId?: string;
  error?: string;
}

interface DirectoryCache {
  [directoryPath: string]: {
    tree: TreeNode[];
    files: FileInfo[];
    lastCheck: number;
    hash: string;
  };
}

interface Statistics {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  failed: number;
  archived: number;
  unregistered: number;
}

export const useFileManager = () => {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [selectedDirectory, setSelectedDirectory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  
  // Cache pour éviter les recalculs
  const directoryCache = useRef<DirectoryCache>({});
  const cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Générer un hash simple pour détecter les changements
  const generateHash = useCallback((fileArray: File[]) => {
    return fileArray.map(f => `${f.name}-${f.size}-${f.lastModified}`).join('|');
  }, []);

  // Vérifier si le cache est valide
  const isCacheValid = useCallback((directoryPath: string, currentHash: string) => {
    const cached = directoryCache.current[directoryPath];
    if (!cached) return false;
    
    const isExpired = Date.now() - cached.lastCheck > cacheTimeout;
    const hasChanged = cached.hash !== currentHash;
    
    return !isExpired && !hasChanged;
  }, []);

  // Récupérer les statuts des fichiers depuis le backend
  const fetchFileStatuses = useCallback(async (filePaths: string[]) => {
    const statusMap = new Map<string, string>();
    
    for (const filePath of filePaths) {
      try {
        const response = await getFileStatus(filePath);
        if (response.success) {
          statusMap.set(filePath, response.status);
        } else {
          statusMap.set(filePath, 'unregistered');
        }
      } catch (error) {
        console.warn(`Erreur lors de la récupération du statut pour ${filePath}:`, error);
        statusMap.set(filePath, 'unregistered');
      }
    }
    
    return statusMap;
  }, []);

  // Charger les statistiques depuis le backend
  const loadStatistics = useCallback(async () => {
    try {
      const response = await getFileStatistics();
      if (response.success) {
        setStatistics(response.statistics);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, []);

  // Construire l'arborescence avec cache et statuts du backend
  const buildTreeWithCache = useCallback(async (fileArray: File[], directoryName: string) => {
    const currentHash = generateHash(fileArray);
    const directoryPath = directoryName;

    // Vérifier le cache
    if (isCacheValid(directoryPath, currentHash)) {
      const cached = directoryCache.current[directoryPath];
      setFiles(cached.files);
      setTreeData(cached.tree);
      return;
    }

    setIsLoading(true);

    try {
      // Récupérer les statuts depuis le backend
      const filePaths = fileArray.map(f => f.webkitRelativePath);
      const statusMap = await fetchFileStatuses(filePaths);

      // Construire l'arborescence
      const treeMap = new Map<string, TreeNode>();
      const fileList: FileInfo[] = [];

      fileArray.forEach((file) => {
        const pathParts = file.webkitRelativePath.split('/');
        const fileName = pathParts.pop()!;
        
        // Créer les dossiers parents (en commençant par le premier niveau)
        let currentPath = '';
        pathParts.forEach((part, index) => {
          const parentPath = currentPath;
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          
          if (!treeMap.has(currentPath)) {
            const dirNode: TreeNode = {
              name: part,
              path: currentPath,
              type: 'directory',
              children: [],
              status: 'unregistered'
            };
            treeMap.set(currentPath, dirNode);
            
            // Ajouter au parent
            if (parentPath && treeMap.has(parentPath)) {
              const parent = treeMap.get(parentPath)!;
              if (parent.children && !parent.children.some((child: TreeNode) => child.name === part)) {
                parent.children.push(dirNode);
              }
            }
          }
        });
        
        // Ajouter le fichier
        if (currentPath) {
          const parent = treeMap.get(currentPath);
          if (parent && parent.children) {
            const fileStatus = statusMap.get(file.webkitRelativePath) || 'unregistered';
            
            const fileNode: TreeNode = {
              name: fileName,
              path: file.webkitRelativePath,
              type: 'file',
              size: file.size,
              status: fileStatus as any,
              lastModified: file.lastModified
            };
            parent.children.push(fileNode);
            
            // Ajouter à la liste des fichiers
            fileList.push({
              name: fileName,
              path: file.webkitRelativePath,
              size: file.size,
              type: file.type || 'unknown',
              status: fileStatus as any,
              lastModified: file.lastModified
            });
          }
        }
      });

      // Récupérer les nœuds racines (ceux sans parent ou avec le répertoire choisi comme parent)
      const rootNodes: TreeNode[] = [];
      treeMap.forEach((node) => {
        const pathParts = node.path.split('/');
        if (pathParts.length === 1) {
          // Premier niveau - ajouter directement
          rootNodes.push(node);
        }
      });

      // Mettre à jour l'état
      setFiles(fileList);
      setTreeData(rootNodes);

      // Sauvegarder dans le cache
      directoryCache.current[directoryPath] = {
        tree: rootNodes,
        files: fileList,
        lastCheck: Date.now(),
        hash: currentHash
      };

      // Charger les statistiques
      await loadStatistics();
    } catch (error) {
      console.error('Erreur lors de la construction de l\'arborescence:', error);
    } finally {
      setIsLoading(false);
    }
  }, [generateHash, isCacheValid, fetchFileStatuses, loadStatistics]);

  // Enregistrer un fichier dans le système de gestion
  const registerFileInSystem = useCallback(async (filePath: string) => {
    try {
      const response = await registerFile(filePath);
      if (response.success) {
        // Mettre à jour le statut du fichier dans l'état local
        setFiles(prevFiles => 
          prevFiles.map(file => 
            file.path === filePath 
              ? { ...file, status: 'pending' as const, fileId: response.file_id }
              : file
          )
        );

        // Mettre à jour l'arborescence
        setTreeData(prevTree => {
          const updateNode = (node: TreeNode): TreeNode => {
            if (node.path === filePath) {
              return { ...node, status: 'pending' as const, fileId: response.file_id };
            }
            if (node.children) {
              return { ...node, children: node.children.map(updateNode) };
            }
            return node;
          };
          return prevTree.map(updateNode);
        });

        // Recharger les statistiques
        await loadStatistics();
        
        return response;
      }
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement du fichier:', error);
      return { success: false, error };
    }
  }, [loadStatistics]);

  // Mettre à jour le statut d'un fichier
  const updateFileStatus = useCallback(async (filePath: string, newStatus: string) => {
    setFiles(prevFiles => 
      prevFiles.map(file => 
        file.path === filePath 
          ? { ...file, status: newStatus as any }
          : file
      )
    );

    setTreeData(prevTree => {
      const updateNode = (node: TreeNode): TreeNode => {
        if (node.path === filePath) {
          return { ...node, status: newStatus as any };
        }
        if (node.children) {
          return { ...node, children: node.children.map(updateNode) };
        }
        return node;
      };
      return prevTree.map(updateNode);
    });
  }, []);

  // Rafraîchir les statuts des fichiers
  const refreshFileStatuses = useCallback(async () => {
    if (files.length === 0) return;

    try {
      const filePaths = files.map(f => f.path);
      const statusMap = await fetchFileStatuses(filePaths);

      setFiles(prevFiles => 
        prevFiles.map(file => ({
          ...file,
          status: (statusMap.get(file.path) || 'unregistered') as any
        }))
      );

      setTreeData(prevTree => {
        const updateNode = (node: TreeNode): TreeNode => {
          const newStatus = statusMap.get(node.path) || 'unregistered';
          const updatedNode = { ...node, status: newStatus as any };
          
          if (node.children) {
            return { ...updatedNode, children: node.children.map(updateNode) };
          }
          return updatedNode;
        };
        return prevTree.map(updateNode);
      });

      await loadStatistics();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des statuts:', error);
    }
  }, [files, fetchFileStatuses, loadStatistics]);

  // Gestion de la sélection de fichiers
  const handleFileSelect = useCallback((filePath: string, isMultiSelect: boolean = false) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (isMultiSelect) {
        newSet.add(filePath);
      } else {
        newSet.clear();
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const handleFileDeselect = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(filePath);
      return newSet;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFiles(new Set());
  }, []);

  const selectAllFiles = useCallback(() => {
    const allFilePaths = files.map(f => f.path);
    setSelectedFiles(new Set(allFilePaths));
  }, [files]);

  // Calculs dérivés
  const selectedFileInfos = useMemo(() => {
    return files.filter(file => selectedFiles.has(file.path));
  }, [files, selectedFiles]);

  const hasSelectedFiles = useMemo(() => {
    return selectedFiles.size > 0;
  }, [selectedFiles]);

  const hasFiles = useMemo(() => {
    return files.length > 0;
  }, [files]);

  // Rafraîchissement automatique des statuts
  useEffect(() => {
    if (hasFiles) {
      const interval = setInterval(refreshFileStatuses, 10000); // Toutes les 10 secondes
      return () => clearInterval(interval);
    }
  }, [hasFiles, refreshFileStatuses]);

  return {
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
  };
}; 