"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { processPDF } from "../actions/processpdf/actions";
import { sendChatMessage } from "../actions/chat/actions";
import { createClient } from "@/middlewares/supabase/client";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
};

interface ChatWindowProps {
  notebookId: string;
}

export default function ChatWindow({ notebookId }: ChatWindowProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<
    Array<{ name: string; url: string }>
  >([]);
  const [, setPdfSummary] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [typingMessage, setTypingMessage] = useState<string>("");
  const [isTyping, setIsTyping] = useState(false);
  const [thinkingContent, setThinkingContent] = useState<string>("");
  const [isThinking, setIsThinking] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    const filteredData = data.filter(
      (file) => file.name !== ".emptyFolderPlaceholder"
    );
    console.log("Files found in storage:", filteredData);

    const filesWithUrls = await Promise.all(
      filteredData.map(async (file) => {
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

      if (pdfFiles.length > 0) {
        setIsLoading(true);
        try {
          const formData = new FormData();
          pdfFiles.forEach((file) => {
            formData.append("files", file);
          });

          const summary = await processPDF(formData, notebookId);
          const summaryString =
            typeof summary === "string" ? summary : JSON.stringify(summary);
          setPdfSummary(summaryString);

          const summaryMessage: Message = {
            id: Date.now().toString(),
            content: `PDF Summary:\n\n${summaryString}`,
            role: "assistant",
            timestamp: new Date(),
          };
          setMessages([summaryMessage]);

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

  const typeMessage = (text: string, callback: () => void) => {
    setIsTyping(true);
    setTypingMessage("");

    let index = 0;
    const typingSpeed = 10;

    const typeNextChar = () => {
      if (index < text.length) {
        setTypingMessage(text.slice(0, index + 1));
        index++;
        setTimeout(typeNextChar, typingSpeed);
      } else {
        setIsTyping(false);
        setTypingMessage("");
        callback();
      }
    };

    typeNextChar();
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isChatLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputMessage,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsChatLoading(true);

    try {
      const conversationHistory = messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      const response = await sendChatMessage(inputMessage, conversationHistory);

      const responseContent =
        typeof response === "object" && response.content
          ? String(response.content)
          : typeof response === "string"
          ? response
          : JSON.stringify(response);

      const thinking =
        typeof response === "object" && response.thinking
          ? String(response.thinking)
          : "";

      if (thinking) {
        setThinkingContent(thinking);
        setIsThinking(true);
      }

      typeMessage(responseContent, () => {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: responseContent,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsThinking(false);
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
      setTypingMessage("");
      setIsThinking(false);
      setThinkingContent("");
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, there was an error processing your message.",
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
  });

  return (
    <div className="flex flex-row w-screen m-0 overflow-hidden">
      <div className="flex flex-col bg-neutral-900 w-[25%] m-5 rounded-lg p-2 relative">
        <div className="mt-2">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${
                isDragActive
                  ? "border-blue-500 bg-blue-50/5"
                  : "border-gray-600 hover:border-gray-500"
              } ${isLoading ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} disabled={isLoading} />
            {isLoading ? (
              <p className="text-gray-300">Processing PDFs...</p>
            ) : isDragActive ? (
              <p className="text-gray-300">Drop PDF files here...</p>
            ) : (
              <p className="text-gray-400">
                Drag & drop PDF files here, or click to select files
              </p>
            )}
          </div>

          <div className="mt-4 space-y-6">
            {uploadedFiles.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-300 mb-2">
                  Uploaded Files:
                </h3>
                <ul className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <li key={index} className="text-sm text-gray-400">
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
      <div className="flex flex-col bg-neutral-900 w-[50%] m-5 rounded-lg p-2 relative">
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Upload PDF files to start chatting about them
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-100"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          {isThinking && thinkingContent && (
            <div className="flex justify-start">
              <div className="bg-amber-900/30 border border-amber-700/50 text-amber-200 p-3 rounded-lg max-w-[80%]">
                <button
                  onClick={() => setShowThinking(!showThinking)}
                  className="flex items-center space-x-2 text-amber-300 hover:text-amber-100 transition-colors w-full text-left"
                >
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-amber-300"></div>
                    <span className="text-sm font-medium">Thinking...</span>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showThinking ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showThinking && (
                  <div className="mt-2 pt-2 border-t border-amber-700/30 text-sm opacity-80">
                    <div className="whitespace-pre-wrap">{thinkingContent}</div>
                  </div>
                )}
              </div>
            </div>
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-700 text-gray-100 p-3 rounded-lg max-w-[80%]">
                <div className="whitespace-pre-wrap">{typingMessage}</div>
                <div className="inline-block w-2 h-5 bg-gray-100 animate-pulse ml-1"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-gray-700 p-4">
          <div className="flex space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask a question about your PDFs..."
              className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
              disabled={isChatLoading || messages.length === 0}
            />
            <button
              onClick={handleSendMessage}
              disabled={
                !inputMessage.trim() || isChatLoading || messages.length === 0
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-6 py-2 rounded-lg transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-neutral-900 w-[25%] m-5 rounded-lg p-2 relative">
        {/* Additional Content Area */}
      </div>
    </div>
  );
}
