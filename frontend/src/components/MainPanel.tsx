import React from "react";

interface FileInfo {
  name: string;
  date: string;
  iaMode: "local" | "ia";
}

interface FileSummary {
  client?: string;
  date?: string;
  objet?: string;
  montant?: string;
  [key: string]: string | undefined;
}

interface MainPanelProps {
  fileInfo: FileInfo | null;
  summary: FileSummary | null;
}

export default function MainPanel({ fileInfo, summary }: MainPanelProps) {
  if (!fileInfo) {
    return (
      <main className="flex-1 p-4">
        <p className="text-gray-500 italic">Aucun fichier sélectionné.</p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="bg-white shadow rounded-xl p-6 space-y-4 border border-gray-100">
        <h2 className="text-lg font-semibold">📄 Détails du Fichier</h2>
        <ul className="text-sm text-gray-700 space-y-1">
          <li><strong>Nom :</strong> {fileInfo.name}</li>
          <li><strong>Date d'analyse :</strong> {fileInfo.date}</li>
          <li><strong>Mode IA :</strong> {fileInfo.iaMode === "ia" ? "IA OpenAI" : "IA Locale"}</li>
        </ul>

        {summary ? (
          <>
            <h3 className="text-md font-semibold mt-6">🧠 Résumé IA</h3>
            <ul className="text-sm text-gray-800 space-y-1">
              {Object.entries(summary).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value || "—"}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-gray-400 italic">Aucun résumé disponible pour ce fichier.</p>
        )}
      </div>
    </main>
  );
}
