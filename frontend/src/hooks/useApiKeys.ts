import { useState, useEffect } from 'react';
import { ApiKeys, AIConfig } from '../components/ApiKeyManager';

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<ApiKeys>({});
  const [aiConfig, setAiConfig] = useState<AIConfig>({
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
  const [availableModes, setAvailableModes] = useState<string[]>(['local']);

  useEffect(() => {
    // Charger les clés API depuis le localStorage
    const savedKeys = localStorage.getItem('docuSense_api_keys');
    if (savedKeys) {
      const keys = JSON.parse(savedKeys);
      setApiKeys(keys);
      updateAvailableModes(keys);
    }

    // Charger la configuration IA depuis le localStorage
    const savedConfig = localStorage.getItem('docuSense_ai_config');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setAiConfig(config);
    }
  }, []);

  const updateAvailableModes = (keys: ApiKeys) => {
    const modes = ['local'];
    if (keys.openai) modes.push('openai');
    if (keys.claude) modes.push('claude');
    if (keys.mistral) modes.push('mistral');
    setAvailableModes(modes);
  };

  const saveApiKeys = (keys: ApiKeys, config?: AIConfig) => {
    setApiKeys(keys);
    localStorage.setItem('docuSense_api_keys', JSON.stringify(keys));
    updateAvailableModes(keys);

    if (config) {
      setAiConfig(config);
      localStorage.setItem('docuSense_ai_config', JSON.stringify(config));
    }
  };

  const saveAIConfig = (config: AIConfig) => {
    setAiConfig(config);
    localStorage.setItem('docuSense_ai_config', JSON.stringify(config));
  };

  const getApiKey = (provider: string): string | undefined => {
    return apiKeys[provider as keyof ApiKeys];
  };

  const hasApiKey = (provider: string): boolean => {
    return !!apiKeys[provider as keyof ApiKeys];
  };

  const isModeAvailable = (mode: string): boolean => {
    return availableModes.includes(mode);
  };

  const getAIConfig = (): AIConfig => {
    return aiConfig;
  };

  const getModelForProvider = (provider: string): string => {
    const models = aiConfig.models[provider as keyof typeof aiConfig.models];
    return models && models.length > 0 ? models[0] : '';
  };

  return {
    apiKeys,
    aiConfig,
    availableModes,
    saveApiKeys,
    saveAIConfig,
    getApiKey,
    hasApiKey,
    isModeAvailable,
    getAIConfig,
    getModelForProvider
  };
}; 