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
    <main className="flex-1 p-6 bg-gray-50">
      <h2 className="text-xl font-bold mb-6">🧠 Résumé IA du Fichier</h2>

      <section className="bg-white rounded-xl shadow-md p-6 border border-gray-300 max-w-xl">
        <div className="mb-4 text-sm text-gray-700 space-y-2">
          <p>
            ✅ <strong>Fichier :</strong> <span className="font-semibold">{fileName}</span>
          </p>
          <p>
            📅 <strong>Analysé le :</strong> <span className="font-semibold">{analysedDate}</span>
          </p>
          <p>
            🤖 <strong>Mode IA :</strong> <span className="font-semibold">{iaMode}</span>
          </p>
        </div>

        <hr className="my-6 border-gray-300" />

        <div className="text-sm text-gray-700 space-y-3">
          <p className="font-semibold text-base">📄 Résumé :</p>
          <p>
            👤 <strong>Client :</strong> <span className="font-semibold">{resume.client}</span>
          </p>
          <p>
            📅 <strong>Date :</strong> <span className="font-semibold">{resume.date}</span>
          </p>
          <p>
            📝 <strong>Objet :</strong> <span className="font-semibold">{resume.objet}</span>
          </p>
          <p>
            💰 <strong>Montant :</strong> <span className="font-semibold">{resume.montant}</span>
          </p>
        </div>
      </section>
    </main>
  );
};

export default IAResultPanel;
