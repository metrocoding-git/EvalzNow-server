"use client";
import { useState } from "react";
import InputArea from "./InputArea";
import EditorArea from "./EditorArea";

const tabs = ["Model", "Session", "Components", "Materials"];

export default function MainTabs() {
  const [activeTab, setActiveTab] = useState("Model");
  const [showInput, setShowInput] = useState(true);
  const [showEditor, setShowEditor] = useState(true);


  return (
    <div className="flex flex-col h-screen border-b bg-gray-100 text-black">
      {/* Tab buttons */}


      <div className="flex space-x-0 px-0 pt-2 border-b border-gray-200 bg-gray-50 ">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              relative px-5 py-2 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer ` +
              activeTab === tab
                ? "text-blue-600 bg-white border border-b-transparent border-gray-300 rounded-t-lg shadow-sm"
                : "text-gray-500 hover:text-blue-600  border-t border-r border-b-transparent border-gray-300 rounded-t-lg hover:bg-white" 
            }
          >
            {tab}

            {/* Active tab underline indicator */}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-t-md" />
            )}
          </button>
        ))}
      </div>


      {/* Active tab content */}
      <div className="flex-1 overflow-auto bg-white border border-t-0 border-gray-300 p-2">
        {activeTab === "Model" && (
          <div className="flex flex-col h-full">
            {/* Input Area */}
            {showInput && (
              <div className="h-1/2 overflow-auto my-2">
                <InputArea onClose={() => setShowInput(false)} />
              </div>
            )}

            {/* Editor Area */}
            {showEditor && (
              <div className="h-1/2 overflow-auto my-2">
                <EditorArea onClose={() => setShowEditor(false)} />
              </div>
            )}
          </div>
        )}
        {activeTab === "Session" && (
          <div className="flex flex-col h-full">
            {/* Input Area */}
            {showInput && (
              <div className="h-2/4 overflow-auto my-2">
                <InputArea onClose={() => setShowInput(false)} />
              </div>
            )}

            {/* Editor Area */}
            {showEditor && (
              <div className="h-1/4 overflow-auto my-2">
                <EditorArea onClose={() => setShowEditor(false)} />
              </div>
            )}

            {/* Editor Area */}
            {showEditor && (
              <div className="h-1/4 overflow-auto my-2">
                <EditorArea onClose={() => setShowEditor(false)} />
              </div>
            )}
          </div>
        )}
        {activeTab === "Components" && (
          <div className="flex flex-col h-full">
            {/* Input Area */}
            {showInput && (
              <div className="h-2/2 overflow-auto">
                <InputArea onClose={() => setShowInput(false)} />
              </div>
            )}
          </div>
        )}
        {activeTab === "Materials" && (
          <div className="flex flex-col h-full">
            {/* Input Area */}
            {showInput && (
              <div className="h-2/2 overflow-auto">
                <InputArea onClose={() => setShowInput(false)} />
              </div>
            )}
          </div>
        )}
      </div>




    </div>
  );
}
