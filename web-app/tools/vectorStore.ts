import { OllamaEmbeddings } from "@langchain/ollama";
import { Document } from "langchain/document";
import { SupabaseVectorStore as LangChainSupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { createClient } from "@/middlewares/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text", 
  baseUrl: "http://localhost:11434",
});

export const CHUNKING_CONFIG = {
  chunkSize: 1000,
  chunkOverlap: 200, 
  minChunkSize: 50, 
  batchSize: 10, 
  batchDelay: 500, 
};


export function estimateChunks(content: string): number {
  return Math.ceil(
    content.length / (CHUNKING_CONFIG.chunkSize - CHUNKING_CONFIG.chunkOverlap)
  );
}

interface ProcessedContent {
  filename: string;
  content?: string;
  status: string;
  uploadStatus?: string;
  uploadPath?: string;
}

export async function StoreVectorsInSupabase(
  combinedContent: string,
  notebookId: string
) {
  try {
    const supabase = createClient();
    const parsedContent: ProcessedContent[] = JSON.parse(combinedContent);

    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNKING_CONFIG.chunkSize,
      chunkOverlap: CHUNKING_CONFIG.chunkOverlap,
      separators: ["\n\n", "\n", ".", "!", "?", ",", " ", ""], // Natural break points
    });

    const allDocuments: Document[] = [];

    for (let fileIndex = 0; fileIndex < parsedContent.length; fileIndex++) {
      const item = parsedContent[fileIndex];

      if (!item.content || item.content.trim() === "") {
        console.log(`Skipping empty content for file: ${item.filename}`);
        continue;
      }

      try {
        const chunks = await textSplitter.splitText(item.content);
        console.log(`Split ${item.filename} into ${chunks.length} chunks`);

        chunks.forEach((chunk, chunkIndex) => {
          if (chunk.trim().length > CHUNKING_CONFIG.minChunkSize) {
            const document = new Document({
              pageContent: chunk,
              metadata: {
                notebookId: notebookId,
                filename: item.filename,
                status: item.status,
                uploadStatus: item.uploadStatus,
                uploadPath: item.uploadPath,
                documentIndex: fileIndex,
                chunkIndex: chunkIndex,
                totalChunks: chunks.length,
                chunkSize: chunk.length,
                createdAt: new Date().toISOString(),
              },
            });
            allDocuments.push(document);
          }
        });
      } catch (chunkError) {
        console.error(
          `Error chunking content for ${item.filename}:`,
          chunkError
        );
        const truncatedContent = item.content.substring(0, 1000);
        const document = new Document({
          pageContent: truncatedContent,
          metadata: {
            notebookId: notebookId,
            filename: item.filename,
            status: item.status,
            uploadStatus: item.uploadStatus,
            uploadPath: item.uploadPath,
            documentIndex: fileIndex,
            chunkIndex: 0,
            totalChunks: 1,
            chunkSize: truncatedContent.length,
            truncated: true,
            createdAt: new Date().toISOString(),
          },
        });
        allDocuments.push(document);
      }
    }

    if (allDocuments.length === 0) {
      throw new Error("No valid document chunks to embed");
    }

    console.log(
      `Prepared ${allDocuments.length} document chunks for embedding`
    );

    const batchSize = CHUNKING_CONFIG.batchSize;
    const batches = [];

    for (let i = 0; i < allDocuments.length; i += batchSize) {
      batches.push(allDocuments.slice(i, i + batchSize));
    }

    console.log(`Processing ${batches.length} batches of documents`);

    let totalProcessed = 0;

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(
        `Processing batch ${batchIndex + 1}/${batches.length} with ${
          batch.length
        } documents`
      );

      try {
        await LangChainSupabaseVectorStore.fromDocuments(batch, embeddings, {
          client: supabase as unknown as SupabaseClient,
          tableName: "documents",
          queryName: "match_documents",
        });

        totalProcessed += batch.length;
        console.log(
          `Successfully processed batch ${
            batchIndex + 1
          }. Total: ${totalProcessed}/${allDocuments.length}`
        );

        if (batchIndex < batches.length - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, CHUNKING_CONFIG.batchDelay)
          );
        }
      } catch (batchError) {
        console.error(`Error processing batch ${batchIndex + 1}:`, batchError);
      }
    }

    console.log(
      `Successfully stored ${totalProcessed} document chunks as vectors for notebook ${notebookId}`
    );

    return {
      success: true,
      documentsStored: totalProcessed,
      totalChunks: allDocuments.length,
      notebookId: notebookId,
    };
  } catch (err) {
    console.error("Error in StoreVectorsInSupabase:", err);
    throw new Error(
      `Failed to store vectors in Supabase: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}

export async function SupabaseVectorStore(
  combinedContent: string,
  notebookId?: string
) {
  if (!notebookId) {
    throw new Error("notebookId is required for vector storage");
  }
  return StoreVectorsInSupabase(combinedContent, notebookId);
}

export async function SearchVectorsInNotebook(
  query: string,
  notebookId: string,
  maxResults: number = 10
) {
  try {
    const supabaseClient = createClient();

    const vectorStore = new LangChainSupabaseVectorStore(embeddings, {
      client: supabaseClient as unknown as SupabaseClient,
      tableName: "documents",
      queryName: "match_documents",
    });

    const results = await vectorStore.similaritySearch(query, maxResults, {
      notebookId: notebookId,
    });

    const groupedResults = results.reduce(
      (acc, doc) => {
        const filename = doc.metadata.filename;
        if (!acc[filename]) {
          acc[filename] = [];
        }
        acc[filename].push({
          content: doc.pageContent,
          metadata: doc.metadata,
          chunkIndex: doc.metadata.chunkIndex || 0,
          totalChunks: doc.metadata.totalChunks || 1,
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{
          content: string;
          metadata: Record<string, unknown>;
          chunkIndex: number;
          totalChunks: number;
        }>
      >
    );

    Object.values(groupedResults).forEach((chunks) => {
      chunks.sort((a, b) => a.chunkIndex - b.chunkIndex);
    });

    return {
      success: true,
      results: results.map((doc) => ({
        content: doc.pageContent,
        metadata: doc.metadata,
      })),
      groupedResults: groupedResults,
      totalResults: results.length,
    };
  } catch (err) {
    console.error("Error in SearchVectorsInNotebook:", err);
    throw new Error(
      `Failed to search vectors: ${
        err instanceof Error ? err.message : "Unknown error"
      }`
    );
  }
}
