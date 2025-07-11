import { Card } from "@/components/ui/card";
import { MdAdd } from "react-icons/md";

export default function AddNotebookCard() {
  return (
    <Card className="flex flex-col w-48 h-72 items-center justify-center p-6 bg-neutral-900 text-white border-dashed border-neutral-300 hover:shadow-lg transition-shadow cursor-pointer">
      <div className="bg-neutral-500 rounded-full w-16 h-16 flex items-center justify-center mb-4">
        <MdAdd className="text-gray-800 text-3xl" />
      </div>
    </Card>
  );
}
