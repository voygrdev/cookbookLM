export const STARTER_PROMPT_SUMMARY = {
  description: "Summarize the content provided by the user.",
  prompt: `
    Please provide a concise summary of the following content:
    ---
    {{input}}
    ---
    Only summarize the content. Do not add any extra information or interpretation.The summary
    should be clear and only one paragraph no multiple paragraphs. Keep it descriptive and to the point.
  `,}

export const SYSTEM_PROMPT = {
  description: "System prompt for the assistant.",
  prompt: `You are a helpful assistant that can answer questions about the PDF documents that were uploaded and summarized. Use the context from the previous conversation to provide accurate and helpful responses.`,
};

export const SYSTEM_SIMILARITY_SEARCH_PROMPT = {
  description: "System prompt for similarity search context.",
  prompt: `Based on the following relevant documents from your notebook:
  ---
  {{context}}
  ---
  User Question: {{input}}
  ---
  Please answer the user's question using the provided context. If the context doesn't contain relevant information, please mention that and provide a general response.`,
};