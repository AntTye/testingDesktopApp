const OLLAMA_GENERATE_URL = () =>
  `${window.OLLAMA_BASE_URL}/api/generate`;

async function getActiveModel() {
  if (window.currentLLMModel) return window.currentLLMModel;

  const res = await fetch(`${window.OLLAMA_BASE_URL}/api/tags`);
  const data = await res.json();

  const sorted = [...data.models].sort((a, b) => {
    return new Date(b.modified_at) - new Date(a.modified_at);
  });

  const modelName = sorted[0].model || sorted[0].name;
  window.currentLLMModel = modelName;
  return modelName;
}

document.addEventListener("DOMContentLoaded", () => {
  const queryButtons = document.querySelectorAll(".queryButton");
  const userInput = document.getElementById("userInputField");
  const llmResponse = document.getElementById("llmResponse");
  const userNoteContext = document.getElementById("userNotes");

  const headerParagraphs = document.querySelectorAll(".llmHeader p");

  async function sendQuery() {
    const userPrompt = userInput.value.trim();
    if (!userPrompt) {
      llmResponse.value = "You must enter a user promt."
      return
    };

    let noteContext = "None.";
    if (userNoteContext) {
        noteContext = (userNoteContext.value).trim();
    }

    let llmPreviousResponse = "None.";
    if(llmResponse){
      llmPreviousResponse = (llmResponse.value).trim();
    }

    const finalPrompt = noteContext
        ? `Start:\n\nContext:\n${noteContext}\n\nYour Previous Response:\n${llmPreviousResponse}\n\nUser Question:\n${userPrompt}\n\nEnd.`
        : userPrompt;

    queryButtons.forEach(btn => btn.disabled = true);

    const previousHeaders = [];
    headerParagraphs.forEach(p => {
      previousHeaders.push(p.textContent);
      p.textContent = "Thinking...";
    });

    try {
      const model = await getActiveModel();

      const res = await fetch(OLLAMA_GENERATE_URL(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            model,
            prompt: finalPrompt,
            stream: false,
        }),
        });

      const data = await res.json();
      llmResponse.value = data.response || "";
    } catch (err) {
      llmResponse.value = "LLM Error: " + err.message;
      console.error(err);
    } finally {
      headerParagraphs.forEach((p, i) => {
        p.textContent = previousHeaders[i];
      });
      queryButtons.forEach(btn => btn.disabled = false);
    }
  }

  queryButtons.forEach(btn => {
    btn.addEventListener("click", sendQuery);
  });
});
