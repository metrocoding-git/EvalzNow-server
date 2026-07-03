import { Upload, X } from 'lucide-react';

const InputArea = ({ onClose }) => {
  return (
    <div className="h-full border-2 border-blue-500 rounded-md  flex flex-col">
      <div className="flex justify-between items-center bg-blue-100 px-4 py-2 border-b border-blue-300">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <Upload className="w-5 h-5" />
          INPUT AREA
        </div>
        <button onClick={onClose}>
          <X className="w-4 h-4 text-blue-600" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="border-2 border-dashed border-blue-300 rounded-lg w-full h-full flex items-center justify-center">
          <p className="text-blue-600 text-center">Input content here</p>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
