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
import { toast } from "sonner";

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

      toast.success("Success", {
        description: "Notebook created successfully!",
      });

      console.log("Notebook created:", response.data);
      setName("");
      setOpen(false);
    } catch (error) {
      console.error("Error creating notebook:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred");
      toast.error("Error", {
        description: error instanceof Error ? error.message : "An unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="mt-6 bg-neutral-900 text-white border border-neutral-700 hover:bg-neutral-800">
          Add Notebook
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-neutral-900 text-white border border-neutral-700">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">Add Notebook</DialogTitle>
            <DialogDescription className="text-neutral-400">
              Create a new notebook by giving it a name.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-neutral-300">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter notebook name"
                required
                className="bg-neutral-800 border-neutral-600 text-white placeholder-neutral-500 focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            {error && <div className="text-red-500 text-sm">{error}</div>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                className="bg-red-500 text-white hover:bg-red-600 border-none"
              >
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 ease-in-out transform hover:scale-105"
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
