import React, { useState, useEffect } from "react";
import TopBar from "./components/TopBar";
import FileList, { FileItem as FileItemType } from "./components/FileList";
import ActionsPanel from "./components/ActionsPanel";
import IAResultPanel from "./components/IAResultPanel";

type FileStatus = "analysed" | "pending" | "failed" | "unprocessed";

interface Resume {
  client: string;
  date: string;
  objet: string;
  montant: string;
}

interface FileItem extends FileItemType {
  id: string;
  name: string;
  status: FileStatus;
  selected: boolean;
  resume?: Resume;
  iaMode?: "Locale" | "OpenAI";
  analysedDate?: string;
}

const initialFiles: FileItem[] = [
  {
    id: "1",
    name: "bon_livraison.png",
    status: "unprocessed",
    selected: true,
  },
  {
    id: "2",
    name: "contrat_2025.pdf",
    status: "analysed",
    selected: true,
    resume: {
      client: "ACME SARL",
      date: "01/07/2025",
      objet: "Contrat annuel",
      montant: "3 000 € HT",
    },
    iaMode: "Locale",
    analysedDate: "15/07/2025",
  },
  {
    id: "3",
    name: "devis.docx",
    status: "failed",
    selected: false,
  },
  {
    id: "4",
    name: "doc_mute.jpg",
    status: "pending",
    selected: false,
  },
];

export default function App() {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);

  // Gérer la sélection des fichiers
  const toggleSelect = (id: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === id ? { ...f, selected: !f.selected } : f
      )
    );
  };

  // Ajouter de nouveaux fichiers (ex: drag & drop)
  const addFiles = (newFiles: File[]) => {
    // Création d'un ID simple ici (à améliorer en prod)
    const nextId = (files.length + 1).toString();

    const filesToAdd: FileItem[] = newFiles.map((file, i) => ({
      id: (files.length + i + 1).toString(),
      name: file.name,
      status: "unprocessed",
      selected: false,
    }));

    setFiles((prev) => [...prev, ...filesToAdd]);
  };

  // Calculer le montant total des fichiers sélectionnés avec résumé
  const selectedFiles = files.filter((f) => f.selected);
  const totalAmount = selectedFiles.reduce((acc, file) => {
    if (file.resume?.montant) {
      // On parse le montant en nombre (ex: "3 000 € HT" => 3000)
      const num = parseFloat(
        file.resume.montant.replace(/[^\d.,]/g, "").replace(",", ".")
      );
      return acc + (isNaN(num) ? 0 : num);
    }
    return acc;
  }, 0);

  // Fichier sélectionné pour afficher résumé (le premier sélectionné)
  const selectedFile = selectedFiles.length > 0 ? selectedFiles[0] : null;

  // Simuler génération synthèse (exemple simple)
  const handleGenerateSummary = () => {
    alert(
      `Génération de synthèse pour ${selectedFiles.length} fichier(s) — total ${totalAmount.toFixed(
        2
      )} €`
    );
  };

  // Simuler réanalyse (change statut)
  const handleReanalyze = () => {
    setFiles((prev) =>
      prev.map((f) =>
        f.selected && f.status !== "analysed"
          ? { ...f, status: "pending" }
          : f
      )
    );
    alert("Réanalyse lancée pour les fichiers sélectionnés.");
  };

  // Simuler affichage historique synthèses
  const handleViewHistory = () => {
    alert("Affichage de l'historique des synthèses (à implémenter).");
  };

  return (
    <div className="flex flex-col h-screen">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Panel gauche: liste fichiers */}
        <FileList
          files={files}
          onToggleSelect={toggleSelect}
          onDropFiles={addFiles}
        />

        {/* Panel central: résumé IA fichier sélectionné */}
        {selectedFile ? (
          <IAResultPanel
            fileName={selectedFile.name}
            analysedDate={selectedFile.analysedDate ?? "-"}
            iaMode={selectedFile.iaMode ?? "Locale"}
            resume={
              selectedFile.resume ?? {
                client: "-",
                date: "-",
                objet: "-",
                montant: "-",
              }
            }
          />
        ) : (
          <main className="flex-1 flex items-center justify-center text-gray-400 italic">
            Aucun fichier sélectionné.
          </main>
        )}

        {/* Panel droit: synthèse & actions */}
        <ActionsPanel
          selectedFilesCount={selectedFiles.length}
          totalAmount={totalAmount}
          onGenerateSummary={handleGenerateSummary}
          onReanalyze={handleReanalyze}
        />
      </div>
    </div>
  );
}
