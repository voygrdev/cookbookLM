"use server";

import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import similaritySearch from "@/tools/similaritysearch";
import { STARTER_PROMPT_SUMMARY } from "@/lib/prompts";

export async function generateSummary(
  notebookId: string,
  provider: "groq" | "ollama" = "groq",
  model: string = "deepseek-r1-distill-llama-70b"
) {
  try {
    const searchResults = await similaritySearch(
      "document content summary overview",
      notebookId,
      10
    );

    if (searchResults.length === 0) {
      throw new Error("No documents found for this notebook");
    }

    const combinedContent = searchResults
      .map((result) => result.content)
      .join("\n\n");

    const promptWithContent = STARTER_PROMPT_SUMMARY.prompt.replace(
      "{{input}}",
      combinedContent
    );

    let llm;
    if (provider === "groq") {
      llm = new ChatGroq({
        model: model,
        temperature: 0.1,
        maxTokens: undefined,
        maxRetries: 2,
        apiKey: process.env.GROQ_API_KEY,
      });
    } else {
      llm = new ChatOllama({
        model: model,
        baseUrl: "http://localhost:11434",
        temperature: 0.1,
      });
    }

    const response = await llm.invoke([
      {
        role: "user",
        content: promptWithContent,
      },
    ]);

    const responseContent = response.content;
    let finalResponse = responseContent;

    if (typeof responseContent === "string") {
      const thinkingMatch = responseContent.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkingMatch) {
        finalResponse = responseContent
          .replace(/<think>[\s\S]*?<\/think>/, "")
          .trim();
      }
    }

    return {
      summary: finalResponse,
      sourceDocuments: searchResults.map((result) => result.metadata.filename),
    };
  } catch (error) {
    console.error("Error generating summary:", error);
    throw new Error(
      `Failed to generate summary: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
