"use client";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";

import type { Notebook } from "@/types/notebook";
import { PlusCircle } from "lucide-react";
import { getUserNotebooks } from "@/actions/getNotebooks/actions";

export default function AddNotebookCard() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotebooks = async () => {
      try {
        setLoading(true);

        const result = await getUserNotebooks();
        if (result.success) {
          setNotebooks(result.data);
        } else {
          console.error("Failed to fetch notebooks:", result.error);
        }
      } catch (error) {
        console.error("Error fetching notebooks:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotebooks();
  }, []);

  return (
    <Card className="flex flex-col w-full max-w-sm h-72 items-center justify-center p-6 bg-neutral-900 text-white border-dashed border-2 border-neutral-700 hover:border-neutral-500 transition-all cursor-pointer hover:shadow-xl hover:shadow-purple-500/20">
      <div className="flex flex-col items-center justify-center h-full w-full">
        {loading ? (
          <p>Loading notebooks...</p>
        ) : notebooks.length > 0 ? (
          <div className="w-full h-full overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Your Notebooks</h3>
            <ul className="space-y-2">
              {notebooks.map((notebook) => (
                <li
                  key={notebook.uuid}
                  className="p-2 hover:bg-neutral-800 rounded-md transition-colors"
                >
                  <a href={`/notebook/${notebook.uuid}`} className="block">
                    {notebook.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <PlusCircle className="w-12 h-12 mb-4 text-neutral-400" />
            <p className="text-center text-neutral-400">
              No notebooks yet. Click to create your first notebook.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
