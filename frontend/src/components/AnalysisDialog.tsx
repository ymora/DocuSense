import React, { useState, useEffect } from 'react';

interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: string;
  status: 'unprocessed' | 'analyzed' | 'error' | 'in_progress' | 'partial';
  analysis?: any;
}

interface Prompt {
  id: string;
  title: string;
  description?: string;
}

interface AnalysisDialogProps {
  files: FileInfo[];
  onConfirm: (promptId: string, overwrite: boolean) => void;
  onCancel: () => void;
}

const AnalysisDialog: React.FC<AnalysisDialogProps> = ({ files, onConfirm, onCancel }) => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');

  // Charger les prompts au montage
  useEffect(() => {
    const loadPrompts = async () => {
      try {
        const response = await fetch('/api/prompts');
        if (response.ok) {
          const data = await response.json();
          setPrompts(data.prompts || []);
          if (data.prompts && data.prompts.length > 0) {
            setSelectedPrompt(data.prompts[0].id);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des prompts:', error);
      }
    };

    loadPrompts();
  }, []);

  const alreadyAnalyzed = files.filter(f => f.status === 'analyzed');
  const unprocessed = files.filter(f => f.status === 'unprocessed');

  const handleConfirm = (overwrite: boolean) => {
    if (selectedPrompt) {
      onConfirm(selectedPrompt, overwrite);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4">
          Fichiers déjà analysés détectés
        </h3>
        
        {/* Sélecteur de prompt */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Prompt d'analyse :
          </label>
          <select
            value={selectedPrompt}
            onChange={(e) => setSelectedPrompt(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-violet-500"
          >
            {prompts.map((prompt) => (
              <option key={prompt.id} value={prompt.id}>
                {prompt.title}
              </option>
            ))}
          </select>
          {selectedPrompt && prompts.find(p => p.id === selectedPrompt)?.description && (
            <div className="text-xs text-neutral-500 mt-1">
              {prompts.find(p => p.id === selectedPrompt)?.description}
            </div>
          )}
        </div>
        
        <div className="mb-6">
          <p className="text-neutral-300 mb-4">
            Certains fichiers ont déjà été analysés. Que souhaitez-vous faire ?
          </p>
          
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-400">Fichiers déjà analysés :</span>
              <span className="text-green-400 font-medium">{alreadyAnalyzed.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-neutral-400">Fichiers à analyser :</span>
              <span className="text-blue-400 font-medium">{unprocessed.length}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => handleConfirm(false)}
            disabled={!selectedPrompt}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-300 hover:bg-neutral-800 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-lg transition-colors border border-neutral-700 hover:border-neutral-600"
          >
            <span className="text-xl">✅</span>
            <div>
              <div className="font-medium text-white">Ignorer les analysés</div>
              <div className="text-xs text-neutral-400">
                Analyser seulement les fichiers non traités ({unprocessed.length})
              </div>
            </div>
          </button>
          
          <button
            onClick={() => handleConfirm(true)}
            disabled={!selectedPrompt}
            className="w-full flex items-center gap-3 px-4 py-3 text-left text-neutral-300 hover:bg-neutral-800 disabled:bg-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed rounded-lg transition-colors border border-neutral-700 hover:border-neutral-600"
          >
            <span className="text-xl">🔄</span>
            <div>
              <div className="font-medium text-white">Tout réanalyser</div>
              <div className="text-xs text-neutral-400">
                Écraser les analyses existantes ({files.length} fichiers)
              </div>
            </div>
          </button>
        </div>

        <button
          onClick={onCancel}
          className="mt-6 w-full px-4 py-2 text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-600 rounded-lg"
        >
          Annuler
        </button>
      </div>
    </div>
  );
};

export default AnalysisDialog; 