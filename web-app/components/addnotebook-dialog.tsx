"use client";
import { addNotebook } from "@/actions/addNotebook/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

export function DialogDemo() {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      const response = await addNotebook(name);

      if (!response.success) {
        throw new Error(response.data?.error || "Failed to create notebook");
      }

      console.log("Notebook created:", response.data);
      setName("");
      setOpen(false); 
    } catch (error) {
      console.error("Error creating notebook:", error);
      setError(
        error instanceof Error ? error.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-4">
          Add Notebook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Notebook</DialogTitle>
            <DialogDescription>Create a new notebook</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-3">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter notebook name"
                required
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
          <DialogFooter className="mt-4">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="bg-red-500 border-none hover:bg-red-500 hover:text-white"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-white text-black hover:bg-white hover:text-black"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
