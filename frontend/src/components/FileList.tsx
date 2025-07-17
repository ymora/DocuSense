import React, { useState, useRef } from "react";

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
  className?: string;  // ajout className
}

export default function FileList({
  files: externalFiles,
  onToggleSelect,
  onDropFiles,
  className = "",
}: FileListProps) {
  const [internalFiles, setInternalFiles] = useState<FileItem[]>(initialFiles);
  const [filter, setFilter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleClickAddFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onDropFiles || !e.target.files) return;
    onDropFiles(Array.from(e.target.files));
  };

  return (
    <aside
      className={`bg-white w-1/4 p-6 border border-gray-300 rounded-xl shadow-md flex flex-col ${className}`}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="text-xl font-bold mb-5">📁 Fichiers Clients</h2>

      <input
        type="text"
        placeholder="🔍 Filtrer"
        className="border border-gray-300 rounded px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
      />

      <ul className="space-y-3 overflow-y-auto flex-1 max-h-[70vh]">
        {filteredFiles.length === 0 && (
          <li className="text-sm text-gray-400 italic">Aucun fichier correspondant.</li>
        )}
        {filteredFiles.map((file) => (
          <li
            key={file.id}
            tabIndex={0}
            className={`flex items-center gap-3 cursor-pointer rounded-md px-3 py-2
              hover:bg-indigo-100 focus:bg-indigo-100 focus:outline-none
              ${file.selected ? "bg-indigo-200 font-semibold" : ""}`}
            onClick={() => handleSelect(file.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleSelect(file.id);
              }
            }}
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

      <div
        onClick={handleClickAddFiles}
        className="mt-6 border-2 border-dashed border-gray-400 rounded-lg p-5 text-center text-gray-500 text-sm cursor-pointer
          hover:border-indigo-500 hover:text-indigo-600 transition-colors"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClickAddFiles();
          }
        }}
      >
        Glissez vos fichiers ici
        <br />
        ou cliquez pour ajouter
      </div>

      <input
        type="file"
        multiple
        ref={fileInputRef}
        className="hidden"
        onChange={handleFilesSelected}
      />
    </aside>
  );
}
