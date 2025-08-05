"use server";

import { SYSTEM_PROMPT } from "@/lib/prompts";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import similaritySearch from "@/tools/similaritysearch";

export async function sendChatMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  provider: "groq" | "ollama" = "groq",
  model: string = "deepseek-r1-distill-llama-70b",
  notebookId?: string
) {
  try {
    let llm;
    let contextualMessage = message;

    if (notebookId) {
      try {
        const searchResults = await similaritySearch(message, notebookId, 5);
        if (searchResults.length > 0) {
          const context = searchResults
            .map(
              (result, index) =>
                `Document ${index + 1} (${result.metadata.filename}):\n${
                  result.content
                }`
            )
            .join("\n\n");

          contextualMessage = `Based on the following relevant documents from your notebook:

${context}

User Question: ${message}

Please answer the user's question using the provided context. If the context doesn't contain relevant information, please mention that and provide a general response.`;
        }
      } catch (searchError) {
        console.warn(
          "Similarity search failed, proceeding without context:",
          searchError
        );
      }
    }

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

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT.prompt,
      },
      ...conversationHistory,
      {
        role: "user",
        content: contextualMessage,
      },
    ];

    const response = await llm.invoke(messages);

    const responseContent = response.content;
    let thinkingContent = "";
    let finalResponse = responseContent;

    if (typeof responseContent === "string") {
      const thinkingMatch = responseContent.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkingMatch) {
        thinkingContent = thinkingMatch[1].trim();
        finalResponse = responseContent
          .replace(/<think>[\s\S]*?<\/think>/, "")
          .trim();
      }
    }

    return {
      content: finalResponse,
      thinking: thinkingContent,
    };
  } catch (error) {
    console.error("Error in chat:", error);
    throw error;
  }
}
