"use server";

import { ChatGroq } from "@langchain/groq";

export async function sendChatMessage(
  message: string,
  conversationHistory: Array<{ role: string; content: string }>
) {
  try {
    const llm = new ChatGroq({
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.1,
      maxTokens: undefined,
      maxRetries: 2,
      apiKey: process.env.GROQ_API_KEY,
    });

    const messages = [
      {
        role: "system",
        content:
          "You are a helpful assistant that can answer questions about the PDF documents that were uploaded and summarized. Use the context from the previous conversation to provide accurate and helpful responses.",
      },
      ...conversationHistory,
      {
        role: "user",
        content: message,
      },
    ];

    const response = await llm.invoke(messages);

    // Extract thinking content if it exists (for DeepSeek models)
    const responseContent = response.content;
    let thinkingContent = "";
    let finalResponse = responseContent;

    if (typeof responseContent === "string") {
      // Look for thinking tags in the response
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
