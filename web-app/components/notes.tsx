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
    <div className="h-full flex flex-col bg-slate-950/70">
      {/* Header */}
      <div className="border-b border-slate-700/50 p-5 flex-shrink-0 m-0 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-400" />
            <h2 className="font-semibold text-white">Notes</h2>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                onClick={openNewNoteDialog}
                className="flex items-center space-x-1 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
              >
                <Plus className="h-4 w-4" />
                <span>Add Note</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">
                  {editingNote ? "Edit Note" : "Add New Note"}
                </DialogTitle>
                <DialogDescription className="text-slate-300">
                  Write your note in Markdown format. You can add it to memory
                  later to make it searchable.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 space-y-4 overflow-y-auto">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-slate-200">
                    Title
                  </Label>
                  <Input
                    id="title"
                    value={newNote.title}
                    onChange={(e) =>
                      setNewNote((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Enter note title..."
                    className="bg-slate-800/80 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2 flex-1">
                  <Label htmlFor="content" className="text-slate-200">
                    Content (Markdown)
                  </Label>
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
                    className="min-h-[300px] font-mono text-sm bg-slate-800/80 border-slate-600/50 text-white placeholder:text-slate-400"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="border-slate-600/50 text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveNote}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white"
                >
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
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800/60">
              <FileText className="h-8 w-8 text-slate-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-200">
                No notes yet
              </h3>
              <p className="text-slate-400 max-w-sm">
                Create your first note to start organizing your thoughts and
                research.
              </p>
            </div>
          </div>
        ) : (
          notes.map((note) => (
            <Card
              key={note.id}
              className="group hover:shadow-md transition-shadow bg-slate-900/60 border-slate-700/50 hover:bg-slate-800/60 backdrop-blur-sm"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-medium truncate text-white">
                      {note.title}
                    </CardTitle>
                    <p className="text-xs text-slate-400 mt-1">
                      {formatDate(note.updated_at)}
                    </p>
                  </div>

                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditNote(note)}
                      className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-700/50 hover:text-white"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteNote(note.id)}
                      className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="text-xs text-slate-300 line-clamp-3 mb-3">
                  {note.content.substring(0, 150)}
                  {note.content.length > 150 && "..."}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {note.is_in_memory && (
                      <div className="flex items-center space-x-1 text-xs text-green-400 bg-green-900/20 border border-green-800/30 px-2 py-1 rounded">
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
                      className="text-xs h-7 border-slate-600/50 text-slate-200 hover:bg-slate-700/50"
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
