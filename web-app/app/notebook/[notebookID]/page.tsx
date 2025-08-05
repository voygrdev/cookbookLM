import ModernChat from "@/components/modern-chat";
import Header from "@/components/header";
import ModernUploadFiles from "@/components/modern-upload-files";
import Notes from "@/components/notes";

interface NotebookPageProps {
  params: Promise<{
    notebookID: string;
  }>;
}

export default async function NotebookSlug({ params }: NotebookPageProps) {
  const { notebookID } = await params;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar for upload */}
        <div className="w-80 border-r border-border flex flex-col overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold mb-0">Upload Documents</h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <ModernUploadFiles notebookId={notebookID} />
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 overflow-hidden">
          <ModernChat notebookId={notebookID} />
        </div>

        {/* Right sidebar for notes - 25% of screen width */}
        <div className="w-1/4 min-w-[300px] border-l border-border flex flex-col overflow-hidden">
          <Notes notebookId={notebookID} />
        </div>
      </div>
    </div>
  );
}
