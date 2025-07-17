import React from "react";

const TopBar = () => {
  return (
    <header className="bg-white shadow px-4 py-2 flex justify-between items-center">
      <div className="text-xl font-bold text-blue-600">📄 DocuSense</div>
      <div className="flex items-center gap-4">
        <select className="border rounded px-2 py-1 text-sm">
          <option value="local">IA Locale</option>
          <option value="openai">IA OpenAI</option>
        </select>
        <div className="relative">
          <button className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300">
            <span className="text-gray-600">👤</span>
          </button>
          {/* Dropdown utilisateur à implémenter ici */}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
