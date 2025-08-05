"use server";

import { createClient } from "@/middlewares/supabase/server";
import { OllamaEmbeddings } from "@langchain/ollama";

const embeddings = new OllamaEmbeddings({
  model: "nomic-embed-text",
  baseUrl: "http://localhost:11434",
});

interface Note {
  id?: string;
  title: string;
  content: string;
  notebook_id: string;
  is_in_memory?: boolean;
}

interface DocumentMetadata {
  notebookId: string;
  filename: string;
  status: string;
  uploadStatus?: string;
  uploadPath?: string;
  documentIndex: number;
  chunkIndex: number;
  totalChunks: number;
  chunkSize: number;
  createdAt: string;
  truncated?: boolean;
}

export async function saveNote(note: Note) {
  try {
    const supabase = await createClient();

    if (note.id) {
      const { data, error } = await supabase
        .from("notes")
        .update({
          title: note.title,
          content: note.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", note.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          title: note.title,
          content: note.content,
          notebook_id: note.notebook_id,
          is_in_memory: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error("Error saving note:", error);
    throw new Error(
      `Failed to save note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function getNotes(notebookId: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .eq("notebook_id", notebookId)
      .order("updated_at", { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching notes:", error);
    throw new Error(
      `Failed to fetch notes: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function deleteNote(noteId: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.from("notes").delete().eq("id", noteId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting note:", error);
    throw new Error(
      `Failed to delete note: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

export async function addNoteToMemory(
  noteId: string,
  content: string,
  notebookId: string
) {
  try {
    const supabase = await createClient();

    const { data: note, error: noteError } = await supabase
      .from("notes")
      .select("*")
      .eq("id", noteId)
      .single();

    if (noteError) throw noteError;

    const embedding = await embeddings.embedQuery(content);

    const metadata: DocumentMetadata = {
      notebookId: notebookId,
      filename: `note_${note.title.replace(/[^a-zA-Z0-9]/g, "_")}.md`,
      status: "completed",
      uploadStatus: "completed",
      uploadPath: "notes",
      documentIndex: 0,
      chunkIndex: 0,
      totalChunks: 1,
      chunkSize: content.length,
      createdAt: new Date().toISOString(),
      truncated: false,
    };

    const { error: insertError } = await supabase.from("documents").insert({
      content: content,
      metadata: metadata,
      embedding: embedding,
    });

    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from("notes")
      .update({ is_in_memory: true })
      .eq("id", noteId);

    if (updateError) throw updateError;
  } catch (error) {
    console.error("Error adding note to memory:", error);
    throw new Error(
      `Failed to add note to memory: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}
