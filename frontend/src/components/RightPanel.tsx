import React from 'react';
import { useFileStateManager } from '../hooks/useFileStateManager';

interface RightPanelProps {
  selectedFiles: any[];
}

const RightPanel: React.FC<RightPanelProps> = ({ selectedFiles }) => {
  const {
    statistics,
    getFilesByStatusCount,
    getTotalSizeByStatus,
    getTotalFiles,
    getTotalSize
  } = useFileStateManager();

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const statusLabels = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    failed: 'Échoué',
    archived: 'Archivé'
  };

  const statusColors = {
    pending: 'text-yellow-400',
    in_progress: 'text-blue-400',
    completed: 'text-green-400',
    failed: 'text-red-400',
    archived: 'text-gray-400'
  };

  return (
    <div className="w-80 bg-neutral-800 border-l border-neutral-700 flex flex-col">
      {/* En-tête */}
      <div className="p-4 border-b border-neutral-700">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-violet-400">📊</span>
          Statistiques
        </h2>
      </div>

      {/* Contenu */}
      <div className="flex-1 p-4 space-y-6 overflow-y-auto">
        {/* Statistiques générales */}
        <div className="bg-neutral-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Fichiers sélectionnés</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-300">Total :</span>
              <span className="text-white font-medium">{selectedFiles.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-green-400">Analysés :</span>
              <span className="text-green-400 font-medium">
                {selectedFiles.filter(f => f.status === 'completed').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-400">En attente :</span>
              <span className="text-blue-400 font-medium">
                {selectedFiles.filter(f => f.status === 'pending').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-red-400">Erreurs :</span>
              <span className="text-red-400 font-medium">
                {selectedFiles.filter(f => f.status === 'failed').length}
              </span>
            </div>
          </div>
        </div>

        {/* Statistiques globales du système */}
        <div className="bg-neutral-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Système global</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-neutral-300">Total fichiers :</span>
              <span className="text-white font-medium">{getTotalFiles()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-300">Taille totale :</span>
              <span className="text-white font-medium">{formatFileSize(getTotalSize())}</span>
            </div>
          </div>
        </div>

        {/* Répartition par statut */}
        <div className="bg-neutral-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Répartition par statut</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(statusLabels).map(([status, label]) => {
              const count = getFilesByStatusCount(status);
              const size = getTotalSizeByStatus(status);
              const colorClass = statusColors[status as keyof typeof statusColors];
              
              return (
                <div key={status} className="flex justify-between items-center">
                  <span className={`${colorClass}`}>{label} :</span>
                  <div className="text-right">
                    <div className={`font-medium ${colorClass}`}>{count}</div>
                    <div className="text-xs text-neutral-400">{formatFileSize(size)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Taille totale des fichiers sélectionnés */}
        <div className="bg-neutral-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Taille sélectionnée</h3>
          <div className="text-2xl font-bold text-violet-400">
            {formatFileSize(selectedFiles.reduce((acc, file) => acc + (file.size || 0), 0))}
          </div>
        </div>

        {/* Actions rapides */}
        <div className="bg-neutral-700 rounded-lg p-4">
          <h3 className="text-sm font-medium text-white mb-3">Actions rapides</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                // Action pour analyser tous les fichiers sélectionnés
                console.log('Analyser tous les fichiers sélectionnés');
              }}
              disabled={selectedFiles.length === 0}
              className="w-full px-3 py-2 bg-violet-600 text-white text-sm rounded hover:bg-violet-700 disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              Analyser tous
            </button>
            <button
              onClick={() => {
                // Action pour copier les résumés
                console.log('Copier les résumés');
              }}
              disabled={selectedFiles.filter(f => f.status === 'completed').length === 0}
              className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              Copier résumés
            </button>
            <button
              onClick={() => {
                // Action pour archiver les fichiers terminés
                console.log('Archiver fichiers terminés');
              }}
              disabled={selectedFiles.filter(f => f.status === 'completed').length === 0}
              className="w-full px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:bg-neutral-600 disabled:text-neutral-400 disabled:cursor-not-allowed transition-colors"
            >
              Archiver terminés
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RightPanel;
