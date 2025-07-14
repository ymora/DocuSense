import React from "react";

export default function Button({ children, ...props }) {
  return (
    <button
      style={{
        backgroundColor: "#007bff",
        border: "none",
        color: "white",
        padding: "10px 15px",
        borderRadius: 4,
        cursor: "pointer",
        fontSize: 16,
      }}
      {...props}
    >
      {children}
    </button>
  );
}
