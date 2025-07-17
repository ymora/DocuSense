import React from "react";

interface FileItem {
  id: string;
  name: string;
  status: "pending" | "processing" | "done" | "error";
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

interface LeftPanelProps {
  files?: FileItem[];
  onDropFiles: (files: File[]) => void;
}

const statusIcons = {
  pending: "⏳",
  processing: "🔄",
  done: "✅",
  error: "❌",
};

export default function LeftPanel({ files = [], onDropFiles }: LeftPanelProps) {
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onDropFiles(dropped);
  };

  return (
    <aside
      className="w-1/4 p-6 bg-white border-r border-gray-200 shadow-inner flex flex-col"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="text-xl font-bold mb-4">📁 Fichiers</h2>

      <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center text-gray-500 text-sm mb-6 hover:bg-gray-100 cursor-pointer transition">
        Glissez-déposez ici ou cliquez pour ajouter
      </div>

      <ul className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
        {files.length === 0 && (
          <li className="text-sm text-gray-400 italic text-center">
            Aucun fichier.
          </li>
        )}
        {files.map((file) => (
          <li
            key={file.id}
            className="flex justify-between items-center bg-gray-50 rounded-xl shadow p-3 hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={file.selected}
                onChange={() => file.onToggleSelect(file.id)}
                className="cursor-pointer"
              />
              <span className="truncate max-w-[140px] text-sm" title={file.name}>
                {file.name}
              </span>
            </div>
            <span className="text-lg">{statusIcons[file.status]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
