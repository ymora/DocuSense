import React, { useState, useEffect } from 'react';

interface ApiKeyManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: ApiKeys, config: AIConfig) => void;
  currentKeys?: ApiKeys;
  currentConfig?: AIConfig;
}

export interface ApiKeys {
  openai?: string;
  claude?: string;
  mistral?: string;
}

export interface AIConfig {
  defaultModel: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  enableStreaming: boolean;
  enableLogging: boolean;
  models: {
    openai: string[];
    claude: string[];
    mistral: string[];
    local: string[];
  };
}

const ApiKeyManager: React.FC<ApiKeyManagerProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentKeys,
  currentConfig 
}) => {
  const [keys, setKeys] = useState<ApiKeys>(currentKeys || {});
  const [config, setConfig] = useState<AIConfig>(currentConfig || {
    defaultModel: 'gpt-4',
    temperature: 0.2,
    maxTokens: 4000,
    timeout: 30000,
    retryAttempts: 3,
    enableStreaming: false,
    enableLogging: true,
    models: {
      openai: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
      claude: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
      mistral: ['mistral-large', 'mistral-medium', 'mistral-small'],
      local: ['llama2', 'codellama', 'mistral']
    }
  });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'keys' | 'config' | 'advanced'>('keys');

  useEffect(() => {
    if (isOpen) {
      if (currentKeys) setKeys(currentKeys);
      if (currentConfig) setConfig(currentConfig);
    }
  }, [isOpen, currentKeys, currentConfig]);

  const validateKey = (provider: string, key: string): boolean => {
    if (!key.trim()) return true; // Vide est OK
    
    const patterns = {
      openai: /^sk-[a-zA-Z0-9]{32,}$/,
      claude: /^sk-ant-[a-zA-Z0-9]{32,}$/,
      mistral: /^[a-zA-Z0-9]{32,}$/
    };
    
    return patterns[provider as keyof typeof patterns]?.test(key) || false;
  };

  const handleKeyChange = (provider: string, value: string) => {
    setKeys(prev => ({ ...prev, [provider]: value }));
    
    // Valider la clé
    if (value.trim() && !validateKey(provider, value)) {
      setErrors(prev => ({
        ...prev,
        [provider]: `Format de clé ${provider} invalide`
      }));
    } else {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[provider];
        return newErrors;
      });
    }
  };

  const handleConfigChange = (field: keyof AIConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) return;
    
    onSave(keys, config);
    onClose();
  };

  const toggleKeyVisibility = (provider: string) => {
    setShowKeys(prev => ({ ...prev, [provider]: !prev[provider] }));
  };

  const getProviderInfo = (provider: string) => {
    const info = {
      openai: {
        name: 'OpenAI',
        icon: '🤖',
        description: 'GPT-4, GPT-3.5 Turbo, GPT-4 Turbo',
        placeholder: 'sk-...',
        url: 'https://platform.openai.com/api-keys',
        color: 'text-green-400'
      },
      claude: {
        name: 'Claude',
        icon: '🧠',
        description: 'Claude 3.5 Sonnet, Claude 3 Opus',
        placeholder: 'sk-ant-...',
        url: 'https://console.anthropic.com/',
        color: 'text-orange-400'
      },
      mistral: {
        name: 'Mistral',
        icon: '🌪️',
        description: 'Mistral Large, Mistral Medium',
        placeholder: '...',
        url: 'https://console.mistral.ai/',
        color: 'text-blue-400'
      },
      local: {
        name: 'IA Locale',
        icon: '🏠',
        description: 'Ollama, modèles locaux',
        placeholder: 'Aucune clé requise',
        url: 'https://ollama.ai/',
        color: 'text-purple-400'
      }
    };
    return info[provider as keyof typeof info];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-w-3xl w-full mx-4 shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Configuration IA</h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-neutral-700 mb-4">
          {[
            { id: 'keys', label: '🔑 Clés API', icon: '🔑' },
            { id: 'config', label: '⚙️ Configuration', icon: '⚙️' },
            { id: 'advanced', label: '🔧 Avancé', icon: '🔧' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-violet-400 border-b-2 border-violet-400'
                  : 'text-neutral-400 hover:text-neutral-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'keys' && (
          <div className="space-y-4">
            {(['openai', 'claude', 'mistral', 'local'] as const).map((provider) => {
              const info = getProviderInfo(provider);
              const hasError = errors[provider];
              const isVisible = showKeys[provider];
              const isLocal = provider === 'local';
              
              return (
                <div key={provider} className="bg-neutral-800 border border-neutral-600 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{info.icon}</span>
                    <div>
                      <h3 className={`text-base font-medium ${info.color}`}>{info.name}</h3>
                      <p className="text-xs text-neutral-400">{info.description}</p>
                    </div>
                  </div>
                  
                  {!isLocal && (
                    <div className="space-y-2">
                      <div className="relative">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={keys[provider] || ''}
                          onChange={(e) => handleKeyChange(provider, e.target.value)}
                          placeholder={info.placeholder}
                          className={`w-full px-3 py-2 bg-neutral-700 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm ${
                            hasError ? 'border-red-500' : 'border-neutral-600'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => toggleKeyVisibility(provider)}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white text-lg"
                        >
                          {isVisible ? '👁️' : '🔒'}
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={info.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Obtenir une clé API →
                        </a>
                        {keys[provider] && !hasError && (
                          <span className="text-green-400">✓ Configurée</span>
                        )}
                        {keys[provider] && hasError && (
                          <span className="text-red-400">{hasError}</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {isLocal && (
                    <div className="space-y-2">
                      <div className="bg-neutral-700 border border-neutral-600 rounded-lg p-2">
                        <p className="text-neutral-300 text-xs">
                          L'IA locale utilise Ollama pour exécuter des modèles localement.
                          Aucune clé API n'est requise, mais Ollama doit être installé.
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <a
                          href={info.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          Installer Ollama →
                        </a>
                        <span className="text-green-400">✓ Disponible</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'config' && (
          <div className="space-y-4">
            {/* Modèle par défaut */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3">
              <h3 className="text-base font-medium text-white mb-2">🎯 Modèle par défaut</h3>
              <select
                value={config.defaultModel}
                onChange={(e) => handleConfigChange('defaultModel', e.target.value)}
                className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
              >
                <optgroup label="OpenAI">
                  {config.models.openai.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </optgroup>
                <optgroup label="Claude">
                  {config.models.claude.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </optgroup>
                <optgroup label="Mistral">
                  {config.models.mistral.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </optgroup>
                <optgroup label="Local">
                  {config.models.local.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            {/* Paramètres de génération */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3">
              <h3 className="text-base font-medium text-white mb-2">🎲 Paramètres de génération</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Température: {config.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={config.temperature}
                    onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-neutral-400 mt-1">
                    <span>Factuel (0)</span>
                    <span>Équilibré (1)</span>
                    <span>Créatif (2)</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Tokens maximum: {config.maxTokens}
                  </label>
                  <input
                    type="range"
                    min="1000"
                    max="8000"
                    step="500"
                    value={config.maxTokens}
                    onChange={(e) => handleConfigChange('maxTokens', parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="space-y-4">
            {/* Paramètres réseau */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3">
              <h3 className="text-base font-medium text-white mb-2">🌐 Paramètres réseau</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Timeout (ms): {config.timeout}
                  </label>
                  <input
                    type="range"
                    min="10000"
                    max="60000"
                    step="5000"
                    value={config.timeout}
                    onChange={(e) => handleConfigChange('timeout', parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                <div>
                  <label className="block text-xs text-neutral-300 mb-1">
                    Tentatives de retry: {config.retryAttempts}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={config.retryAttempts}
                    onChange={(e) => handleConfigChange('retryAttempts', parseInt(e.target.value))}
                    className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>
            </div>

            {/* Options avancées */}
            <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-3">
              <h3 className="text-base font-medium text-white mb-2">🔧 Options avancées</h3>
              <div className="space-y-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableStreaming}
                    onChange={(e) => handleConfigChange('enableStreaming', e.target.checked)}
                    className="w-4 h-4 text-violet-600 bg-neutral-700 border-neutral-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-neutral-300">Activer le streaming (réponses en temps réel)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.enableLogging}
                    onChange={(e) => handleConfigChange('enableLogging', e.target.checked)}
                    className="w-4 h-4 text-violet-600 bg-neutral-700 border-neutral-600 rounded focus:ring-violet-500"
                  />
                  <span className="text-sm text-neutral-300">Activer les logs détaillés</span>
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-700">
          <div className="text-xs text-neutral-400">
            Les clés API sont stockées localement et ne sont jamais envoyées à nos serveurs
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1 bg-black border border-neutral-600 text-neutral-300 rounded-lg hover:border-neutral-500 hover:text-white transition-all duration-200 text-sm"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={Object.keys(errors).length > 0}
              className="px-4 py-1 bg-black border border-violet-500 text-violet-300 rounded-lg hover:bg-violet-500 hover:text-white disabled:bg-neutral-800 disabled:border-neutral-700 disabled:text-neutral-500 disabled:cursor-not-allowed transition-all duration-200 text-sm"
            >
              Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyManager; 