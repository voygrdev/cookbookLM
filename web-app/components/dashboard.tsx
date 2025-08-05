"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import NotebookCard from "@/components/notebook-card";
import { DialogDemo } from "./addnotebook-dialog";
import Header from "@/components/header";
import { getUserNotebooks } from "@/actions/getNotebooks/actions";
import { toast } from "sonner";
import type { Notebook } from "@/types/notebook";

export default function Dashboard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchNotebooks = async () => {
    try {
      setLoading(true);
      const result = await getUserNotebooks();
      if (result.success) {
        setNotebooks(result.data);
      } else {
        console.error("Failed to fetch notebooks:", result.error);
        toast.error("Failed to load notebooks", {
          description:
            "There was an error loading your notebooks. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error fetching notebooks:", error);
      toast.error("Failed to load notebooks", {
        description: "An unexpected error occurred while loading notebooks.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotebooks();
  }, []);

  const handleDeleteNotebook = async (uuid: string) => {
    setNotebooks((prev) => prev.filter((notebook) => notebook.uuid !== uuid));
  };

  const handleRefresh = () => {
    fetchNotebooks();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Your Notebooks
            </h1>
            <p className="text-slate-300">
              Manage and organize your document collections
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                disabled={loading}
                className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white bg-slate-900/50"
              >
                Refresh
              </Button>
            </div>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Notebook
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <Card
                  key={i}
                  className="animate-pulse bg-slate-900/50 border-slate-700/50 backdrop-blur-sm"
                >
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded w-full"></div>
                      <div className="h-3 bg-slate-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notebooks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {notebooks.map((notebook) => (
                <NotebookCard
                  key={notebook.uuid}
                  notebook={notebook}
                  onDelete={handleDeleteNotebook}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="space-y-4">
                <div className="mx-auto w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center backdrop-blur-sm border border-slate-700/50">
                  <Plus className="h-12 w-12 text-slate-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">
                    No notebooks yet
                  </h3>
                  <p className="text-slate-300 max-w-sm mx-auto">
                    Get started by creating your first notebook to organize your
                    documents
                  </p>
                </div>
                <Button
                  onClick={() => setDialogOpen(true)}
                  size="lg"
                  className="mt-4 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first notebook
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      <DialogDemo
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
