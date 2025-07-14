import AddNotebookCard from "@/components/add-notebook-card";
import { DialogDemo } from "./addnotebook-dialog";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-black p-8">
      <div className="flex flex-col items-center justify-center w-full">
        <h1 className="text-4xl font-bold text-white mb-12">Dashboard</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full">
          <AddNotebookCard />
        </div>
        <DialogDemo />
      </div>
    </div>
  );
}
