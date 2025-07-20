import ChatWindow from "@/components/chat";
import LayoutThree from "@/components/layout-three";
import UploadCard from "@/components/upload-files";

export default function NotebookSlug() {
  return (
    <div className="flex flex-row  h-screen bg-black">
      <UploadCard />
      <ChatWindow />
      <LayoutThree />
    </div>

  );
}

