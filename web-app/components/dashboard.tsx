import AddNotebookCard from "@/components/add-notebook-card";
import { DialogDemo } from "./addnotebook-dialog";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-black">
      <div className="flex flex-col items-center justify-center w-full p-4">
        <h1 className="text-2xl text-white mb-6">Dashboard</h1>
        <AddNotebookCard />
        <DialogDemo />
      </div>
    </div>
  );
}
