"use client";

import {
  useState,
  useCallback,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  FileText,
} from "lucide-react";
import { sendChatMessage } from "../actions/chat/actions";
import { generateSummary } from "../actions/summary/actions";
import { getOllamaModels } from "../actions/models/actions";
import { createClient } from "@/middlewares/supabase/client";
import { toast } from "sonner";

type Message = {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  thinking?: string;
};

interface ModernChatProps {
  notebookId: string;
}

export interface ModernChatRef {
  addSummaryMessage: (summary: string, filename: string) => void;
}

const ModernChat = forwardRef<ModernChatRef, ModernChatProps>(
  ({ notebookId }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState("");
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [isSummaryLoading, setIsSummaryLoading] = useState(false);
    const [typingMessage, setTypingMessage] = useState<string>("");
    const [isTyping, setIsTyping] = useState(false);
    const [showThinking, setShowThinking] = useState<Record<string, boolean>>(
      {}
    );
    const [provider, setProvider] = useState<"groq" | "ollama">("groq");
    const [model, setModel] = useState<string>("deepseek-r1-distill-llama-70b");
    const [ollamaModels, setOllamaModels] = useState<Array<{ name: string }>>(
      []
    );
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [uploadedFiles, setUploadedFiles] = useState<
      Array<{ name: string; url: string }>
    >([]);

    useImperativeHandle(ref, () => ({
      addSummaryMessage: (summary: string, filename: string) => {
        const summaryMessage: Message = {
          id: Date.now().toString(),
          content: `## PDF Summary for ${filename}\n\n${summary}`,
          role: "assistant",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, summaryMessage]);
        toast.success(`Summary generated for ${filename}`);
      },
    }));

    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
      scrollToBottom();
    }, [messages, isTyping, typingMessage]);

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
              };
            })
          );
          setUploadedFiles(filesWithUrls);
        }
      } catch (error) {
        console.error("Error fetching uploaded files:", error);
      }
    }, []);

    const fetchOllamaModels = useCallback(async () => {
      try {
        const models = await getOllamaModels();
        setOllamaModels(models);
        if (models.length > 0 && provider === "ollama") {
          setModel(models[0].name);
        }
      } catch (error) {
        console.error("Error fetching Ollama models:", error);
        toast.error("Failed to fetch Ollama models");
      }
    }, [provider]);

    useEffect(() => {
      fetchUploadedFiles();
      if (provider === "ollama") {
        fetchOllamaModels();
      }
    }, [fetchUploadedFiles, provider, fetchOllamaModels]);

    const typeMessage = (
      text: string,
      messageId: string,
      callback: () => void
    ) => {
      setIsTyping(true);
      setTypingMessage("");

      let index = 0;
      const typingSpeed = 20;

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

      if (uploadedFiles.length === 0) {
        toast.error("No documents uploaded", {
          description:
            "Please upload PDF documents first before starting a conversation.",
        });
        return;
      }

      if (model === "no-models-found") {
        toast.error("No valid model selected", {
          description: "Please select a valid model or install Ollama models.",
        });
        return;
      }

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

        const response = await sendChatMessage(
          inputMessage,
          conversationHistory,
          provider,
          model
        );

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

        const messageId = (Date.now() + 1).toString();

        typeMessage(responseContent, messageId, () => {
          const assistantMessage: Message = {
            id: messageId,
            content: responseContent,
            role: "assistant",
            timestamp: new Date(),
            thinking: thinking || undefined,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        });
      } catch (error) {
        console.error("Error sending message:", error);
        setIsTyping(false);
        setTypingMessage("");

        toast.error("Error sending message", {
          description:
            "There was an error processing your message. Please try again.",
        });

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          content:
            "Sorry, there was an error processing your message. Please try again.",
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

    const handleProviderChange = (newProvider: "groq" | "ollama") => {
      setProvider(newProvider);
      if (newProvider === "groq") {
        setModel("deepseek-r1-distill-llama-70b");
      } else if (ollamaModels.length > 0) {
        setModel(ollamaModels[0].name);
      } else {
        // If no Ollama models are available, keep the current model but show a warning
        setModel("no-models-found");
        toast.warning("No Ollama models available", {
          description:
            "Please install Ollama models or switch back to Groq provider",
        });
      }
    };

    const handleModelChange = (newModel: string) => {
      // Don't allow selection of the placeholder value
      if (newModel !== "no-models-found") {
        setModel(newModel);
      }
    };

    const handleSummary = async () => {
      if (isSummaryLoading || uploadedFiles.length === 0) return;

      if (model === "no-models-found") {
        toast.error("No valid model selected", {
          description: "Please select a valid model or install Ollama models.",
        });
        return;
      }

      setIsSummaryLoading(true);

      try {
        const result = await generateSummary(notebookId, provider, model);

        const summaryMessage: Message = {
          id: Date.now().toString(),
          content: `## Document Summary\n\n${
            result.summary
          }\n\n**Source Documents:** ${result.sourceDocuments.join(", ")}`,
          role: "assistant",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, summaryMessage]);
        toast.success("Summary generated successfully");
      } catch (error) {
        console.error("Error generating summary:", error);
        toast.error("Failed to generate summary", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setIsSummaryLoading(false);
      }
    };

    const toggleThinking = (messageId: string) => {
      setShowThinking((prev) => ({
        ...prev,
        [messageId]: !prev[messageId],
      }));
    };

    const formatTime = (date: Date) => {
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    };

    return (
      <div className="flex flex-col h-full bg-background overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-border p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Chat with Documents</h2>
                <p className="text-sm text-muted-foreground">
                  {uploadedFiles.length > 0
                    ? `${uploadedFiles.length} document${
                        uploadedFiles.length > 1 ? "s" : ""
                      } loaded`
                    : "No documents loaded"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Provider Selection */}
              <Select value={provider} onValueChange={handleProviderChange}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="ollama">Ollama</SelectItem>
                </SelectContent>
              </Select>

              {/* Model Selection */}
              <Select value={model} onValueChange={handleModelChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {provider === "groq" ? (
                    <>
                      <SelectItem value="deepseek-r1-distill-llama-70b">
                        DeepSeek R1 Distill Llama 70B
                      </SelectItem>
                      <SelectItem value="openai/gpt-oss-120b">
                        OpenAI GPT OSS 120B
                      </SelectItem>
                      <SelectItem value="llama-3.3-70b-versatile">
                        Llama 3.3 70B Versatile
                      </SelectItem>
                      <SelectItem value="qwen/qwen3-32b">Qwen3 32B</SelectItem>
                    </>
                  ) : (
                    <>
                      {ollamaModels.map((ollamaModel) => (
                        <SelectItem
                          key={ollamaModel.name}
                          value={ollamaModel.name}
                        >
                          {ollamaModel.name}
                        </SelectItem>
                      ))}
                      {ollamaModels.length === 0 && (
                        <SelectItem value="no-models-found" disabled>
                          No models found
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>

              {uploadedFiles.length > 0 && (
                <Button
                  onClick={handleSummary}
                  disabled={isSummaryLoading || model === "no-models-found"}
                  variant="outline"
                  size="sm"
                  className="flex items-center space-x-2"
                >
                  {isSummaryLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <FileText className="h-3 w-3" />
                  )}
                  <span>Summary</span>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MessageSquare className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Ready to chat!</h3>
                <p className="text-muted-foreground max-w-sm">
                  {uploadedFiles.length > 0
                    ? "Ask questions about your uploaded documents to get started."
                    : "Upload PDF documents from the sidebar to start chatting with them."}
                </p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div
                    className={`flex ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[80%] ${
                        message.role === "user"
                          ? "flex-row-reverse space-x-reverse"
                          : ""
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        <Card
                          className={`${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : ""
                          }`}
                        >
                          <CardContent className="p-3">
                            <div className="whitespace-pre-wrap text-sm">
                              {message.content}
                            </div>
                          </CardContent>
                        </Card>

                        {message.thinking && (
                          <Card className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
                            <CardContent className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleThinking(message.id)}
                                className="w-full justify-between p-0 h-auto text-amber-700 dark:text-amber-300 hover:bg-transparent"
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="flex h-4 w-4 items-center justify-center">
                                    <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse" />
                                  </div>
                                  <span className="text-xs font-medium">
                                    Reasoning process
                                  </span>
                                </div>
                                {showThinking[message.id] ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                              </Button>

                              {showThinking[message.id] && (
                                <>
                                  <Separator className="my-2 bg-amber-200 dark:bg-amber-800" />
                                  <div className="text-xs text-amber-800 dark:text-amber-200 whitespace-pre-wrap">
                                    {message.thinking}
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        <div
                          className={`text-xs text-muted-foreground ${
                            message.role === "user" ? "text-right" : ""
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted flex-shrink-0">
                      <Bot className="h-4 w-4" />
                    </div>
                    <Card>
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm">
                          {typingMessage}
                          <span className="inline-block w-0.5 h-4 bg-foreground animate-pulse ml-1" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <div className="flex space-x-2">
            <Input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                uploadedFiles.length > 0
                  ? model === "no-models-found"
                    ? "Please select a valid model first..."
                    : "Ask a question about your documents..."
                  : "Upload documents to start chatting..."
              }
              className="flex-1"
              disabled={
                isChatLoading ||
                uploadedFiles.length === 0 ||
                model === "no-models-found"
              }
            />
            <Button
              onClick={handleSendMessage}
              disabled={
                !inputMessage.trim() ||
                isChatLoading ||
                uploadedFiles.length === 0 ||
                model === "no-models-found"
              }
              size="icon"
            >
              {isChatLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {uploadedFiles.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Upload PDF documents from the sidebar to start chatting
            </p>
          )}
        </div>
      </div>
    );
  }
);

ModernChat.displayName = "ModernChat";

export default ModernChat;
