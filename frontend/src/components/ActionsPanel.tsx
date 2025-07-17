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
    <aside className="w-full max-w-xs p-6 bg-white border border-gray-300 rounded-xl shadow-md">
      <h2 className="text-xl font-bold mb-6">📋 Synthèse / Actions</h2>

      <div className="space-y-4 text-sm text-gray-700">
        <p>
          📌 <strong>Synthèse ciblée :</strong>
        </p>
        <p>Fichiers sélectionnés : <span className="font-semibold">{selectedFilesCount}</span></p>
        <p>Montant total : <span className="font-semibold">{totalAmount.toFixed(2)} €</span></p>

        <button
          onClick={onGenerateSummary}
          className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
          aria-label="Générer la synthèse"
        >
          Générer la Synthèse
        </button>

        <button
          onClick={onReanalyze}
          className="mt-3 w-full bg-yellow-500 text-white py-2 rounded-lg shadow hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
          aria-label="Réanalyser"
        >
          Réanalyser
        </button>
      </div>
    </aside>
  );
};

export default ActionsPanel;
