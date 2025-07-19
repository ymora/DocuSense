import React from 'react';

interface AnalysisTask {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  error?: string;
  strategy?: string; // Stratégie assignée au fichier
}

interface AnalysisProgressProps {
  tasks: AnalysisTask[];
  isVisible: boolean;
  onClose: () => void;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ tasks, isVisible, onClose }) => {
  if (!isVisible) return null;

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const errorTasks = tasks.filter(t => t.status === 'error');

  const totalTasks = tasks.length;
  const completedCount = completedTasks.length;
  const errorCount = errorTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        {/* En-tête */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="text-violet-400">🔄</span>
            Progression des analyses
          </h3>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Barre de progression globale */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-neutral-300 mb-2">
            <span>Progression globale</span>
            <span>{completedCount}/{totalTasks} terminées ({progressPercentage}%)</span>
          </div>
          <div className="w-full bg-neutral-700 rounded-full h-2">
            <div 
              className="bg-violet-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-neutral-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{pendingTasks.length}</div>
            <div className="text-xs text-neutral-400">En attente</div>
          </div>
          <div className="bg-neutral-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-yellow-400">{inProgressTasks.length}</div>
            <div className="text-xs text-neutral-400">En cours</div>
          </div>
          <div className="bg-neutral-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{completedTasks.length}</div>
            <div className="text-xs text-neutral-400">Terminées</div>
          </div>
          <div className="bg-neutral-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-red-400">{errorTasks.length}</div>
            <div className="text-xs text-neutral-400">Erreurs</div>
          </div>
        </div>

        {/* Liste des tâches avec stratégies */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-neutral-300 mb-3">Détail des fichiers</h4>
          
          {tasks.map((task) => (
            <div key={task.id} className="bg-neutral-700 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white truncate max-w-xs">
                    {task.fileName}
                  </span>
                  {task.strategy && (
                    <span className="text-xs bg-violet-500/20 text-violet-300 px-2 py-1 rounded">
                      {task.strategy}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    task.status === 'pending' ? 'bg-blue-500/20 text-blue-300' :
                    task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-300' :
                    task.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                    'bg-red-500/20 text-red-300'
                  }`}>
                    {task.status === 'pending' ? '⏳' :
                     task.status === 'in_progress' ? '🔄' :
                     task.status === 'completed' ? '✅' : '❌'}
                    {task.status === 'pending' ? 'En attente' :
                     task.status === 'in_progress' ? 'En cours' :
                     task.status === 'completed' ? 'Terminé' : 'Erreur'}
                  </span>
                </div>
              </div>
              
              {/* Barre de progression individuelle */}
              {task.status === 'in_progress' && (
                <div className="w-full bg-neutral-600 rounded-full h-1 mb-2">
                  <div 
                    className="bg-violet-400 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              )}
              
              {/* Message d'erreur */}
              {task.status === 'error' && task.error && (
                <div className="text-xs text-red-400 mt-1">
                  Erreur : {task.error}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-end mt-6 pt-4 border-t border-neutral-600">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProgress; 