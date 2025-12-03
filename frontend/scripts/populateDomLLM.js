window.OLLAMA_BASE_URL = "http://localhost:11434";

async function fetchActiveOllamaModel() {
  const res = await fetch(`${window.OLLAMA_BASE_URL}/api/tags`);
  if (!res.ok) {
    throw new Error(`Ollama /api/tags HTTP ${res.status}`);
  }

  const data = await res.json();
  if (!data.models || !Array.isArray(data.models) || data.models.length === 0) {
    throw new Error("No models found in /api/tags");
  }

  const sorted = [...data.models].sort((a, b) => {
    return new Date(b.modified_at) - new Date(a.modified_at);
  });

  const modelName = sorted[0].model || sorted[0].name;
  window.currentLLMModel = modelName;
  return modelName;
}

document.addEventListener("DOMContentLoaded", async () => {
  const headerParagraphs = document.querySelectorAll(".llmHeader p");

  headerParagraphs.forEach(p => p.textContent = "Detecting local LLM...");

  try {
    const modelName = await fetchActiveOllamaModel();
    headerParagraphs.forEach(p => {
      p.textContent = `Connected to: ${modelName}`;
    });
  } catch (err) {
    console.error(err);
    headerParagraphs.forEach(p => {
      p.textContent = "Local LLM not detected";
    });
  }
});
