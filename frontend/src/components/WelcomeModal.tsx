import React from 'react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigureApi: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ isOpen, onClose, onConfigureApi }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-white mb-4">Bienvenue dans DocuSense</h1>
          <p className="text-lg text-neutral-300">
            Votre assistant intelligent pour l'analyse de documents
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              🚀 Prêt à commencer ?
            </h3>
            <p className="text-neutral-300 mb-4">
              DocuSense peut analyser vos documents de plusieurs façons :
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-neutral-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🏠</div>
                <h4 className="font-medium text-white mb-1">Mode Local</h4>
                <p className="text-xs text-neutral-400">
                  Analyse locale, aucune clé requise
                </p>
              </div>
              
              <div className="bg-neutral-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🤖</div>
                <h4 className="font-medium text-white mb-1">IA Externe</h4>
                <p className="text-xs text-neutral-400">
                  OpenAI, Claude, Mistral
                </p>
              </div>
              
              <div className="bg-neutral-700 rounded-lg p-4 text-center">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-medium text-white mb-1">Sécurisé</h4>
                <p className="text-xs text-neutral-400">
                  Clés stockées localement
                </p>
              </div>
            </div>
          </div>

          <div className="bg-violet-900/20 border border-violet-700/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
              ⚙️ Configuration recommandée
            </h3>
            <p className="text-neutral-300 mb-4">
              Pour une expérience optimale, nous vous recommandons de configurer au moins une clé API externe :
            </p>
            
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🤖</span>
                <div>
                  <div className="font-medium text-white">OpenAI</div>
                  <div className="text-sm text-neutral-400">GPT-4, GPT-3.5 Turbo</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl">🧠</span>
                <div>
                  <div className="font-medium text-white">Claude</div>
                  <div className="text-sm text-neutral-400">Claude 3.5 Sonnet, Claude 3 Opus</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌪️</span>
                <div>
                  <div className="font-medium text-white">Mistral</div>
                  <div className="text-sm text-neutral-400">Mistral Large, Mistral Medium</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onConfigureApi}
            className="bg-violet-600 hover:bg-violet-700 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            ⚙️ Configurer les clés API
          </button>
          
          <button
            onClick={onClose}
            className="bg-neutral-700 hover:bg-neutral-600 text-white px-8 py-3 rounded-lg font-medium transition-colors"
          >
            Commencer avec le mode local
          </button>
        </div>

        <div className="text-center mt-6">
          <p className="text-sm text-neutral-400">
            Vous pourrez toujours configurer les clés API plus tard depuis la barre supérieure
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal; 