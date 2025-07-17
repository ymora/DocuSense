import React from "react";

interface ActionsPanelProps {
  selectedFilesCount: number;
  totalAmount: number;
  onGenerateSummary: () => void;
  onReanalyze: () => void;
}

const ActionsPanel = ({
  selectedFilesCount,
  totalAmount,
  onGenerateSummary,
  onReanalyze,
}: ActionsPanelProps) => {
  return (
    <aside className="w-full max-w-xs p-4 border-l bg-gray-50 shadow-inner">
      <h2 className="text-lg font-semibold mb-4">📋 Synthèse / Actions</h2>

      <div className="space-y-2 text-sm">
        <p>
          📌 <strong>Synthèse ciblée :</strong>
        </p>
        <p>Fichiers sélectionnés : {selectedFilesCount}</p>
        <p>Montant total : {totalAmount.toFixed(2)} €</p>

        <button
          onClick={onGenerateSummary}
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
        >
          Générer la Synthèse
        </button>

        <button
          onClick={onReanalyze}
          className="mt-2 w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600"
        >
          Réanalyser
        </button>
      </div>
    </aside>
  );
};

export default ActionsPanel;
