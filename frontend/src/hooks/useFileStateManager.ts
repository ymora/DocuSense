import { useState, useEffect, useCallback } from 'react';
import { 
  registerFile, 
  getFileStatus, 
  getFilesByStatus, 
  getFileStatistics,
  scanDirectoryWithStatus 
} from '../api';

export interface FileStateInfo {
  id: string;
  original_path: string;
  current_path: string;
  name: string;
  size: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'archived';
  analysis?: string;
  error?: string;
  created_at: string;
  modified_at: string;
}

export interface FileStatistics {
  [key: string]: {
    count: number;
    total_size: number;
  };
}

export const useFileStateManager = () => {
  const [files, setFiles] = useState<FileStateInfo[]>([]);
  const [statistics, setStatistics] = useState<FileStatistics>({});
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Charger les fichiers par statut
  const loadFiles = useCallback(async (status?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await getFilesByStatus(status);
      setFiles(response.files || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les statistiques
  const loadStatistics = useCallback(async () => {
    try {
      const response = await getFileStatistics();
      setStatistics(response.statistics || {});
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  }, []);

  // Enregistrer un nouveau fichier
  const registerNewFile = useCallback(async (filePath: string, originalPath?: string) => {
    try {
      const response = await registerFile(filePath, originalPath);
      // Recharger les fichiers et statistiques
      await loadFiles(selectedStatus === 'all' ? undefined : selectedStatus);
      await loadStatistics();
      return response;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement');
      throw err;
    }
  }, [loadFiles, loadStatistics, selectedStatus]);

  // Obtenir le statut d'un fichier
  const getFileStatusInfo = useCallback(async (filePath: string) => {
    try {
      const response = await getFileStatus(filePath);
      return response;
    } catch (err) {
      console.error('Erreur lors de la récupération du statut:', err);
      return null;
    }
  }, []);

  // Scanner un répertoire avec statuts
  const scanDirectory = useCallback(async (directoryPath: string) => {
    try {
      const response = await scanDirectoryWithStatus(directoryPath);
      return response.files || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du scan');
      return [];
    }
  }, []);

  // Changer le statut sélectionné
  const changeSelectedStatus = useCallback((status: string) => {
    setSelectedStatus(status);
  }, []);

  // Recharger les données
  const refresh = useCallback(async () => {
    await loadFiles(selectedStatus === 'all' ? undefined : selectedStatus);
    await loadStatistics();
  }, [loadFiles, loadStatistics, selectedStatus]);

  // Effet pour charger les données initiales
  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  useEffect(() => {
    if (selectedStatus === 'all') {
      loadFiles();
    } else {
      loadFiles(selectedStatus);
    }
  }, [selectedStatus, loadFiles]);

  // Getters pour les statistiques
  const getFilesByStatusCount = useCallback((status: string) => {
    return statistics[status]?.count || 0;
  }, [statistics]);

  const getTotalSizeByStatus = useCallback((status: string) => {
    return statistics[status]?.total_size || 0;
  }, [statistics]);

  const getTotalFiles = useCallback(() => {
    return Object.values(statistics).reduce((total, stat) => total + stat.count, 0);
  }, [statistics]);

  const getTotalSize = useCallback(() => {
    return Object.values(statistics).reduce((total, stat) => total + stat.total_size, 0);
  }, [statistics]);

  return {
    // État
    files,
    statistics,
    selectedStatus,
    loading,
    error,
    
    // Actions
    loadFiles,
    loadStatistics,
    registerNewFile,
    getFileStatusInfo,
    scanDirectory,
    changeSelectedStatus,
    refresh,
    
    // Getters
    getFilesByStatusCount,
    getTotalSizeByStatus,
    getTotalFiles,
    getTotalSize,
    
    // Setters
    setSelectedStatus,
    setError
  };
}; 