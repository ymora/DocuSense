import React from "react";

interface Resume {
  client: string;
  date: string;
  objet: string;
  montant: string;
}

interface IAResultPanelProps {
  fileName: string;
  analysedDate: string;
  iaMode: string;
  resume: Resume;
}

const IAResultPanel = ({
  fileName,
  analysedDate,
  iaMode,
  resume,
}: IAResultPanelProps) => {
  return (
    <main className="flex-1 p-6">
      <h2 className="text-lg font-semibold mb-4">🧠 Résumé IA du Fichier</h2>

      <div className="border rounded-lg p-4 bg-white shadow">
        <div className="mb-2 text-sm">
          <p>
            ✅ <strong>Fichier :</strong> {fileName}
          </p>
          <p>
            📅 <strong>Analysé le :</strong> {analysedDate}
          </p>
          <p>
            🤖 <strong>Mode IA :</strong> {iaMode}
          </p>
        </div>

        <hr className="my-4" />

        <div className="text-sm space-y-2">
          <p>
            <strong>📄 Résumé :</strong>
          </p>
          <p>
            👤 <strong>Client :</strong> {resume.client}
          </p>
          <p>
            📅 <strong>Date :</strong> {resume.date}
          </p>
          <p>
            📝 <strong>Objet :</strong> {resume.objet}
          </p>
          <p>
            💰 <strong>Montant :</strong> {resume.montant}
          </p>
        </div>
      </div>
    </main>
  );
};

export default IAResultPanel;
