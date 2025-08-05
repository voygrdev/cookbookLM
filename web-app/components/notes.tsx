"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Brain, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  addNoteToMemory,
  saveNote,
  getNotes,
  deleteNote,
} from "@/actions/notes/actions";

interface Note {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  notebook_id: string;
  is_in_memory: boolean;
}

interface NotesProps {
  notebookId: string;
}

export default function Notes({ notebookId }: NotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [newNote, setNewNote] = useState({ title: "", content: "" });
  const [addingToMemory, setAddingToMemory] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const fetchedNotes = await getNotes(notebookId);
      setNotes(fetchedNotes);
    } catch (error) {
      console.error("Error fetching notes:", error);
      toast.error("Failed to fetch notes");
    }
  }, [notebookId]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleSaveNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) {
      toast.error("Please fill in both title and content");
      return;
    }

    setIsLoading(true);
    try {
      if (editingNote) {
        await saveNote({
          id: editingNote.id,
          title: newNote.title,
          content: newNote.content,
          notebook_id: notebookId,
        });
        toast.success("Note updated successfully");
      } else {
        await saveNote({
          title: newNote.title,
          content: newNote.content,
          notebook_id: notebookId,
        });
        toast.success("Note saved successfully");
      }

      setNewNote({ title: "", content: "" });
      setEditingNote(null);
      setIsDialogOpen(false);
      fetchNotes();
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save note");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setNewNote({ title: note.title, content: note.content });
    setIsDialogOpen(true);
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteNote(noteId);
      toast.success("Note deleted successfully");
      fetchNotes();
    } catch (error) {
      console.error("Error deleting note:", error);
      toast.error("Failed to delete note");
    }
  };

  const handleAddToMemory = async (note: Note) => {
    if (note.is_in_memory) {
      toast.info("Note is already in memory");
      return;
    }

    setAddingToMemory(note.id);
    try {
      await addNoteToMemory(note.id, note.content, notebookId);
      toast.success("Note added to memory successfully");
      fetchNotes();
    } catch (error) {
      console.error("Error adding note to memory:", error);
      toast.error("Failed to add note to memory");
    } finally {
      setAddingToMemory(null);
    }
  };

  const openNewNoteDialog = () => {
    setEditingNote(null);
    setNewNote({ title: "", content: "" });
    setIsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border p-5 flex-shrink-0 m-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Notes</h2>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={openNewNoteDialog}
                className="flex items-center space-x-1"
              >
                <Plus className="h-4 w-4" />
                <span>Add Note</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
              <DialogHeader>
                <DialogTitle>
                  {editingNote ? "Edit Note" : "Add New Note"}
                </DialogTitle>
                <DialogDescription>
                  Write your note in Markdown format. You can add it to memory
                  later to make it searchable.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter note title..."
                  />
                </div>

                <div className="space-y-2 flex-1">
                  <Label htmlFor="content">Content (Markdown)</Label>
                  <Textarea
                    id="content"
                    value={newNote.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setNewNote((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Write your note in Markdown format..."
                    className="min-h-[300px] font-mono text-sm"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSaveNote} disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingNote ? "Update Note" : "Save Note"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {notes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">No notes yet</h3>
              <p className="text-muted-foreground max-w-sm">
                Create your first note to start organizing your thoughts and
                research.
              </p>
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className="group hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate">
                      {note.title}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditNote(note)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground line-clamp-3 mb-3">
                  {note.content.substring(0, 150)}
                  {note.content.length > 150 && "..."}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {note.is_in_memory && (
                      <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded">
                        <Brain className="h-3 w-3" />
                        <span>In Memory</span>
                      </div>
                    )}
                  </div>

                  {!note.is_in_memory && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddToMemory(note)}
                      disabled={addingToMemory === note.id}
                      className="text-xs h-7"
                    >
                      {addingToMemory === note.id ? (
                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      ) : (
                        <Brain className="mr-1 h-3 w-3" />
                      )}
                      Add to Memory
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
