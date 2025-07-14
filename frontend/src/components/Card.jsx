import React from "react";

export default function Card({ children, style }) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
        backgroundColor: "#fff",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
