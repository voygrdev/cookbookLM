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
    <div className="h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col overflow-hidden">
      <Header />
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar for upload */}
        <div className="w-80 border-r border-slate-700/50 flex flex-col overflow-hidden bg-slate-900/70 backdrop-blur-sm">
          <div className="p-6 border-b border-slate-700/50">
            <h2 className="text-lg font-semibold mb-0 text-white">
              Upload Documents
            </h2>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
            <ModernUploadFiles notebookId={notebookID} />
          </div>
        </div>

        {/* Main chat area */}
        <div className="flex-1 overflow-hidden bg-slate-950/70">
          <ModernChat notebookId={notebookID} />
        </div>

        {/* Right sidebar for notes - 25% of screen width */}
        <div className="w-1/4 min-w-[300px] border-l border-slate-700/50 flex flex-col overflow-hidden bg-slate-900/70 backdrop-blur-sm">
          <Notes notebookId={notebookID} />
        </div>
      </div>
    </div>
  );
}
