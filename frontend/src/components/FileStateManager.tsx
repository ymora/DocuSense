import React, { useState, useEffect } from 'react';
import { 
  getFilesByStatus, 
  getFileStatistics, 
  archiveFile, 
  cleanupOldFiles 
} from '../api';

interface FileInfo {
  id: string;
  original_path: string;
  current_path: string;
  name: string;
  size: number;
  status: string;
  analysis?: string;
  error?: string;
  created_at: string;
  modified_at: string;
}

interface Statistics {
  [key: string]: {
    count: number;
    total_size: number;
  };
}

interface FileStateManagerProps {
  onFileSelect?: (fileInfo: FileInfo) => void;
  onStatusChange?: () => void;
}

const FileStateManager: React.FC<FileStateManagerProps> = ({ 
  onFileSelect, 
  onStatusChange 
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const statusLabels = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    failed: 'Échoué',
    archived: 'Archivé',
    all: 'Tous'
  };

  const statusColors = {
    pending: 'text-yellow-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    archived: 'text-gray-400'
  };

  const loadFiles = async (status?: string) => {
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
  };

  const loadStatistics = async () => {
    try {
      const response = await getFileStatistics();
      setStatistics(response.statistics || {});
    } catch (err) {
      console.error('Erreur lors du chargement des statistiques:', err);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  useEffect(() => {
    if (selectedStatus === 'all') {
      loadFiles();
    } else {
      loadFiles(selectedStatus);
    }
  }, [selectedStatus]);

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
  };

  const handleArchiveFile = async (fileId: string) => {
    try {
      await archiveFile(fileId);
      loadFiles(selectedStatus === 'all' ? undefined : selectedStatus);
      loadStatistics();
      onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'archivage');
    }
  };

  const handleCleanup = async () => {
    try {
      const response = await cleanupOldFiles(30);
      alert(`${response.cleaned_count} fichiers nettoyés`);
      loadFiles(selectedStatus === 'all' ? undefined : selectedStatus);
      loadStatistics();
      onStatusChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du nettoyage');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  return (
    <div className="bg-neutral-800 rounded-lg p-4 space-y-4">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-violet-400">📁</span>
          Gestion des fichiers
        </h2>
        <button
          onClick={handleCleanup}
          className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
        >
          Nettoyer
        </button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {Object.entries(statistics).map(([status, stats]) => (
          <div key={status} className="bg-neutral-700 rounded p-2 text-center">
            <div className={`text-sm font-medium ${statusColors[status as keyof typeof statusColors] || 'text-white'}`}>
              {statusLabels[status as keyof typeof statusLabels] || status}
            </div>
            <div className="text-xs text-neutral-300">
              {stats.count} fichiers
            </div>
            <div className="text-xs text-neutral-400">
              {formatFileSize(stats.total_size)}
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {Object.keys(statusLabels).map((status) => (
          <button
            key={status}
            onClick={() => handleStatusChange(status)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              selectedStatus === status
                ? 'bg-violet-600 text-white'
                : 'bg-neutral-700 text-neutral-300 hover:bg-neutral-600'
            }`}
          >
            {statusLabels[status as keyof typeof statusLabels]}
          </button>
        ))}
      </div>

      {/* Liste des fichiers */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center text-neutral-400">Chargement...</div>
        ) : error ? (
          <div className="text-red-400 text-center">{error}</div>
        ) : files.length === 0 ? (
          <div className="text-center text-neutral-400">Aucun fichier trouvé</div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="bg-neutral-700 rounded p-3 hover:bg-neutral-600 transition-colors cursor-pointer"
              onClick={() => onFileSelect?.(file)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium truncate">
                    {file.name}
                  </div>
                  <div className="text-sm text-neutral-400">
                    {file.original_path}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-neutral-500 mt-1">
                    <span>{formatFileSize(file.size)}</span>
                    <span>{formatDate(file.modified_at)}</span>
                    <span className={`${statusColors[file.status as keyof typeof statusColors] || 'text-white'}`}>
                      {statusLabels[file.status as keyof typeof statusLabels] || file.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {file.status !== 'archived' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleArchiveFile(file.id);
                      }}
                      className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                    >
                      Archiver
                    </button>
                  )}
                </div>
              </div>
              
              {file.error && (
                <div className="mt-2 text-red-400 text-sm">
                  Erreur: {file.error}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FileStateManager; 