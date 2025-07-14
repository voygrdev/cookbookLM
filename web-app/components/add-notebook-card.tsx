import { Card } from "@/components/ui/card";
import { MdAdd } from "react-icons/md";

export default function AddNotebookCard() {
  return (
    <Card className="flex flex-col w-full max-w-sm h-72 items-center justify-center p-6 bg-neutral-900 text-white border-dashed border-2 border-neutral-700 hover:border-neutral-500 transition-all cursor-pointer hover:shadow-xl hover:shadow-purple-500/20">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <MdAdd className="text-white text-3xl" />
      </div>
      <p className="text-neutral-400 mt-2">Click to add a new notebook</p>
    </Card>
  );
}
