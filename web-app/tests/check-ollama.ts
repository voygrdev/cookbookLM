import { OllamaEmbeddings } from "@langchain/ollama";

const OLLAMA_BASE_URL = "http://localhost:11434";
const EMBEDDING_MODEL = "nomic-embed-text";

async function checkOllamaHealth() {
  console.log("Checking Ollama health\n");

  try {
    console.log("Checking if Ollama server is running...");
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const models = data.models || [];

    console.log("Ollama server is running");
    console.log(`Found ${models.length} models installed`);

    console.log("Checking if embedding model is available...");
    const hasEmbeddingModel = models.some((model: { name: string }) =>
      model.name.includes(EMBEDDING_MODEL)
    );

    if (hasEmbeddingModel) {
      console.log(`${EMBEDDING_MODEL} model is installed`);
    } else {
      console.log(`${EMBEDDING_MODEL} model is NOT installed`);
      console.log(`Install it with: ollama pull ${EMBEDDING_MODEL}`);
      return false;
    }

    console.log("Testing embedding generation...");
    const embeddings = new OllamaEmbeddings({
      model: EMBEDDING_MODEL,
      baseUrl: OLLAMA_BASE_URL,
    });

    const testText = "This is a test sentence for embedding generation.";
    const startTime = Date.now();

    const embedding = await embeddings.embedQuery(testText);
    const endTime = Date.now();

    console.log(`Successfully generated embedding`);
    console.log(`Embedding dimensions: ${embedding.length}`);
    console.log(`Generation time: ${endTime - startTime}ms`);

    if (embedding.length !== 768) {
      console.log(`Expected 768 dimensions but got ${embedding.length}`);
    }

    console.log("All checks passed. Ollama is ready for vector storage.");
    return true;
  } catch (error) {
    console.error("Health check failed:");

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ECONNREFUSED"
    ) {
      console.error("Cannot connect to Ollama server");
      console.error("Make sure Ollama is running: ollama serve");
    } else if (
      error &&
      typeof error === "object" &&
      "message" in error &&
      typeof error.message === "string" &&
      error.message.includes("404")
    ) {
      console.error("Ollama API endpoint not found");
      console.error("Check if Ollama is properly installed");
    } else {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(errorMessage);
    }

    console.error("Troubleshooting steps:");
    console.error(
      "1. Install Ollama: curl -fsSL https://ollama.ai/install.sh | sh"
    );
    console.error("2. Start Ollama: ollama serve");
    console.error(`3. Pull embedding model: ollama pull ${EMBEDDING_MODEL}`);
    console.error("4. Verify installation: ollama list");

    return false;
  }
}

checkOllamaHealth().then((success) => {
  process.exit(success ? 0 : 1);
});
