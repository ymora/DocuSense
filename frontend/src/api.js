export async function fetchPrompts() { 
  const response = await fetch("/api/prompts");
  if (!response.ok) throw new Error("Erreur lors du chargement des prompts");
  return response.json();
}

export async function sendAnalysis(file, promptId, options = {}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("prompt_id", promptId);

  if (options.use_ocr) {
    formData.append("use_ocr", "true");
  }

  const response = await fetch("/api/analyse", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Erreur serveur");
  }

  return response.json();
}
