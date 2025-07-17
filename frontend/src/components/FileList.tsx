import React, { useState } from "react";

export type FileStatus = "analysed" | "pending" | "failed" | "unprocessed";

export type FileItem = {
  id: string;
  name: string;
  status: FileStatus;
  selected: boolean;
};

const iconMap: Record<FileStatus, string> = {
  analysed: "✅",
  pending: "⏳",
  failed: "❌",
  unprocessed: "🟡",
};

const initialFiles: FileItem[] = [
  { id: "1", name: "bon_livraison.png", status: "unprocessed", selected: true },
  { id: "2", name: "contrat_2025.pdf", status: "analysed", selected: true },
  { id: "3", name: "devis.docx", status: "failed", selected: false },
  { id: "4", name: "doc_mute.jpg", status: "pending", selected: false },
];

interface FileListProps {
  files?: FileItem[];
  onToggleSelect?: (id: string) => void;
  onDropFiles?: (files: File[]) => void;
}

export default function FileList({
  files: externalFiles,
  onToggleSelect,
  onDropFiles,
}: FileListProps) {
  const [internalFiles, setInternalFiles] = useState<FileItem[]>(initialFiles);
  const [filter, setFilter] = useState("");

  // Use external files if passed, else internal state
  const files = externalFiles ?? internalFiles;

  const handleSelect = (id: string) => {
    if (onToggleSelect) {
      onToggleSelect(id);
    } else {
      setInternalFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, selected: !f.selected } : f))
      );
    }
  };

  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(filter.toLowerCase())
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!onDropFiles) return;
    const droppedFiles = Array.from(e.dataTransfer.files);
    onDropFiles(droppedFiles);
  };

  return (
    <aside
      className="bg-gray-100 w-1/4 p-4 border-r flex flex-col"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="text-lg font-semibold mb-4">📁 Fichiers Clients</h2>

      <input
        type="text"
        placeholder="🔍 Filtrer"
        className="border rounded px-2 py-1 text-sm mb-4"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <ul className="space-y-2 overflow-y-auto flex-1 max-h-[70vh]">
        {filteredFiles.length === 0 && (
          <li className="text-sm text-gray-500">Aucun fichier correspondant.</li>
        )}
        {filteredFiles.map((file) => (
          <li
            key={file.id}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-200 rounded px-2 py-1"
            onClick={() => handleSelect(file.id)}
          >
            <input
              type="checkbox"
              checked={file.selected}
              onChange={() => handleSelect(file.id)}
              onClick={(e) => e.stopPropagation()}
            />
            <span className="text-sm truncate w-full" title={file.name}>
              {iconMap[file.status]} {file.name}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 border-dashed border-2 border-gray-400 rounded p-4 text-center text-gray-500 text-sm cursor-pointer">
        Glissez vos fichiers ici
        <br />
        ou cliquez pour ajouter
      </div>
    </aside>
  );
}
