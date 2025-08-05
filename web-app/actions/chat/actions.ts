"use server";

import { SYSTEM_PROMPT } from "@/lib/prompts";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";

export async function sendChatMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>,
  provider: "groq" | "ollama" = "groq",
  model: string = "deepseek-r1-distill-llama-70b"
) {
  try {
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

    const messages = [
      {
        role: "system",
        content: SYSTEM_PROMPT.prompt,
      },
      ...conversationHistory,
      {
        role: "user",
        content: message,
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
