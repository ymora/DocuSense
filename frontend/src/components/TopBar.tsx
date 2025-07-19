import React, { useState, useEffect } from 'react';
import ApiKeyManager, { ApiKeys, AIConfig } from './ApiKeyManager';
import { useApiKeys } from '../hooks/useApiKeys';

interface TopBarProps {
  backendStatus: 'connected' | 'disconnected';
  selectedMode: string;
  onModeChange: (mode: string) => void;
  isQueueVisible: boolean;
  onToggleQueue: () => void;
}

interface AIStatus {
  openai: {
    available: boolean;
    configured: boolean;
  };
  local: {
    available: boolean;
    models: string[];
  };
}

const TopBar: React.FC<TopBarProps> = ({ backendStatus, selectedMode, onModeChange, isQueueVisible, onToggleQueue }) => {
  const [aiStatus, setAiStatus] = useState<AIStatus | null>(null);
  const [showApiKeyManager, setShowApiKeyManager] = useState(false);
  const { 
    apiKeys, 
    aiConfig,
    availableModes, 
    saveApiKeys, 
    isModeAvailable 
  } = useApiKeys();

  useEffect(() => {
    const checkAIStatus = async () => {
      try {
        const status = await fetchAIStatus();
        setAiStatus(status);
      } catch (error) {
        console.error('Erreur lors de la vérification du statut IA:', error);
      }
    };

    if (backendStatus === 'connected') {
      checkAIStatus();
      const interval = setInterval(checkAIStatus, 10000); // Vérifier toutes les 10 secondes
      return () => clearInterval(interval);
    }
  }, [backendStatus]);

  const fetchAIStatus = async (): Promise<AIStatus> => {
    try {
      const response = await fetch('/api/ai-status');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut IA:', error);
    }
    
    // Statut par défaut si l'API n'est pas disponible
    return {
      openai: {
        available: true,
        configured: !!apiKeys.openai
      },
      local: {
        available: true,
        models: ['llama2', 'codellama', 'mistral']
      }
    };
  };

  const handleSaveApiKeys = (keys: ApiKeys, config: AIConfig) => {
    saveApiKeys(keys, config);
    setShowApiKeyManager(false);
  };

  const getModeIcon = (mode: string) => {
    const icons = {
      openai: '🤖',
      claude: '🧠',
      mistral: '🌪️',
      local: '⚡'
    };
    return icons[mode as keyof typeof icons] || '🤖';
  };

  const getModeColor = (mode: string) => {
    const colors = {
      openai: 'text-green-400',
      claude: 'text-orange-400',
      mistral: 'text-blue-400',
      local: 'text-purple-400'
    };
    return colors[mode as keyof typeof colors] || 'text-neutral-400';
  };

  return (
    <div className="bg-neutral-900 border-b border-neutral-700 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Zone de gauche - Informations système */}
        <div className="flex flex-col">
          <div className="flex items-end gap-3">
            <div className="text-violet-400 text-xl font-bold">DocuSense</div>
            <div className="text-neutral-400 text-sm">Système de gestion des fichiers par état</div>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-green-400' : 'bg-red-400'}`} />
            <span className="text-neutral-300 text-sm">
              {backendStatus === 'connected' ? 'Connecté' : 'Déconnecté'}
            </span>
          </div>
        </div>

        {/* Zone de droite - Contrôles utilisateur */}
        <div className="flex items-center gap-4">
          {/* Sélecteur de mode IA */}
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 text-sm">Mode IA:</span>
            <select
              value={selectedMode}
              onChange={(e) => onModeChange(e.target.value)}
              className="bg-neutral-800 border border-violet-500 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200"
            >
              {availableModes.map(mode => (
                <option key={mode} value={mode}>
                  {getModeIcon(mode)} {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Bouton Configuration IA */}
          <button
            onClick={() => setShowApiKeyManager(true)}
            className="bg-neutral-800 border border-violet-500 rounded-lg px-2 py-1 text-sm text-neutral-300 transition-all duration-200 hover:border-violet-400 hover:text-white"
          >
            ⚙️ Configuration IA
          </button>

          {/* Bouton Queue */}
          <button
            onClick={onToggleQueue}
            className={`bg-neutral-800 border border-violet-500 rounded-lg px-2 py-1 text-sm transition-all duration-200 ${
              isQueueVisible
                ? 'text-white'
                : 'text-neutral-300 hover:text-white'
            } hover:border-violet-400`}
          >
            📋 Queue
          </button>
        </div>
      </div>

      {/* Modal API Keys */}
      {showApiKeyManager && (
        <ApiKeyManager
          isOpen={showApiKeyManager}
          onClose={() => setShowApiKeyManager(false)}
          onSave={handleSaveApiKeys}
          currentKeys={apiKeys}
          currentConfig={aiConfig}
        />
      )}
    </div>
  );
};

export default TopBar;