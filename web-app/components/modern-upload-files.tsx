"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Upload,
  FileText,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Eye,
  MoreHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import { processPDF } from "../actions/processpdf/actions";
import { createClient } from "@/middlewares/supabase/client";

interface UploadFilesProps {
  notebookId?: string;
  onSummaryGenerated?: (summary: string, filename: string) => void;
}

interface ProcessingFile {
  file: File;
  status: "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  result?: {
    filename: string;
    content?: string;
    uploadPath?: string;
  };
}

interface UploadedFile {
  name: string;
  url: string;
  size: number;
  uploadedAt: Date;
}

export default function UploadFiles({
  notebookId,
  onSummaryGenerated,
}: UploadFilesProps) {
  const [processingFiles, setProcessingFiles] = useState<ProcessingFile[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUploadedFiles = useCallback(async () => {
    const supabase = createClient();
    try {
      const { data, error } = await supabase.storage.from("pdfs").list();

      if (error) {
        console.error("Error fetching files:", error);
        return;
      }

      if (data) {
        const filteredFiles = data.filter(
          (file) =>
            !file.name.startsWith(".") &&
            file.name !== ".emptyFolderPlaceholder" &&
            file.name.toLowerCase().endsWith(".pdf")
        );

        const filesWithUrls = await Promise.all(
          filteredFiles.map(async (file) => {
            const {
              data: { publicUrl },
            } = supabase.storage.from("pdfs").getPublicUrl(file.name);
            return {
              name: file.name,
              url: publicUrl,
              size: file.metadata?.size || 0,
              uploadedAt: new Date(file.created_at || Date.now()),
            };
          })
        );
        setUploadedFiles(filesWithUrls);
      }
    } catch (error) {
      console.error("Error fetching uploaded files:", error);
      toast.error("Error loading files", {
        description: "Failed to load uploaded files. Please refresh the page.",
      });
    }
  }, []);

  useEffect(() => {
    fetchUploadedFiles();
  }, [fetchUploadedFiles]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const newProcessingFiles = acceptedFiles.map((file) => ({
        file,
        status: "uploading" as const,
        progress: 0,
      }));

      setProcessingFiles((prev) => [...prev, ...newProcessingFiles]);
      setIsLoading(true);

      for (let i = 0; i < newProcessingFiles.length; i++) {
        const processingFile = newProcessingFiles[i];

        try {
          setProcessingFiles((prev) =>
            prev.map((f) =>
              f.file === processingFile.file
                ? { ...f, status: "processing", progress: 50 }
                : f
            )
          );

          const formData = new FormData();
          formData.append("files", processingFile.file);

          const result = await processPDF(formData, notebookId || "");

          if (result && typeof result === "string") {
            setProcessingFiles((prev) =>
              prev.map((f) =>
                f.file === processingFile.file
                  ? {
                      ...f,
                      status: "completed",
                      progress: 100,
                      result: {
                        filename: processingFile.file.name,
                        content: result,
                      },
                    }
                  : f
              )
            );

            toast.success("File processed successfully", {
              description: `${processingFile.file.name} has been processed and uploaded.`,
            });

            if (onSummaryGenerated) {
              onSummaryGenerated(result, processingFile.file.name);
            }
          } else {
            throw new Error("No content returned from processing");
          }
        } catch (error) {
          setProcessingFiles((prev) =>
            prev.map((f) =>
              f.file === processingFile.file
                ? {
                    ...f,
                    status: "error",
                    progress: 0,
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : f
            )
          );

        }
      }

      setIsLoading(false);
      fetchUploadedFiles();
    },
    [notebookId, fetchUploadedFiles, onSummaryGenerated]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 5,
    maxSize: 50 * 1024 * 1024,
  });

  const removeProcessingFile = (fileToRemove: File) => {
    setProcessingFiles((prev) => prev.filter((f) => f.file !== fileToRemove));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: ProcessingFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return "bg-blue-500";
      case "completed":
        return "bg-green-500";
      case "error":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed border-slate-600/50 bg-slate-950/70 backdrop-blur-sm transition-colors hover:border-blue-500/50">
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              flex flex-col items-center justify-center space-y-4 p-8 rounded-lg transition-colors cursor-pointer
              ${
                isDragActive
                  ? "bg-blue-500/10 border-blue-500"
                  : "hover:bg-slate-800/50"
              }
            `}
          >
            <input {...getInputProps()} />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/20">
              <Upload className="h-8 w-8 text-blue-400" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold text-white">
                {isDragActive ? "Drop files here" : "Upload PDF files"}
              </h3>
              <p className="text-sm text-slate-300">
                Drag and drop your PDF files here, or click to browse
              </p>
              <p className="text-xs text-slate-400">
                Maximum 5 files, 50MB each
              </p>
            </div>
            <Button
              variant="outline"
              disabled={isLoading}
              className="bg-transparent border-slate-600/50 text-slate-200 hover:bg-slate-800/50 hover:text-white hover:border-slate-500/70"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Files
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Processing Files - Hidden as requested */}
      {false && processingFiles.length > 0 && (
        <Card className="bg-slate-950/70 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-white">
              <FileText className="mr-2 h-5 w-5 text-blue-400" />
              Processing Files
            </CardTitle>
            <CardDescription className="text-slate-300">
              Files being processed and uploaded
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {processingFiles.map((processingFile, index) => (
              <div
                key={index}
                className="flex items-center space-x-4 p-4 border border-slate-700/50 bg-slate-900/50 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {getStatusIcon(processingFile.status)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate text-slate-200">
                      {processingFile.file.name}
                    </p>
                    <Badge
                      variant="outline"
                      className="text-xs border-slate-600 text-slate-300"
                    >
                      {formatFileSize(processingFile.file.size)}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span className="capitalize">
                        {processingFile.status}
                      </span>
                      <span>{processingFile.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getStatusColor(
                          processingFile.status
                        )}`}
                        style={{ width: `${processingFile.progress}%` }}
                      />
                    </div>
                  </div>

                  {processingFile.error && (
                    <p className="text-xs text-red-400 mt-2">
                      Error: {processingFile.error}
                    </p>
                  )}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProcessingFile(processingFile.file)}
                  className="flex-shrink-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card className="bg-slate-950/70 border-slate-700/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-white">
              <FileText className="mr-2 h-5 w-5 text-blue-400" />
              Uploaded Files
            </CardTitle>
            <CardDescription className="text-slate-300">
              Successfully uploaded and processed files
            </CardDescription>
          </CardHeader>
          <CardContent className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border border-slate-700/50 bg-slate-900/50 rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 flex-shrink-0">
                      <FileText className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate text-slate-200">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(file.size)} • Uploaded{" "}
                        {file.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-32 bg-slate-800 border-slate-600"
                    >
                      <DropdownMenuItem
                        asChild
                        className="text-slate-200 hover:bg-slate-700/50 hover:text-white focus:bg-slate-700/50 focus:text-white"
                      >
                        <a
                          href={file.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cursor-pointer"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </a>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        asChild
                        className="text-slate-200 hover:bg-slate-700/50 hover:text-white focus:bg-slate-700/50 focus:text-white"
                      >
                        <a
                          href={file.url}
                          download={file.name}
                          className="cursor-pointer"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </a>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
