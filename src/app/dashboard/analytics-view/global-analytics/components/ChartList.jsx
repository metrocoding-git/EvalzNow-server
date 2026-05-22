"use client";

import { FaChartPie } from "react-icons/fa"; // for pie chart icon

export default function ChartList({ selectedChart, onSelect }) {
  const charts = [
    "Global Signature Case Profile Percentages (Pie Chart)",
    "Global Unit Type Percentages (Pie Chart)",
    "Global Candidate-to-Leader Percentages (Pie Chart)",
    "Global Benchmark Count Percentages (Pie Chart)",
    "Global Assessment Block Count Percentages (Pie Chart)",
    "Global Attendance Percentages (Pie Chart)",
    "Global Open Action Item Percentages (Pie Chart)",
    "Global Percentage of Positive Candidate Marks (Pie Chart)",
    "Global Percentage of Positive Leader Marks (Pie Chart)",
    "Global Unit Outcome Passing Percentages (Pie Chart)",
    "Global Percentages of Average Equivalent Proficiency - XEP (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XRR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XLR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XWR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XSR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XTR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XPR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XRVSR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XPVSR (Pie Chart)",
    "Global Percentages of Average Unilateral Proficiency  - XAVSR (Pie Chart)",
    "Global Percentages of Average Composite Proficiency - XCP (Pie Chart)",
    "Global Percentages of Average Band Proficiency - XBP (Pie Chart)",
    "Global Percentages of Stability in Proficiency - STA/P (Pie Chart)",
    "Global Percentages of Average Butler Interaction Proficiency - MSIP (Pie Chart)",
    "Global Percentages of Average Interaction Class - IC (Pie Chart)",
    "Global Percentages of Equivalent Growth - GEQ (Pie Chart)",
    "Global Percentages of Average Growth - ∆RR (Pie Chart)",
    "Global Percentages of Average Growth - ∆PR (Pie Chart)",
    "Global Percentages of Average Growth - ∆AR (Pie Chart)",
    "Global Percentages of Cumulative Growth - ∆RR (Pie Chart)",
    "Global Percentages of Cumulative Growth - ∆PR (Pie Chart)",
    "Global Percentages of Cumulative Growth - ∆AR (Pie Chart)",
    "Global Percentages of Stability in Growth - STA/G (Pie Chart)",
    "Global Percentages of Utilization Rates (Pie Chart)",
  ];

  return (
    <div className="w-1/3 max-h-[90vh] border rounded-xl p-4 bg-white shadow-md overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
      <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b pb-2">
        📊 Available Charts
      </h2>
      <ul className="space-y-2">
        {charts.map((chart) => (
          <li
            key={chart}
            className={`flex items-center gap-2 cursor-pointer px-3 py-2 rounded-lg transition duration-200 ease-in-out text-sm ${
              selectedChart === chart
                ? "bg-blue-100 text-blue-800 font-medium shadow-sm"
                : "hover:bg-gray-100 text-gray-800"
            }`}
            onClick={() => onSelect(chart)}
          >
            <FaChartPie className="text-blue-500 shrink-0" />
            <span>{chart}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
