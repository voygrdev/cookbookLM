"use client";
import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { processPDF } from "../actions/processpdf/actions";
import { createClient } from "@/middlewares/supabase/client";

interface UploadCardProps {
  notebookId?: string;
}

export default function UploadCard({ notebookId }: UploadCardProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<
    Array<{
      filename: string;
      content?: string;
      error?: string;
      status: string;
      uploadStatus?: string;
      uploadError?: string;
      uploadPath?: string;
    }>
  >([]);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string }>
  >([]);

  const fetchUploadedFiles = useCallback(async () => {
    const supabase = createClient();
    console.log("Fetching uploaded files...");
    const { data, error } = await supabase.storage.from("pdfs").list();

    if (error) {
      console.error("Error fetching files:", error);
      return;
    }

    if (!data) {
      console.log("No files found in storage");
      setUploadedFiles([]);
      return;
    }

    console.log("Files found in storage:", data);
    const filesWithUrls = await Promise.all(
      data.map(async (file) => {
        const {
          data: { publicUrl },
        } = supabase.storage.from("pdfs").getPublicUrl(file.name);
        return {
          name: file.name,
          url: publicUrl,
        };
      })
    );

    console.log("Files with URLs:", filesWithUrls);
    setUploadedFiles(filesWithUrls);
  }, []);

  useEffect(() => {
    fetchUploadedFiles();
  }, [fetchUploadedFiles]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const pdfFiles = acceptedFiles.filter(
        (file) => file.type === "application/pdf"
      );
      setFiles((prevFiles) => [...prevFiles, ...pdfFiles]);

      if (pdfFiles.length > 0) {
        setIsLoading(true);
        try {
          const formData = new FormData();
          pdfFiles.forEach((file) => {
            formData.append("files", file);
          });

          const processedResults = notebookId
            ? await processPDF(formData, notebookId)
            : "No notebook ID provided - vectors will not be stored";

          if (typeof processedResults !== "string") {
            setResults(
              processedResults as Array<{
                filename: string;
                content?: string;
                error?: string;
                status: string;
                uploadStatus?: string;
                uploadError?: string;
                uploadPath?: string;
              }>
            );
          } else {
            console.warn(processedResults);
          }

          setTimeout(async () => {
            console.log("Refreshing uploaded files list...");
            await fetchUploadedFiles();
          }, 1000);
        } catch (error) {
          console.error("Error processing PDFs:", error);
        } finally {
          setIsLoading(false);
        }
      }
    },
    [fetchUploadedFiles, notebookId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div className="flex flex-col bg-slate-950/70 w-[25%] m-5 rounded-lg p-2 relative backdrop-blur-sm border border-slate-700/50">
      <div className="mt-2">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-900/20"
                  : "border-slate-600/50 hover:border-slate-500/70"
              } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
        >
          <input {...getInputProps()} disabled={isLoading} />
          {isLoading ? (
            <p className="text-slate-300">Processing PDFs...</p>
          ) : isDragActive ? (
            <p className="text-slate-300">Drop PDF files here...</p>
          ) : (
            <p className="text-slate-400">
              Drag & drop PDF files here, or click to select files
            </p>
          )}
        </div>

        <div className="mt-4 space-y-6">
          {(files.length > 0 || results.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-slate-200 mb-2">
                Processing Results:
              </h3>
              <ul className="space-y-2">
                {results.map((result, index) => (
                  <li
                    key={index}
                    className={`text-sm ${
                      result.status === "success" &&
                      result.uploadStatus === "uploaded"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {result.filename} - Processing: {result.status}, Upload:{" "}
                    {result.uploadStatus || "pending"}
                    {result.error && (
                      <p className="text-red-400 text-xs mt-1">
                        Processing Error: {result.error}
                      </p>
                    )}
                    {result.uploadError && (
                      <p className="text-red-400 text-xs mt-1">
                        Upload Error: {result.uploadError}
                      </p>
                    )}
                    {result.content && (
                      <div className="mt-2 text-slate-400 text-xs max-h-20 overflow-y-auto">
                        {result.content.substring(0, 200)}...
                      </div>
                    )}
                  </li>
                ))}
                {isLoading &&
                  files.map((file, index) => (
                    <li
                      key={`loading-${index}`}
                      className="text-sm text-slate-400"
                    >
                      {file.name} - Processing...
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {uploadedFiles.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-200 mb-2">
                Uploaded Files:
              </h3>
              <ul className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <li key={index} className="text-sm text-slate-300">
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-blue-400 transition-colors"
                    >
                      {file.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
