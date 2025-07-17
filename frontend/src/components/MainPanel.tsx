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
      className="p-4 w-1/4 bg-gray-50 border-r border-gray-200 overflow-y-auto"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <h2 className="font-semibold mb-2">📁 Fichiers</h2>
      <div className="border-2 border-dashed border-gray-300 rounded-md p-4 text-center text-sm text-gray-500 mb-4">
        Glissez-déposez ou cliquez ici
      </div>

      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between bg-white shadow-sm p-2 rounded hover:bg-gray-100 transition"
          >
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={file.selected}
                onChange={() => file.onToggleSelect(file.id)}
              />
              <span className="truncate max-w-[140px]" title={file.name}>
                {file.name}
              </span>
            </div>
            <span>{statusIcons[file.status]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
