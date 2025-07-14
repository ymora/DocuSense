import React from "react";

export default function Input(props) {
  return (
    <input
      className="block w-full px-3 py-2 border border-gray-300 rounded-xl text-sm text-gray-800 bg-white"
      {...props}
    />
  );
}