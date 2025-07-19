import React from "react";

interface Resume {
  client?: string;
  date?: string;
  objet?: string;
  montant?: string;
}

interface IAResultPanelProps {
  fileName: string;
  analysedDate: string;
  iaMode: string;
  resume: Resume;
  summary?: string;
}

const IAResultPanel = ({
  fileName,
  analysedDate,
  iaMode,
  resume,
  summary,
}: IAResultPanelProps) => {
  return (
    <aside className="w-full h-full bg-white border-2 border-indigo-400 shadow-xl rounded-xl p-8 flex flex-col justify-start">
      <div className="w-full">
        {/* Résumé IA complet en haut */}
        <div className="mb-4">
          <h3 className="font-semibold text-indigo-700 mb-2 text-lg">Résumé IA</h3>
          {summary && summary !== 'Aucun résumé disponible' ? (
            <pre className="whitespace-pre-wrap text-base text-gray-900 mb-2 leading-snug">{summary}</pre>
          ) : (
            <p className="text-gray-400 italic mb-2 leading-snug">Aucun résumé disponible</p>
          )}
        </div>
        {/* Métadonnées en dessous, icônes adaptées, espacement fin */}
        <div className="text-sm text-gray-700 space-y-0.5">
          <div><span className="mr-1">📄</span><span className="font-semibold">Fichier :</span> {fileName}</div>
          <div><span className="mr-1">📅</span><span className="font-semibold">Analysé le :</span> {analysedDate}</div>
          <div><span className="mr-1">🤖</span><span className="font-semibold">Mode IA :</span> {iaMode}</div>
          {resume.client && <div><span className="mr-1">👤</span><span className="font-semibold">Client :</span> {resume.client}</div>}
          {resume.date && <div><span className="mr-1">📆</span><span className="font-semibold">Date :</span> {resume.date}</div>}
          {resume.objet && <div><span className="mr-1">📝</span><span className="font-semibold">Objet :</span> {resume.objet}</div>}
          <div><span className="mr-1">💰</span><span className="font-semibold">Montant :</span> {resume.montant && resume.montant !== '-' ? resume.montant : 'Sans objet'}</div>
        </div>
      </div>
    </aside>
  );
};

export default IAResultPanel;
