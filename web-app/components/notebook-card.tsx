"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  FileText,
  Calendar,
  Trash2,
  Edit,
  ExternalLink,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { Notebook } from "@/types/notebook";
import { deleteNotebook } from "@/actions/deleteNotebook/actions";

interface NotebookCardProps {
  notebook: Notebook;
  onDelete: (uuid: string) => void;
}

export default function NotebookCard({
  notebook,
  onDelete,
}: NotebookCardProps) {
  const router = useRouter();

  const handleDelete = async () => {
    try {
      const response = await deleteNotebook(notebook.uuid);

      if (!response.success) {
        throw new Error(response.error || "Failed to delete notebook");
      }

      onDelete(notebook.uuid);
      toast.success("Notebook deleted", {
        description: `"${notebook.name}" has been successfully deleted.`,
      });
    } catch {
      toast.error("Error deleting notebook", {
        description:
          "An error occurred while deleting the notebook. Please try again.",
      });
    }
  };

  const handleEdit = () => {
    toast.info("Edit functionality", {
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleOpen = () => {
    router.push(`/notebook/${notebook.uuid}`);
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

  return (
    <Card className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 border-border/50 hover:border-border">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold line-clamp-1 group-hover:text-primary transition-colors">
                {notebook.name}
              </CardTitle>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={handleOpen} className="cursor-pointer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <CardDescription className="text-sm text-muted-foreground line-clamp-2">
          {notebook.content
            ? notebook.content.substring(0, 100) +
              (notebook.content.length > 100 ? "..." : "")
            : "No content available"}
        </CardDescription>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Updated {formatDate(notebook.updatedAt)}</span>
          </div>
          <Badge variant="secondary" className="text-xs">
            Notebook
          </Badge>
        </div>
      </CardFooter>

      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </Card>
  );
}
