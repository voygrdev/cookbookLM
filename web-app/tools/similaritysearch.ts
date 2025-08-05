import { OllamaEmbeddings } from "@langchain/ollama";
import { createClient } from "@/middlewares/supabase/client";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

interface DocumentMetadata {
  notebookId: string;
  filename: string;
  status: string;
  uploadStatus?: string;
  uploadPath?: string;
  documentIndex: number;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  createdAt: string;
  truncated?: boolean;
}

interface SimilaritySearchResult {
  id: bigint;
  content: string;
  metadata: DocumentMetadata;
  similarity: number;
}

export default async function similaritySearch(
  query: string,
  notebookId: string,
  matchCount: number = 10
): Promise<SimilaritySearchResult[]> {
  try {
    const supabase = createClient();

    const queryEmbedding = await embeddings.embedQuery(query);

    const filter = { notebookId: notebookId };

    const { data, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      filter: filter,
    });

    if (error) {
      console.error("Error performing similarity search:", error);
      throw new Error(`Similarity search failed: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error("Error in similarity search:", error);
    throw error;
  }
}
