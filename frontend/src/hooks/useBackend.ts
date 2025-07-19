import { useState, useEffect, useCallback } from 'react';

export type BackendStatus = 'connected' | 'disconnected' | 'checking';

export const useBackend = () => {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('checking');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const checkBackend = useCallback(async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        setBackendStatus('connected');
      } else {
        setBackendStatus('disconnected');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du backend:', error);
      setBackendStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    checkBackend();
    
    // Vérifier le backend toutes les 30 secondes
    const interval = setInterval(checkBackend, 30000);
    
    return () => clearInterval(interval);
  }, [checkBackend]);

  return {
    backendStatus,
    isAnalyzing,
    setIsAnalyzing,
    checkBackend
  };
}; 