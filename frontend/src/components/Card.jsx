import React from "react";

export default function Card({ children }) {
  return (
    <div className="bg-white shadow-soft rounded-2xl p-6 mt-4 border border-gray-100">
      {children}
    </div>
  );
}
