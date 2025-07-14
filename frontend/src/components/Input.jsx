import React from "react";

export default function Input(props) {
  return (
    <input
      style={{
        width: "100%",
        padding: "8px",
        margin: "8px 0 16px 0",
        borderRadius: 4,
        border: "1px solid #ccc",
        fontSize: 14,
      }}
      {...props}
    />
  );
}
