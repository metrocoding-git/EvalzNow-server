"use client";
import { useState } from "react";
import IndicatorTable from "./IndicatorTable";
import LoadTable from "./LoadTable";
import LineChart from "./LineChart";

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState("Indicators");

  return (
    <div className="p-4 border bg-white shadow-md rounded-md w-full">
      <div className="flex border-b mb-4">
        {["Indicators", "Loads"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold ${
              activeTab === tab ? "border-b-2 border-gray-600 text-blue-600" : "text-gray-600"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Indicators" ? (
        <>
          <h2 className="text-xl font-bold mb-2">Neuro Indicators Table</h2>
          <IndicatorTable />
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">Neuro-Indicator Trends for Proficiency</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* You will pass each RMS label to this chart component */}
              <LineChart title="RMS (L) - Frontal Lobe vs. PP ID" />
              <LineChart title="RMS (L) - Occipital Lobe vs. PP ID" />
              {/* Add all 8 charts here */}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">Neuro-Indicator Trends for Growth</h3>
            <div className="grid grid-cols-2 gap-4">
              {/* Add 8 more charts for growth */}
              <LineChart title="RMS (R) - Frontal Lobe vs. PP ID" />
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold mb-2">Cognitive Load Table</h2>
          <LoadTable />
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">PP ID Range Plot</h3>
            <LineChart title="PP ID Range Plot" />
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-1">Critical Reference Date Plot</h3>
            <LineChart title="Critical Reference Date Plot" />
          </div>
        </>
      )}
    </div>
  );
}
