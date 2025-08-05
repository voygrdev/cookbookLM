"use server";

export async function getOllamaModels() {
  try {
    const response = await fetch("http://localhost:11434/api/tags", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error("Failed to fetch Ollama models");
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    console.error("Error fetching Ollama models:", error);
    return [];
  }
}
