import React, { useState, useEffect } from "react";
import Card from "@/components/Card";
import Button from "@/components/Button";
import Input from "@/components/Input";
import { fetchPrompts, sendAnalysis } from "./api";

export default function App() {
  const [prompts, setPrompts] = useState([]);
  const [selectedPromptId, setSelectedPromptId] = useState("");
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPrompts()
      .then(setPrompts)
      .catch(() => setError("Impossible de charger les prompts"));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    if (!selectedPromptId) {
      setError("Veuillez choisir un prompt.");
      return;
    }

    setLoading(true);
    try {
      const res = await sendAnalysis(file, selectedPromptId);
      setResult(res.resultat || JSON.stringify(res));
    } catch (err) {
      setError(err.message || "Erreur lors de l’analyse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>DocuSense - Analyse Documentaire</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <label>
          Choisir un prompt :
          <select
            value={selectedPromptId}
            onChange={(e) => setSelectedPromptId(e.target.value)}
            style={{ width: "100%", margin: "8px 0", padding: "8px" }}
          >
            <option value="">-- Sélectionner --</option>
            {prompts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title} ({p.language}) - {p.category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Choisir un fichier (.docx, .pdf, .eml, etc.) :
          <Input
            type="file"
            accept=".docx,.pdf,.eml,.txt"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <Button type="submit" disabled={loading}>
          {loading ? "Analyse en cours..." : "Analyser"}
        </Button>
      </form>

      {result && (
        <Card style={{ marginTop: 20 }}>
          <h2>Résultat de l'analyse :</h2>
          <pre style={{ whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{result}</pre>
        </Card>
      )}
    </div>
  );
}
