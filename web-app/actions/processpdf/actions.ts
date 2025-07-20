"use server";

import { createClient } from "@/middlewares/supabase/server";

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
            status: "error"
          };
        } else {
          console.log("Supabase upload response:", uploadResponse.data);
          return {
            filename: file.name,
            uploadPath: uploadResponse.data.path,
            status: "uploaded"
          };
        }
      } catch (error) {
        console.error("Error uploading to Supabase:", error);
        return {
          filename: file.name,
          error: "Failed to upload to storage",
          status: "error"
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
    
    const combinedResults = results.map((result) => {
      const uploadResult = uploadResults.find(
        (upload) => upload.filename === result.filename
      );
      
      return {
        ...result,
        uploadStatus: uploadResult?.status || "not_uploaded",
        uploadError: uploadResult?.error,
        uploadPath: uploadResult?.uploadPath
      };
    });

    return combinedResults;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}
