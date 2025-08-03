import ChatWindow from "@/components/chat";

interface NotebookPageProps {
  params: Promise<{
    notebookID: string;
  }>;
}

export default async function NotebookSlug({ params }: NotebookPageProps) {
  const { notebookID } = await params;

  return (
    <div className="flex flex-row h-screen bg-black">
      <ChatWindow notebookId={notebookID} />
    </div>
  );
}
