"use client";
import { useState } from "react";
import RibbonPanel from "./RibbonPanel";

export default function TopRibbon({ activeTab,
  setActiveTab,
  activeButton,
  setActiveButton,}) {
  

  const tabs = [
    { label: "Files" },
    { label: "Edit" },
    { label: "Sketch" },
    { label: "Topology" },
    { label: "Assembly" },
    { label: "Connectors" },
    { label: "Morph" },
    { label: "Model" },
    { label: "Validate" },
    { label: "Analyze" },
    { label: "Optimize" },
  ];

  const handleTabClick = (index) => {
    setActiveTab(index);
  };

  return (
    <div className="w-full bg-white border-b shadow-sm text-sm font-medium">
      {/* Tabs row */}
      {/* <div className="px-1 py-1 flex items-center gap-2">
        {tabs.map((tab, i) => (
          <div
            key={i}
            onClick={() => handleTabClick(i)}
            className={`cursor-pointer px-2 py-2 rounded-md transition-all ${
              activeTab === i
                ? "bg-blue-100 text-blue-600 border border-blue-200 shadow-sm"
                : "hover:bg-gray-100 text-gray-700 hover:text-gray-900"
            }`}
          >
            {tab.label}
          </div>
        ))}
      </div> */}

      {/* Panel row for current tab */}
      <RibbonPanel
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      activeButton={activeButton}
      setActiveButton={setActiveButton}
    />
    </div>
  );
}
