"use server";

import { STARTER_PROMPT_SUMMARY } from "@/lib/prompts";
import { createClient } from "@/middlewares/supabase/server";
import { ChatGroq } from "@langchain/groq";

type ProcessedResult = {
  filename: string;
  content?: string;
  error?: string;
  status: string;
  uploadStatus?: string;
  uploadError?: string;
  uploadPath?: string;
};

export async function processPDF(formData: FormData) {
  try {
    const supabase = await createClient();
    const files = formData.getAll("files") as File[];

    const uploadPromises = files.map(async (file) => {
      try {
        const fileName = `${Date.now()}-${file.name}`;
        const uploadResponse = await supabase.storage
          .from("pdfs")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadResponse.error) {
          console.error("Supabase upload error:", uploadResponse.error);
          return {
            filename: file.name,
            error: `Failed to upload to storage: ${uploadResponse.error.message}`,
            status: "error",
          };
        } else {
          console.log("Supabase upload response:", uploadResponse.data);
          return {
            filename: file.name,
            uploadPath: uploadResponse.data.path,
            status: "uploaded",
          };
        }
      } catch (error) {
        console.error("Error uploading to Supabase:", error);
        return {
          filename: file.name,
          error: "Failed to upload to storage",
          status: "error",
        };
      }
    });

    const uploadResults = await Promise.all(uploadPromises);

    const response = await fetch("http://localhost:5001/parse-pdfs", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const results: ProcessedResult[] = await response.json();

    const llm = new ChatGroq({
      model: "deepseek-r1-distill-llama-70b",
      temperature: 0.1,
      maxTokens: undefined,
      maxRetries: 2,
      apiKey: process.env.GROQ_API_KEY,
    });

    const combinedContent = results.map((result) => {
      const uploadResult = uploadResults.find(
        (upload) => upload.filename === result.filename
      );
      return {
        filename: result.filename,
        content: result.content,
        status: result.status,
        uploadStatus: uploadResult?.status,
        uploadPath: uploadResult?.uploadPath,
      };
    });

    const llmResponse = await llm.invoke([
      {
        role: "system",
        content: STARTER_PROMPT_SUMMARY.prompt,
      },
      {
        role: "user",
        content: JSON.stringify(combinedContent),
      },
    ]);

    console.log("Final summary from LLM:", llmResponse.content);

    return llmResponse.content;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
