import React from "react";

export interface FileData {
  id: string;
  name: string;
  selected: boolean;
  status: "ready" | "processing" | "error";
  summary?: { montant?: number };
}

interface RightPanelProps {
  files: FileData[];
  onGenerateSummary: () => void;
  onReanalyze: () => void;
  onViewHistory: () => void;
}

export default function RightPanel({
  files,
  onGenerateSummary,
  onReanalyze,
  onViewHistory,
}: RightPanelProps) {
  const selectedFiles = files.filter((f) => f.selected && f.status === "ready");

  const totalMontant = selectedFiles.reduce((acc, file) => {
    const montant = file.summary?.montant ?? 0;
    return acc + (isNaN(montant) ? 0 : montant);
  }, 0);

  return (
    <aside className="w-72 bg-white border-l border-gray-200 p-4 flex flex-col justify-between">
      <div>
        <h2 className="text-lg font-semibold mb-4">📊 Synthèse Ciblée</h2>
        <p className="text-sm text-gray-600">
          {selectedFiles.length} fichier(s) sélectionné(s)
        </p>
        <p className="text-sm text-gray-700 mt-2">
          💰 Montant total :{" "}
          <span className="font-bold text-green-600">{totalMontant.toFixed(2)} €</span>
        </p>
      </div>

      <div className="space-y-2 mt-6">
        <button
          onClick={onGenerateSummary}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm px-4 py-2 rounded-xl"
        >
          Générer la Synthèse
        </button>
        <button
          onClick={onReanalyze}
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-white text-sm px-4 py-2 rounded-xl"
        >
          Réanalyser
        </button>
        <button
          onClick={onViewHistory}
          className="w-full bg-gray-200 hover:bg-gray-300 text-sm px-4 py-2 rounded-xl"
        >
          Historique des Synthèses
        </button>
      </div>
    </aside>
  );
}
