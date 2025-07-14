import React from "react";

export default function Button({ children, ...props }) {
  return (
    <button
      className="bg-accent text-white py-2 px-4 rounded-xl hover:bg-red-600 transition font-medium"
      {...props}
    >
      {children}
    </button>
  );
}
