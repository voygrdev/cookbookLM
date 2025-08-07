export const STARTER_PROMPT_SUMMARY = {
  description: "Summarize the content provided by the user.",
  prompt: `
    Please provide a concise summary of the following content:
    ---
    {{input}}
    ---
    Only summarize the content. Do not add any extra information or interpretation.The summary
    should be clear and only one paragraph no multiple paragraphs. Keep it descriptive and to the point.
  `,
};

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

export const MINDMAP_ROOT_TITLE_PROMPT = {
  description:
    "Generate a concise root title for the mindmap based on all content.",
  prompt: `Analyze the content from {{docCount}} documents and {{noteCount}} notes. Return ONLY a single keyword or 2-word phrase that captures the main theme.

Content: {{content}}

STRICT RULES:
- ONLY return the keyword/phrase
- NO explanations, NO sentences, NO thinking out loud
- NO quotes, NO punctuation
- Maximum 2 words
- Example good responses: "Research", "Data Science", "Marketing"
- Example bad responses: "Based on the content...", "<think>...", "The main theme is..."

Response:`,
};

export const MINDMAP_MAIN_NODE_TITLE_PROMPT = {
  description: "Generate a concise main node title for documents/notes.",
  prompt: `Analyze this document content. Return ONLY a keyword or 2-word phrase that describes the main topic.

Filename: {{filename}}
Content: {{content}}

STRICT RULES:
- ONLY return the keyword/phrase
- NO explanations, NO sentences, NO thinking
- NO quotes, NO punctuation
- Maximum 2 words
- Example good responses: "Machine Learning", "Sales Report", "Budget"
- Example bad responses: "This document is about...", "<think>...", "The main topic is..."

Response:`,
};

export const MINDMAP_SUB_TOPICS_PROMPT = {
  description: "Extract exactly 3 key subtopics from content.",
  prompt: `Extract 3 single keywords from this content. Return ONLY the keywords separated by commas.

Content: {{content}}

STRICT RULES:
- Return EXACTLY 3 single keywords
- Each keyword must be ONE WORD only
- Separate with commas only: keyword1,keyword2,keyword3
- NO explanations, NO sentences, NO thinking
- NO quotes, NO extra text
- Example good response: "algorithms,data,models"
- Example bad response: "The key topics are...", "<think>...", "machine learning, data analysis"

Response:`,
};
