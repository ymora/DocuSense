import React, { useState, useRef, useEffect } from 'react';

interface AnalysisTask {
  id: string;
  filePath: string;
  fileName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  progress: number;
  error?: string;
  strategy?: string;
}

interface AnalysisQueueProps {
  tasks: AnalysisTask[];
  isVisible: boolean;
  onClose: () => void;
  onPause: () => void;
  onResume: () => void;
  onClear: () => void;
  onStartStrategy?: (strategy: string) => void;
  onStopStrategy?: (strategy: string) => void;
  onRemoveStrategy?: (strategy: string) => void;
  onRemoveTask?: (taskId: string) => void;
  isPaused: boolean;
}

const AnalysisQueue: React.FC<AnalysisQueueProps> = ({ 
  tasks, 
  isVisible, 
  onClose, 
  onPause, 
  onResume, 
  onClear, 
  onStartStrategy,
  onStopStrategy,
  onRemoveStrategy,
  onRemoveTask,
  isPaused 
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [size, setSize] = useState({ width: 350, height: 400 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const queueRef = useRef<HTMLDivElement>(null);

  // Position initiale en bas à droite
  useEffect(() => {
    if (isVisible && position.x === 0 && position.y === 0) {
      const windowWidth = window.innerWidth;
      const windowHeight = window.innerHeight;
      setPosition({
        x: windowWidth - size.width - 20,
        y: windowHeight - size.height - 80
      });
    }
  }, [isVisible, position, size]);

  // Gestion du drag
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    
    // Vérifier si on clique sur une poignée de redimensionnement
    if (target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setResizeDirection(target.dataset.direction || '');
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: size.width,
        height: size.height
      });
      e.preventDefault();
      return;
    }
    
    // Sinon, c'est du drag
    if (target === e.currentTarget || target.closest('.drag-handle')) {
      setIsDragging(true);
      const rect = queueRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      const maxX = window.innerWidth - size.width;
      const maxY = window.innerHeight - size.height;
      
      setPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
    
    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newX = position.x;
      let newY = position.y;
      
      // Redimensionnement selon la direction
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(300, Math.min(800, resizeStart.width + deltaX));
      }
      if (resizeDirection.includes('w')) {
        const widthChange = Math.max(-resizeStart.width + 300, Math.min(0, deltaX));
        newWidth = resizeStart.width - widthChange;
        newX = position.x + widthChange;
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(300, Math.min(600, resizeStart.height + deltaY));
      }
      if (resizeDirection.includes('n')) {
        const heightChange = Math.max(-resizeStart.height + 300, Math.min(0, deltaY));
        newHeight = resizeStart.height - heightChange;
        newY = position.y + heightChange;
      }
      
      // Vérifier les limites de l'écran
      if (newX < 0) newX = 0;
      if (newY < 0) newY = 0;
      if (newX + newWidth > window.innerWidth) newX = window.innerWidth - newWidth;
      if (newY + newHeight > window.innerHeight) newY = window.innerHeight - newHeight;
      
      setSize({ width: newWidth, height: newHeight });
      setPosition({ x: newX, y: newY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  };

  // Event listeners pour le drag et resize
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, dragOffset, resizeStart, resizeDirection, size, position]);

  // Grouper les tâches par stratégie
  const groupedTasks = tasks.reduce((groups, task) => {
    const strategy = task.strategy || 'Sans stratégie';
    if (!groups[strategy]) {
      groups[strategy] = [];
    }
    groups[strategy].push(task);
    return groups;
  }, {} as Record<string, AnalysisTask[]>);

  // Toggle d'un groupe
  const toggleGroup = (strategy: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(strategy)) {
        newSet.delete(strategy);
      } else {
        newSet.add(strategy);
      }
      return newSet;
    });
  };

  if (!isVisible) return null;

  return (
    <div 
      ref={queueRef}
      className="fixed z-50 bg-neutral-800 border border-neutral-600 rounded-lg shadow-lg"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
      onMouseDown={handleMouseDown}
    >
      {/* En-tête */}
      <div className="p-3 border-b border-neutral-600 drag-handle cursor-move">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="text-violet-400">📋</span>
            Queue d'analyse ({tasks.length})
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-neutral-400 hover:text-violet-300 transition-colors p-1"
            >
              {isExpanded ? '▼' : '▲'}
            </button>
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-red-400 transition-colors p-1"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      {/* Contenu expandable */}
      {isExpanded && (
        <>
          {/* Groupes par stratégie */}
          <div className="flex-1 overflow-y-auto" style={{ height: `${size.height - 120}px` }}>
            {Object.keys(groupedTasks).length === 0 ? (
              <div className="p-3 text-center text-neutral-400 text-sm">
                Aucune tâche en cours
              </div>
            ) : (
              Object.entries(groupedTasks).map(([strategy, groupTasks]) => {
                const isGroupExpanded = expandedGroups.has(strategy);
                
                return (
                  <div key={strategy} className="border-b border-neutral-700 last:border-b-0">
                    {/* En-tête du groupe - cliquable */}
                    <div 
                      className="p-2 bg-neutral-750 border-b border-neutral-600 cursor-pointer hover:bg-neutral-700 transition-colors"
                      onClick={() => toggleGroup(strategy)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-violet-300">{strategy}</span>
                          <div className="flex items-center gap-1">
                            {onStartStrategy && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStartStrategy(strategy);
                                }}
                                className="text-violet-400 hover:text-violet-300 transition-colors p-1"
                                title="Démarrer cette stratégie"
                              >
                                ▶️
                              </button>
                            )}
                            {onStopStrategy && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onStopStrategy(strategy);
                                }}
                                className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                                title="Arrêter cette stratégie"
                              >
                                ⏸️
                              </button>
                            )}
                            {onRemoveStrategy && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveStrategy(strategy);
                                }}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                title="Supprimer cette stratégie"
                              >
                                🗑️
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-neutral-400">
                            {groupTasks.length} fichier(s)
                          </span>
                          <span className="text-xs text-neutral-400">
                            {isGroupExpanded ? '▼' : '▶'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Tâches du groupe - affichées si le groupe est déployé */}
                    {isGroupExpanded && (
                      <div>
                        {groupTasks.map((task) => (
                          <div key={task.id} className="p-2 pl-4 hover:bg-neutral-700 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Croix pour supprimer */}
                                {onRemoveTask && (
                                  <button
                                    onClick={() => onRemoveTask(task.id)}
                                    className="text-red-400 hover:text-red-300 transition-colors p-1 text-xs"
                                    title="Retirer de la queue"
                                  >
                                    ❌
                                  </button>
                                )}
                                <span className="text-xs text-white truncate flex-1" title={task.fileName}>
                                  {task.fileName}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Actions globales */}
          <div className="p-2 border-t border-neutral-600 flex gap-1">
            {isPaused ? (
              <button
                onClick={onResume}
                className="flex-1 px-2 py-1 bg-black border border-violet-500 text-violet-300 text-xs rounded hover:bg-violet-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1"
              >
                <span>▶️</span>
                <span>Reprendre</span>
              </button>
            ) : (
              <button
                onClick={onPause}
                className="flex-1 px-2 py-1 bg-black border border-yellow-500 text-yellow-400 text-xs rounded hover:bg-yellow-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1"
              >
                <span>⏸️</span>
                <span>Stopper</span>
              </button>
            )}
            <button
              onClick={onClear}
              className="px-2 py-1 bg-black border border-red-500 text-red-400 text-xs rounded hover:bg-red-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-1"
            >
              <span>🗑️</span>
              <span>Vider les attentes</span>
            </button>
          </div>
        </>
      )}

      {/* Poignées de redimensionnement */}
      <div className="resize-handle absolute top-0 right-0 w-3 h-3 cursor-se-resize" data-direction="e"></div>
      <div className="resize-handle absolute bottom-0 right-0 w-3 h-3 cursor-se-resize" data-direction="se"></div>
      <div className="resize-handle absolute bottom-0 left-0 w-3 h-3 cursor-sw-resize" data-direction="sw"></div>
      <div className="resize-handle absolute top-0 left-0 w-3 h-3 cursor-nw-resize" data-direction="nw"></div>
      <div className="resize-handle absolute top-0 w-full h-1 cursor-n-resize" data-direction="n"></div>
      <div className="resize-handle absolute bottom-0 w-full h-1 cursor-s-resize" data-direction="s"></div>
      <div className="resize-handle absolute left-0 h-full w-1 cursor-w-resize" data-direction="w"></div>
      <div className="resize-handle absolute right-0 h-full w-1 cursor-e-resize" data-direction="e"></div>
    </div>
  );
};

export default AnalysisQueue; 