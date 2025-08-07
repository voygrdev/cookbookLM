"use server";

import { createClient } from "@/middlewares/supabase/server";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/ollama";
import similaritySearch from "@/tools/similaritysearch";
import {
  MINDMAP_ROOT_TITLE_PROMPT,
  MINDMAP_MAIN_NODE_TITLE_PROMPT,
  MINDMAP_SUB_TOPICS_PROMPT,
} from "@/lib/prompts";

export interface MindmapNode {
  id: string;
  data: {
    label: string;
    type: "root" | "main" | "sub" | "detail";
    color?: string;
  };
  position: { x: number; y: number };
  type: "mindmapNode";
}

export interface MindmapEdge {
  id: string;
  source: string;
  target: string;
  type: "smoothstep";
  animated?: boolean;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
  title: string;
}

interface NoteData {
  id: string;
  title: string;
  content: string;
}

export async function generateMindmap(
  notebookId: string,
  provider: "groq" | "ollama" = "groq",
  model: string = "deepseek-r1-distill-llama-70b"
): Promise<MindmapData> {
  try {
    const llm =
      provider === "groq"
        ? new ChatGroq({ model, temperature: 0.3 })
        : new ChatOllama({ model, temperature: 0.3 });

    const searchResults = await similaritySearch(
      "document content overview structure topics themes concepts",
      notebookId,
      50
    );
    const supabase = await createClient();
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, title, content")
      .eq("notebook_id", notebookId);

    if (notesError) {
      console.error("Error fetching notes:", notesError);
    }

    const documentsMap = new Map<
      string,
      { content: string[]; filename: string }
    >();
    searchResults.forEach((result) => {
      const filename = result.metadata?.filename || "Unknown Document";
      if (!documentsMap.has(filename)) {
        documentsMap.set(filename, { content: [], filename });
      }
      documentsMap.get(filename)?.content.push(result.content);
    });

    const documents = Array.from(documentsMap.values());
    const notesData = notes || [];

    if (documents.length === 0 && notesData.length === 0) {
      throw new Error("No documents or notes found for this notebook");
    }

    const nodes: MindmapNode[] = [];
    const edges: MindmapEdge[] = [];

    const allContent = [
      ...documents.map((doc) => doc.content.join(" ").substring(0, 500)),
      ...notesData.map((note) => note.content.substring(0, 500)),
    ].join("\n");

    const rootTitle = await generateRootTitle(
      llm,
      allContent,
      documents.length,
      notesData.length
    );

    nodes.push({
      id: "root",
      data: { label: rootTitle, type: "root", color: "#3b82f6" },
      position: { x: 0, y: 0 },
      type: "mindmapNode",
    });

    let nodeCounter = 1;

    for (const [index, doc] of documents.entries()) {
      const totalItems = documents.length + notesData.length;
      const angle = (2 * Math.PI * index) / totalItems;
      const radius = 300;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const mainNodeId = `doc-${nodeCounter++}`;

      const docContent = doc.content.join(" ").substring(0, 1000);
      const mainTitle = await generateMainNodeTitle(
        llm,
        docContent,
        doc.filename
      );

      nodes.push({
        id: mainNodeId,
        data: {
          label: mainTitle,
          type: "main",
          color: "#10b981",
        },
        position: { x: Math.round(x), y: Math.round(y) },
        type: "mindmapNode",
      });

      edges.push({
        id: `root-${mainNodeId}`,
        source: "root",
        target: mainNodeId,
        type: "smoothstep",
        animated: true,
      });

      const docContentForTopics = doc.content.join(" ").substring(0, 2000);
      const topics = await extractTopics(llm, docContentForTopics);

      topics.forEach((topic, topicIndex) => {
        const subAngle = angle + (topicIndex - 1) * 0.4;
        const subRadius = radius + 150;
        const subX = Math.cos(subAngle) * subRadius;
        const subY = Math.sin(subAngle) * subRadius;

        const subNodeId = `sub-${mainNodeId}-${topicIndex}`;
        nodes.push({
          id: subNodeId,
          data: { label: topic, type: "sub", color: "#f59e0b" },
          position: { x: Math.round(subX), y: Math.round(subY) },
          type: "mindmapNode",
        });

        edges.push({
          id: `${mainNodeId}-${subNodeId}`,
          source: mainNodeId,
          target: subNodeId,
          type: "smoothstep",
          animated: true,
        });
      });
    }

    for (const [index, note] of notesData.entries()) {
      const totalItems = documents.length + notesData.length;
      const angle = (2 * Math.PI * (documents.length + index)) / totalItems;
      const radius = 300;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;

      const mainNodeId = `note-${nodeCounter++}`;

      nodes.push({
        id: mainNodeId,
        data: {
          label:
            note.title.length > 25
              ? note.title.substring(0, 25) + "..."
              : note.title,
          type: "main",
          color: "#10b981",
        },
        position: { x: Math.round(x), y: Math.round(y) },
        type: "mindmapNode",
      });

      edges.push({
        id: `root-${mainNodeId}`,
        source: "root",
        target: mainNodeId,
        type: "smoothstep",
        animated: true,
      });

      const noteTopics = await extractTopics(llm, note.content);

      noteTopics.forEach((topic, topicIndex) => {
        const subAngle = angle + (topicIndex - 1) * 0.4;
        const subRadius = radius + 150;
        const subX = Math.cos(subAngle) * subRadius;
        const subY = Math.sin(subAngle) * subRadius;

        const subNodeId = `sub-${mainNodeId}-${topicIndex}`;
        nodes.push({
          id: subNodeId,
          data: { label: topic, type: "sub", color: "#f59e0b" },
          position: { x: Math.round(subX), y: Math.round(subY) },
          type: "mindmapNode",
        });

        edges.push({
          id: `${mainNodeId}-${subNodeId}`,
          source: mainNodeId,
          target: subNodeId,
          type: "smoothstep",
          animated: true,
        });

        if (topic.length > 10 && topicIndex < 1) {
          const detailAngle = subAngle + 0.3;
          const detailRadius = subRadius + 120;
          const detailX = Math.cos(detailAngle) * detailRadius;
          const detailY = Math.sin(detailAngle) * detailRadius;

          const detailNodeId = `detail-${subNodeId}-0`;
          nodes.push({
            id: detailNodeId,
            data: { label: "Details", type: "detail", color: "#6b7280" },
            position: { x: Math.round(detailX), y: Math.round(detailY) },
            type: "mindmapNode",
          });

          edges.push({
            id: `${subNodeId}-${detailNodeId}`,
            source: subNodeId,
            target: detailNodeId,
            type: "smoothstep",
            animated: true,
          });
        }
      });
    }

    return {
      title: `${documents.length} Documents & ${notesData.length} Notes`,
      nodes,
      edges,
    };
  } catch (error) {
    console.error("Error generating mindmap:", error);
    throw new Error(
      error instanceof Error ? error.message : "Failed to generate mindmap"
    );
  }
}

async function generateRootTitle(
  llm: ChatGroq | ChatOllama,
  content: string,
  docCount: number,
  noteCount: number
): Promise<string> {
  try {
    const prompt = MINDMAP_ROOT_TITLE_PROMPT.prompt
      .replace("{{docCount}}", docCount.toString())
      .replace("{{noteCount}}", noteCount.toString())
      .replace("{{content}}", content.substring(0, 1000));

    const response = await llm.invoke(prompt);
    const title = String(response.content).trim().replace(/['"]/g, "");
    return title.length > 20 ? title.substring(0, 20) + "..." : title;
  } catch {
    return `${docCount + noteCount} Items`;
  }
}

async function generateMainNodeTitle(
  llm: ChatGroq | ChatOllama,
  content: string,
  filename: string
): Promise<string> {
  try {
    const prompt = MINDMAP_MAIN_NODE_TITLE_PROMPT.prompt
      .replace("{{filename}}", filename)
      .replace("{{content}}", content.substring(0, 500));

    const response = await llm.invoke(prompt);
    const title = String(response.content).trim().replace(/['"]/g, "");
    return title.length > 25 ? title.substring(0, 25) + "..." : title;
  } catch {
    return filename.length > 25 ? filename.substring(0, 25) + "..." : filename;
  }
}

async function extractTopics(
  llm: ChatGroq | ChatOllama,
  content: string
): Promise<string[]> {
  try {
    const prompt = MINDMAP_SUB_TOPICS_PROMPT.prompt.replace(
      "{{content}}",
      content.substring(0, 1000)
    );

    const response = await llm.invoke(prompt);
    const topics = String(response.content)
      .trim()
      .split(",")
      .map((topic: string) => topic.trim().replace(/['"]/g, ""))
      .filter((topic: string) => topic.length > 0)
      .slice(0, 3); 

    while (topics.length < 3) {
      topics.push(`Topic${topics.length + 1}`);
    }

    return topics.slice(0, 3);
  } catch {
    return ["Topic1", "Topic2", "Topic3"];
  }
}
