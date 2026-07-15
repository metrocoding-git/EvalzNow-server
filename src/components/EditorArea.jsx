import { Edit, X } from 'lucide-react';

const EditorArea = ({ onClose }) => {
  return (
    <div className="h-full border-2 border-blue-500 rounded-md flex flex-col">
      <div className="flex justify-between items-center bg-blue-100 px-4 py-2 border-b border-blue-300">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <Edit className="w-5 h-5" />
          EDITOR AREA
        </div>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-blue-600" />
        </button>
      </div>
      <div className="flex-1 p-3 bg-gray-50">
        <textarea
          className="w-full h-full resize-none border-none outline-none bg-transparent"
          placeholder="Edit content here..."
        />
      </div>
    </div>
  );
};

export default EditorArea;
