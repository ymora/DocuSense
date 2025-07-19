import React from "react";

interface ActionsPanelProps {
  promptTitle: string;
  promptDescription: string;
  hasSelectedFile: boolean;
  onGenerateSummary: () => void;
  onReanalyze: () => void;
}

const ActionsPanel = ({
  promptTitle,
  promptDescription,
  hasSelectedFile,
  onGenerateSummary,
  onReanalyze,
}: ActionsPanelProps) => {
  return (
    <aside className="w-full h-full bg-white border-2 border-indigo-400 shadow-2xl rounded-xl p-8 flex flex-col items-center justify-start">
      <div className="w-full flex flex-col items-center">
        <div className="mb-4 text-center">
          <p className="font-semibold text-base">📝 Prompt sélectionné :</p>
          <p className="text-sm text-gray-700 mb-2">{promptTitle}</p>
          <p className="text-xs text-gray-500 italic">{promptDescription}</p>
        </div>
        {hasSelectedFile ? (
          <div className="space-y-2 w-full max-w-xs">
            <button
              onClick={onGenerateSummary}
              className="w-full bg-indigo-600 text-white py-2 rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            >
              Générer la Synthèse
            </button>
            <button
              onClick={onReanalyze}
              className="w-full bg-yellow-500 text-white py-2 rounded-lg shadow hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            >
              Réanalyser
            </button>
          </div>
        ) : (
          <p className="text-gray-400 italic text-center mt-8">Aucun fichier sélectionné</p>
        )}
      </div>
    </aside>
  );
};

export default ActionsPanel;
