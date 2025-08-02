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