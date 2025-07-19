import React, { useState } from 'react';
import { FileInfo } from '../types';

interface MainPanelProps {
  files: FileInfo[];
  onContextMenu: (event: React.MouseEvent, filePath: string) => void;
  prompts?: any[];
  analysisQueue?: any[];
  onAnalyzeWithStrategy?: (strategy: string) => void;
  onAnalyzeAll?: () => void;
}

const MainPanel: React.FC<MainPanelProps> = ({ 
  files, 
  onContextMenu, 
  prompts = [], 
  analysisQueue = [],
  onAnalyzeWithStrategy,
  onAnalyzeAll
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (files.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-900">
        <div className="text-center text-neutral-400">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="text-xl font-medium mb-2">Aucun fichier sélectionné</h3>
          <p className="text-sm">Sélectionnez des fichiers dans l'arborescence pour voir leurs détails</p>
        </div>
      </div>
    );
  }

  // Grouper les fichiers par statut d'analyse
  const filesByStatus = files.reduce((groups, file) => {
    const status = file.status || 'unprocessed';
    if (!groups[status]) {
      groups[status] = [];
    }
    groups[status].push(file);
    return groups;
  }, {} as Record<string, FileInfo[]>);

  // Grouper les fichiers par stratégie d'analyse dans la queue
  const filesInQueue = analysisQueue.reduce((groups, task) => {
    const strategy = task.strategy || 'Sans stratégie';
    if (!groups[strategy]) {
      groups[strategy] = [];
    }
    groups[strategy].push(task);
    return groups;
  }, {} as Record<string, any[]>);

  // Compter les fichiers en attente par stratégie
  const pendingFilesByStrategy = filesByStatus.pending?.reduce((groups, file) => {
    // Pour l'instant, on groupe par type de fichier, mais on pourrait améliorer
    const strategy = 'Analyse générale';
    if (!groups[strategy]) {
      groups[strategy] = [];
  }
    groups[strategy].push(file);
    return groups;
  }, {} as Record<string, FileInfo[]>) || {};

  return (
    <div className="flex-1 bg-neutral-900 overflow-auto">
      <div className="p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <span className="text-violet-400">📄</span>
          Fichiers sélectionnés ({files.length})
        </h2>

        {/* Prompts disponibles */}
        {prompts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-violet-400">🎯</span>
                Prompts d'analyse disponibles
              </h3>
              <button
                onClick={() => toggleSection('prompts')}
                className="text-neutral-400 hover:text-violet-300 transition-colors"
              >
                {expandedSections.has('prompts') ? '▼' : '▶'}
              </button>
            </div>
            {expandedSections.has('prompts') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-3 hover:border-violet-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-white text-sm">{prompt.title}</span>
                      <span className="text-xs text-neutral-400">{prompt.category}</span>
                    </div>
                    <p className="text-xs text-neutral-300 line-clamp-2">{prompt.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fichiers en attente d'analyse */}
        {filesByStatus.pending && filesByStatus.pending.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-violet-400">⏳</span>
                Fichiers en attente d'analyse ({filesByStatus.pending.length})
              </h3>
              <div className="flex items-center gap-2">
                {onAnalyzeAll && (
                  <button
                    onClick={onAnalyzeAll}
                    className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    🚀 Analyser tout
                  </button>
                )}
                <button
                  onClick={() => toggleSection('pending')}
                  className="text-neutral-400 hover:text-violet-300 transition-colors"
                >
                  {expandedSections.has('pending') ? '▼' : '▶'}
                </button>
              </div>
            </div>
            {expandedSections.has('pending') && (
              <div className="space-y-2">
                {Object.entries(pendingFilesByStrategy).map(([strategy, strategyFiles]) => (
                  <div key={strategy} className="bg-neutral-800 border border-neutral-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-violet-300 text-sm">{strategy}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400">{strategyFiles.length} fichier(s)</span>
                        {onAnalyzeWithStrategy && (
                          <button
                            onClick={() => onAnalyzeWithStrategy(strategy)}
                            className="bg-violet-600 hover:bg-violet-700 text-white px-2 py-1 rounded text-xs transition-colors"
                          >
                            ▶️ Démarrer
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1">
                      {strategyFiles.map((file) => (
                        <div
                          key={file.path}
                          className="flex items-center justify-between py-1 px-2 bg-neutral-900 rounded"
                          onContextMenu={(e) => onContextMenu(e, file.path)}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-violet-400 text-xs">📄</span>
                            <span className="text-white text-xs">{file.name}</span>
                            <span className="text-xs text-neutral-400">({(file.size / 1024).toFixed(1)} KB)</span>
                          </div>
                          <span className="text-xs text-neutral-500">Clic droit pour analyser</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fichiers en cours d'analyse */}
        {Object.keys(filesInQueue).length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-violet-400">🔄</span>
                Fichiers en cours d'analyse
              </h3>
              <button
                onClick={() => toggleSection('in-progress')}
                className="text-neutral-400 hover:text-violet-300 transition-colors"
              >
                {expandedSections.has('in-progress') ? '▼' : '▶'}
              </button>
            </div>
            {expandedSections.has('in-progress') && (
              <div>
                {Object.entries(filesInQueue).map(([strategy, tasks]) => (
                  <div key={strategy} className="mb-4">
                    <h4 className="text-md font-medium text-violet-300 mb-2">{strategy}</h4>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <div
                          key={task.id}
                          className="bg-neutral-800 border border-neutral-700 rounded-lg p-3"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm ${
                                task.status === 'pending' ? 'text-violet-400' :
                                task.status === 'in_progress' ? 'text-violet-300' :
                                task.status === 'completed' ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {task.status === 'pending' ? '⏳' :
                                 task.status === 'in_progress' ? '🔄' :
                                 task.status === 'completed' ? '✅' : '❌'}
                              </span>
                              <span className="font-medium text-white text-sm">{task.fileName}</span>
                            </div>
                            <span className="text-xs text-neutral-400">{task.status}</span>
                          </div>
                          {task.status === 'in_progress' && (
                            <div className="w-full bg-neutral-700 rounded-full h-1">
                              <div 
                                className="bg-violet-400 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${task.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
              ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fichiers analysés */}
        {filesByStatus.analyzed && filesByStatus.analyzed.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <span className="text-green-400">✅</span>
                Fichiers analysés ({filesByStatus.analyzed.length})
              </h3>
              <button
                onClick={() => toggleSection('analyzed')}
                className="text-neutral-400 hover:text-violet-300 transition-colors"
              >
                {expandedSections.has('analyzed') ? '▼' : '▶'}
              </button>
            </div>
            {expandedSections.has('analyzed') && (
              <div className="space-y-4">
                {filesByStatus.analyzed.map((file) => (
                  <div
                    key={file.path}
                    className="bg-neutral-800 border border-neutral-700 rounded-lg p-4"
                    onContextMenu={(e) => onContextMenu(e, file.path)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-green-400">✅</span>
                        <span className="font-medium text-white">{file.name}</span>
                        <span className="text-xs text-neutral-400">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="text-xs text-neutral-500">{file.path}</div>
                    </div>

                    <div className="text-sm text-neutral-300">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-neutral-400">Type :</span> {file.type || 'Inconnu'}
                        </div>
                        <div>
                          <span className="text-neutral-400">Statut :</span> {file.status}
                        </div>
                      </div>
                    </div>

                    {file.analysis && (
                      <div className="mt-3 pt-3 border-t border-neutral-700">
                        <h4 className="text-sm font-medium text-violet-400 mb-2">Résumé IA</h4>
                        <div className="text-sm text-neutral-300 bg-neutral-900 rounded p-2">
                          {file.analysis.summary || file.analysis.content || 'Résumé non disponible'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainPanel;
