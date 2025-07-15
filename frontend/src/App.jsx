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
  const [mode, setMode] = useState(""); // "ia" or "local"

  useEffect(() => {
    fetchPrompts()
      .then((data) => {
        console.log("📦 Prompts chargés :", data);
        setPrompts(data);
      })
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

    if (mode === "ia" && !selectedPromptId) {
      setError("Veuillez choisir un prompt.");
      return;
    }

    setLoading(true);
    try {
      if (mode === "ia") {
        const res = await sendAnalysis(file, selectedPromptId);

        if (res.confirmation_required) {
          const userConfirmed = window.confirm(res.message);
          if (userConfirmed) {
            await handleSubmitWithOCR();
          } else {
            setError("Analyse annulée par l'utilisateur.");
            setLoading(false);
          }
          return;
        }

        setResult(res.resultat || JSON.stringify(res));
      } else if (mode === "local") {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/analyse-locale", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setResult(data.result || "Pas de texte détecté.");
      }
    } catch (err) {
      setError(err.message || "Erreur lors de l’analyse");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitWithOCR() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const res = await sendAnalysis(file, selectedPromptId, { use_ocr: true });
      setResult(res.resultat || JSON.stringify(res));
    } catch (err) {
      setError(err.message || "Erreur lors de l’analyse OCR");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "auto", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <h1>DocuSense - Analyse Documentaire</h1>

      <div style={{ marginBottom: 16 }}>
        <label>Choisir le mode d'analyse :</label>
        <select
          value={mode}
          onChange={(e) => {
            setMode(e.target.value);
            setSelectedPromptId("");
            setError(null);
            setResult(null);
          }}
          style={{ width: "100%", padding: 8, marginTop: 8 }}
        >
          <option value="">-- Sélectionner le mode --</option>
          <option value="ia">Analyse avec IA</option>
          <option value="local">Analyse locale</option>
        </select>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        {mode === "ia" ? (
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
                  {p.description} ({p.language})
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p style={{ color: "gray", fontStyle: "italic" }}>
            Sélectionnez le mode "Analyse avec IA" pour choisir un prompt.
          </p>
        )}

        <label>
          Choisir un fichier (.docx, .pdf, .eml, etc.) :
          <Input
            type="file"
            accept=".docx,.pdf,.eml,.txt,.xls,.xlsx"
            onChange={(e) => setFile(e.target.files[0])}
          />
        </label>

        <Button type="submit" disabled={loading || !mode}>
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
