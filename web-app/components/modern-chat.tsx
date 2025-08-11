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
  RotateCcw,
  Sparkles,
  BookOpen,
  Brain,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github.css";
import Image from "next/image";
import { motion } from "framer-motion";
import { sendChatMessage } from "../actions/chat/actions";
import { generateSummary } from "../actions/summary/actions";
import { generateMindmap, MindmapData } from "../actions/mindmap/actions";
import MindmapViewer from "./mindmap-viewer";
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
    const [isMindmapLoading, setIsMindmapLoading] = useState(false);
    const [mindmapData, setMindmapData] = useState<MindmapData | null>(null);
    const [showMindmap, setShowMindmap] = useState(false);
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
    const [executingTool, setExecutingTool] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [loadingWordIndex, setLoadingWordIndex] = useState(0);
    const [uploadedFiles, setUploadedFiles] = useState<
      Array<{ name: string; url: string }>
    >([]);

    const loadingWords = ["Thinking", "Generating", "Processing", "Analyzing"];

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

    useEffect(() => {
      if (isChatLoading) {
        const interval = setInterval(() => {
          setLoadingWordIndex((prev) => (prev + 1) % loadingWords.length);
        }, 800);
        return () => clearInterval(interval);
      }
    }, [isChatLoading, loadingWords.length]);

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
      const typingSpeed = 2; 

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
          model,
          notebookId
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

    const addModelSwitchMessage = (newModel: string, newProvider: string) => {
      const modelDisplayName =
        newModel === "deepseek-r1-distill-llama-70b"
          ? "DeepSeek R1 Distill Llama 70B"
          : newModel === "openai/gpt-oss-120b"
          ? "OpenAI GPT OSS 120B"
          : newModel === "llama-3.3-70b-versatile"
          ? "Llama 3.3 70B Versatile"
          : newModel === "qwen/qwen3-32b"
          ? "Qwen3 32B"
          : newModel;

      const switchMessage: Message = {
        id: Date.now().toString(),
        content: `Switched to ${modelDisplayName} (${newProvider.toUpperCase()})`,
        role: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, switchMessage]);
    };

    const handleProviderChange = (newProvider: "groq" | "ollama") => {
      const oldModel = model;
      setProvider(newProvider);
      let newModel = model;

      if (newProvider === "groq") {
        newModel = "deepseek-r1-distill-llama-70b";
        setModel(newModel);
      } else if (ollamaModels.length > 0) {
        newModel = ollamaModels[0].name;
        setModel(newModel);
      } else {
        newModel = "no-models-found";
        setModel(newModel);
        return;
      }

      if (oldModel !== newModel && newModel !== "no-models-found") {
        addModelSwitchMessage(newModel, newProvider);
      }
    };

    const handleToolAction = async (
      tool: string,
      messageContent: string,
      messageId: string
    ) => {
      setExecutingTool(messageId);

      try {
        let toolPrompt = "";
        switch (tool) {
          case "regenerate":
            toolPrompt =
              "Please regenerate your previous response with a fresh perspective.";
            break;
          case "improve":
            toolPrompt =
              "Please improve your previous answer by making it more accurate, detailed, and helpful.";
            break;
          case "simplify":
            toolPrompt =
              "Please simplify your previous response to make it easier to understand.";
            break;
          case "expand":
            toolPrompt =
              "Please expand on your previous response with more details and examples.";
            break;
          default:
            return;
        }

        const conversationHistory = messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

        const response = await sendChatMessage(
          toolPrompt,
          conversationHistory,
          provider,
          model,
          notebookId
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

        const newMessageId = Date.now().toString();
        const assistantMessage: Message = {
          id: newMessageId,
          content: responseContent,
          role: "assistant",
          timestamp: new Date(),
          thinking: thinking || undefined,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        toast.success(
          `${tool.charAt(0).toUpperCase() + tool.slice(1)} completed`
        );
      } catch (error) {
        console.error("Error executing tool:", error);
        toast.error(`Failed to ${tool}`, {
          description: "Please try again",
        });
      } finally {
        setExecutingTool(null);
      }
    };

    const handleModelChange = (newModel: string) => {
      // Don't allow selection of the placeholder value
      if (newModel !== "no-models-found" && newModel !== model) {
        setModel(newModel);
        addModelSwitchMessage(newModel, provider);
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

    const handleMindmap = async () => {
      if (isMindmapLoading || uploadedFiles.length === 0) return;

      if (model === "no-models-found") {
        toast.error("No valid model selected", {
          description: "Please select a valid model or install Ollama models.",
        });
        return;
      }

      setIsMindmapLoading(true);

      try {
        const result = await generateMindmap(notebookId, provider, model);
        setMindmapData(result);
        setShowMindmap(true);
        toast.success("Mindmap generated successfully");
      } catch (error) {
        console.error("Error generating mindmap:", error);
        toast.error("Failed to generate mindmap", {
          description:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setIsMindmapLoading(false);
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

    const GroqLogo = () => (
      <Image
        src="/groq.svg"
        alt="Groq"
        width={16}
        height={16}
        className="rounded-sm dark:invert"
      />
    );

    const DeepSeekLogo = () => (
      <Image
        src="/deepseek.svg"
        alt="DeepSeek"
        width={16}
        height={16}
        className="rounded-sm"
      />
    );

    const OpenAILogo = () => (
      <Image
        src="/openai.svg"
        alt="OpenAI"
        width={16}
        height={16}
        className="rounded-sm dark:invert"
      />
    );

    const LlamaLogo = () => (
      <Image
        src="/meta-color.svg"
        alt="Meta Llama"
        width={16}
        height={16}
        className="rounded-sm"
      />
    );

    const QwenLogo = () => (
      <Image
        src="/qwen-color.svg"
        alt="Qwen"
        width={16}
        height={16}
        className="rounded-sm"
      />
    );

    const OllamaLogo = () => (
      <Image
        src="/ollama.svg"
        alt="Ollama"
        width={16}
        height={16}
        className="rounded-sm dark:invert"
      />
    );

    return (
      <div className="flex flex-col h-full bg-slate-950/70 overflow-hidden">
        {/* Chat Header */}
        <div className="border-b border-slate-700/50 p-4 flex-shrink-0 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-violet-500/20">
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <h2 className="font-semibold text-white">
                  Chat with Documents
                </h2>
                <p className="text-sm text-slate-300">
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
                <SelectTrigger className="w-28 h-9 bg-slate-800/80 border-slate-600/50 text-slate-200 hover:border-slate-500/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  <SelectItem
                    value="groq"
                    className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                  >
                    <div className="flex items-center space-x-2">
                      <GroqLogo />
                      <span>Groq</span>
                    </div>
                  </SelectItem>
                  <SelectItem
                    value="ollama"
                    className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                  >
                    <div className="flex items-center space-x-2">
                      <OllamaLogo />
                      <span>Ollama</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Model Selection */}
              <Select value={model} onValueChange={handleModelChange}>
                <SelectTrigger className="w-60 h-9 bg-slate-800/80 border-slate-600/50 text-slate-200 hover:border-slate-500/70">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {provider === "groq" ? (
                    <>
                      <SelectItem
                        value="deepseek-r1-distill-llama-70b"
                        className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <DeepSeekLogo />
                          <span className="truncate">
                            DeepSeek R1 Distill Llama 70B
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="openai/gpt-oss-120b"
                        className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <OpenAILogo />
                          <span className="truncate">OpenAI GPT OSS 120B</span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="llama-3.3-70b-versatile"
                        className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <LlamaLogo />
                          <span className="truncate">
                            Llama 3.3 70B Versatile
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem
                        value="qwen/qwen3-32b"
                        className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                      >
                        <div className="flex items-center space-x-2 min-w-0">
                          <QwenLogo />
                          <span className="truncate">Qwen3 32B</span>
                        </div>
                      </SelectItem>
                    </>
                  ) : (
                    <>
                      {ollamaModels.map((ollamaModel) => (
                        <SelectItem
                          key={ollamaModel.name}
                          value={ollamaModel.name}
                          className="text-slate-200 hover:bg-slate-700/70 hover:text-white focus:bg-slate-700/70 focus:text-white"
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <OllamaLogo />
                            <span className="truncate">{ollamaModel.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                      {ollamaModels.length === 0 && (
                        <SelectItem
                          value="no-models-found"
                          disabled
                          className="text-slate-400"
                        >
                          No models found
                        </SelectItem>
                      )}
                    </>
                  )}
                </SelectContent>
              </Select>

              {uploadedFiles.length > 0 && (
                <>
                  <Button
                    onClick={handleSummary}
                    disabled={isSummaryLoading || model === "no-models-found"}
                    variant="outline"
                    size="default"
                    className="flex items-center space-x-2 h-9 px-3 bg-transparent border-slate-600/50 text-slate-200 hover:bg-slate-800/50 hover:text-white hover:border-slate-500/70"
                  >
                    {isSummaryLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <FileText className="h-3 w-3" />
                    )}
                    <span>Summary</span>
                  </Button>

                  <Button
                    onClick={handleMindmap}
                    disabled={isMindmapLoading || model === "no-models-found"}
                    variant="outline"
                    size="default"
                    className="flex items-center space-x-2 h-9 px-3 bg-transparent border-slate-600/50 text-slate-200 hover:bg-slate-800/50 hover:text-white hover:border-slate-500/70"
                  >
                    {isMindmapLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Brain className="h-3 w-3" />
                    )}
                    <span>Mindmap</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500/20 to-violet-500/20 backdrop-blur-sm">
                <MessageSquare className="h-8 w-8 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-white">
                  Ready to chat!
                </h3>
                <p className="text-slate-300 max-w-sm">
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
                            ? "bg-gradient-to-r from-blue-600 to-violet-600"
                            : "bg-slate-800/80 backdrop-blur-sm"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="h-4 w-4 text-white" />
                        ) : (
                          <Bot className="h-4 w-4 text-blue-400" />
                        )}
                      </div>

                      <div className="space-y-2 flex-1">
                        {/* Tools dropdown for AI messages */}
                        {message.role === "assistant" &&
                          !message.content.includes("Switched to") && (
                            <div className="flex justify-start">
                              <Select
                                onValueChange={(value) =>
                                  handleToolAction(
                                    value,
                                    message.content,
                                    message.id
                                  )
                                }
                              >
                                <SelectTrigger className="w-40 h-8 text-xs bg-blue-900/30 border-blue-600/30 text-blue-200 hover:bg-blue-800/40 hover:border-blue-500/50 rounded-lg">
                                  <SelectValue placeholder="Tools" />
                                </SelectTrigger>
                                <SelectContent className="bg-blue-950/90 border-blue-600/30 rounded-lg backdrop-blur-sm">
                                  <SelectItem
                                    value="regenerate"
                                    disabled={executingTool === message.id}
                                    className="text-blue-100 hover:bg-blue-800/50 hover:text-white rounded-md focus:bg-blue-800/50"
                                  >
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <RotateCcw className="h-3 w-3 flex-shrink-0" />
                                      <span>Regenerate</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem
                                    value="improve"
                                    disabled={executingTool === message.id}
                                    className="text-blue-100 hover:bg-blue-800/50 hover:text-white rounded-md focus:bg-blue-800/50"
                                  >
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <Sparkles className="h-3 w-3 flex-shrink-0" />
                                      <span>Improve Answer</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem
                                    value="simplify"
                                    disabled={executingTool === message.id}
                                    className="text-blue-100 hover:bg-blue-800/50 hover:text-white rounded-md focus:bg-blue-800/50"
                                  >
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <FileText className="h-3 w-3 flex-shrink-0" />
                                      <span>Simplify</span>
                                    </div>
                                  </SelectItem>
                                  <SelectItem
                                    value="expand"
                                    disabled={executingTool === message.id}
                                    className="text-blue-100 hover:bg-blue-800/50 hover:text-white rounded-md focus:bg-blue-800/50"
                                  >
                                    <div className="flex items-center gap-2 whitespace-nowrap">
                                      <BookOpen className="h-3 w-3 flex-shrink-0" />
                                      <span>Expand Details</span>
                                    </div>
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          )}

                        <Card
                          className={`${
                            message.role === "user"
                              ? "bg-gradient-to-r from-blue-600 to-violet-600 text-white border-blue-500/50"
                              : message.content.includes("Switched to")
                              ? "bg-slate-800/50 border-slate-700/50 backdrop-blur-sm"
                              : "bg-slate-900/90 border-slate-700/50 backdrop-blur-sm"
                          }`}
                        >
                          <CardContent className="p-3">
                            {message.role === "assistant" &&
                            !message.content.includes("Switched to") ? (
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown
                                  remarkPlugins={[remarkGfm]}
                                  rehypePlugins={[rehypeHighlight]}
                                  components={{
                                    h1: ({ children }) => (
                                      <h1 className="text-lg font-bold mb-2 text-white">
                                        {children}
                                      </h1>
                                    ),
                                    h2: ({ children }) => (
                                      <h2 className="text-base font-semibold mb-2 text-slate-100">
                                        {children}
                                      </h2>
                                    ),
                                    h3: ({ children }) => (
                                      <h3 className="text-sm font-medium mb-1 text-slate-100">
                                        {children}
                                      </h3>
                                    ),
                                    p: ({ children }) => (
                                      <p className="mb-2 last:mb-0 text-slate-200">
                                        {children}
                                      </p>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-disc pl-4 mb-2 text-slate-200">
                                        {children}
                                      </ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal pl-4 mb-2 text-slate-200">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="mb-1 text-slate-200">
                                        {children}
                                      </li>
                                    ),
                                    code: ({ children, className }) => {
                                      const isInline = !className;
                                      return isInline ? (
                                        <code className="bg-slate-800/60 px-1 py-0.5 rounded text-sm font-mono text-blue-200">
                                          {children}
                                        </code>
                                      ) : (
                                        <code className={className}>
                                          {children}
                                        </code>
                                      );
                                    },
                                    pre: ({ children }) => (
                                      <pre className="bg-slate-950/90 p-3 rounded-lg overflow-x-auto mb-2 border border-slate-700/50">
                                        {children}
                                      </pre>
                                    ),
                                    blockquote: ({ children }) => (
                                      <blockquote className="border-l-4 border-blue-500 pl-4 italic mb-2 text-slate-300">
                                        {children}
                                      </blockquote>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-white">
                                        {children}
                                      </strong>
                                    ),
                                    em: ({ children }) => (
                                      <em className="italic text-slate-100">
                                        {children}
                                      </em>
                                    ),
                                    a: ({ children, href }) => (
                                      <a
                                        href={href}
                                        className="text-blue-400 underline hover:no-underline hover:text-blue-300"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {children}
                                      </a>
                                    ),
                                    table: ({ children }) => (
                                      <div className="overflow-x-auto mb-2">
                                        <table className="min-w-full border border-slate-700/50">
                                          {children}
                                        </table>
                                      </div>
                                    ),
                                    th: ({ children }) => (
                                      <th className="border border-slate-700/50 px-2 py-1 bg-slate-800/50 font-semibold text-left text-slate-100">
                                        {children}
                                      </th>
                                    ),
                                    td: ({ children }) => (
                                      <td className="border border-slate-700/50 px-2 py-1 text-slate-200">
                                        {children}
                                      </td>
                                    ),
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div
                                className={`whitespace-pre-wrap text-sm ${
                                  message.content.includes("Switched to")
                                    ? "text-slate-300 italic text-center"
                                    : message.role === "user"
                                    ? "text-white"
                                    : "text-slate-200"
                                }`}
                              >
                                {message.content}
                              </div>
                            )}
                          </CardContent>
                        </Card>

                        {message.thinking && (
                          <Card className="bg-amber-950/30 border-amber-700/50 backdrop-blur-sm">
                            <CardContent className="p-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleThinking(message.id)}
                                className="w-full justify-between p-0 h-auto text-amber-300 hover:bg-transparent"
                              >
                                <div className="flex items-center space-x-2">
                                  <div className="flex h-4 w-4 items-center justify-center">
                                    <div className="h-2 w-2 bg-amber-400 rounded-full animate-pulse" />
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
                                  <Separator className="my-2 bg-amber-700/50" />
                                  <div className="text-xs text-amber-200 whitespace-pre-wrap">
                                    {message.thinking}
                                  </div>
                                </>
                              )}
                            </CardContent>
                          </Card>
                        )}

                        <div
                          className={`text-xs text-slate-500 ${
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

              {/* Loading Component while generating response */}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                    <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                          <span className="text-sm text-slate-200 font-medium">
                            {loadingWords[loadingWordIndex]}...
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3 max-w-[80%]">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 backdrop-blur-sm flex-shrink-0">
                      <Bot className="h-4 w-4 text-blue-400" />
                    </div>
                    <Card className="bg-slate-900/90 border-slate-700/50 backdrop-blur-sm">
                      <CardContent className="p-3">
                        <div className="whitespace-pre-wrap text-sm text-slate-200">
                          {typingMessage}
                          <span className="inline-block w-0.5 h-4 bg-blue-400 animate-pulse ml-1" />
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
        <div className="border-t border-slate-700/50 p-4 flex-shrink-0 bg-slate-900/80 backdrop-blur-sm">
          <div className="flex space-x-3 items-end justify-center">
            <motion.div
              className="w-[60%]"
              whileHover={{ scale: 1.02 }}
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                className="relative"
                initial={{ width: "100%" }}
                whileHover={{
                  width: "100%",
                  transition: { duration: 0.3, ease: "easeOut" },
                }}
              >
                <div className="relative w-full">
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
                    className="h-12 bg-slate-800/80 border-slate-600/50 text-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500/20 rounded-full pl-6 pr-12 py-3 transition-all duration-300 hover:bg-slate-700/80 hover:border-slate-500/70 w-full"
                    disabled={
                      isChatLoading ||
                      uploadedFiles.length === 0 ||
                      model === "no-models-found"
                    }
                  />
                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={
                      !inputMessage.trim() ||
                      isChatLoading ||
                      uploadedFiles.length === 0 ||
                      model === "no-models-found"
                    }
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none"
                    tabIndex={-1}
                  >
                    {isChatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {uploadedFiles.length === 0 && (
            <p className="text-xs text-slate-400 mt-2 text-center">
              Upload PDF documents from the sidebar to start chatting
            </p>
          )}
        </div>

        {/* Mindmap Viewer Modal */}
        {mindmapData && (
          <MindmapViewer
            mindmapData={mindmapData}
            isOpen={showMindmap}
            onClose={() => setShowMindmap(false)}
          />
        )}
      </div>
    );
  }
);

ModernChat.displayName = "ModernChat";

export default ModernChat;
