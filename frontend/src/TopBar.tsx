import React from "react";

interface TopBarProps {
  backendStatus?: 'ok' | 'ko' | 'pending';
}

const TopBar = ({ backendStatus = 'pending' }: TopBarProps) => {
  // Définir la couleur du voyant selon le statut
  let statusColor = 'bg-yellow-400 border-yellow-600';
  let statusTitle = 'Vérification de la connexion...';
  if (backendStatus === 'ok') {
    statusColor = 'bg-green-500 border-green-700';
    statusTitle = 'Backend connecté';
  } else if (backendStatus === 'ko') {
    statusColor = 'bg-red-600 border-red-800';
    statusTitle = 'Backend non joignable';
  }

  return (
    <header className="bg-white shadow px-4 py-2 flex justify-between items-center border-b border-gray-200">
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold text-blue-600">📄 DocuSense</span>
        <span
          className={`inline-block w-4 h-4 rounded-full border-2 ${statusColor}`}
          title={statusTitle}
        />
      </div>
      <div className="flex items-center gap-4">
        <select className="border rounded px-2 py-1 text-sm">
          <option value="local">IA Locale</option>
          <option value="openai">IA OpenAI</option>
        </select>
        <div className="relative">
          <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300">
            <span className="text-gray-600">👤</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar; 