'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X } from 'lucide-react';
import ScoringCriteria from './ScoringCriteria';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

export default function CurveEditor() {
  const [curves, setCurves] = useState([{ id: 1, name: 'curve1' }, { id: 2, name: 'curve2' }, { id: 3, name: 'curve3' }, { id: 4, name: 'curve4' }, { id: 5, name: 'curve5' }, { id: 6, name: 'curve6' }, { id: 7, name: 'curve7' }, { id: 8, name: 'curve8' }, { id: 9, name: 'curve9' }, { id: 10, name: 'curve10' }, { id: 11, name: 'curve11' }, { id: 12, name: 'curve12' },]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);

  const [ScoreAdd, setScoreAdd] = useState(false);

  const floatChartData = [
    { name: "Jan", xValue: 1.2, yValue: 2.1, zValue: 0.9 },
    { name: "Feb", xValue: 2.8, yValue: 1.4, zValue: 1.6 },
    { name: "Mar", xValue: 1.5, yValue: 2.9, zValue: 2.2 },
    { name: "Apr", xValue: 3.1, yValue: 3.0, zValue: 2.7 },
    { name: "May", xValue: 2.0, yValue: 1.8, zValue: 3.1 },
    { name: "Jun", xValue: 2.6, yValue: 2.2, zValue: 3.4 },
  ];

  const [points, setPoints] = useState(
    Array.from({ length: 10 }, () => ({ x: '', y: '' }))
  );
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('IndirectPerformancePoint');
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] = useState('Table');


  const canvasRef = useRef(null);

  // Example line chart data
  const data = [
    { name: "Completed", value: 400 },
    { name: "In Progress", value: 300 },
    { name: "Pending", value: 200 },
  ];

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28"];

  const chart = [
    { id: 1, name: "Global Signature Case Profile Percentages", icon: "🥧", type: "pie" },
    { id: 2, name: "Global Unit Type Percentages", icon: "🥧", type: "pie" },
    { id: 3, name: "Global Candidate-to-Leader Percentages", icon: "🥧", type: "pie" },
    { id: 4, name: "Global Benchmark Count Percentages", icon: "🥧", type: "pie" },
    { id: 5, name: "Global Assessment Block Count Percentages", icon: "🥧", type: "pie" },
    { id: 6, name: "Global Attendance Percentages", icon: "🥧", type: "pie" },
    { id: 7, name: "Global Open Action Item Percentages", icon: "🥧", type: "pie" },
    { id: 8, name: "Global Percentage of Positive Candidate Marks", icon: "🥧", type: "pie" },
    { id: 9, name: "Global Percentage of Positive Leader Marks", icon: "🥧", type: "pie" },
    { id: 10, name: "Global Unit Outcome Passing Percentages", icon: "🥧", type: "pie" },
    { id: 11, name: "Global Percentages of Average Equivalent Proficiency - XEP", icon: "🥧", type: "pie" },
    { id: 12, name: "Global Percentages of Average Unilateral Proficiency - XRR", icon: "🥧", type: "pie" },
    { id: 13, name: "Global Percentages of Average Unilateral Proficiency - XLR", icon: "🥧", type: "pie" },
    { id: 14, name: "Global Percentages of Average Unilateral Proficiency - XWR", icon: "🥧", type: "pie" },
    { id: 15, name: "Global Percentages of Average Unilateral Proficiency - XSR", icon: "🥧", type: "pie" },
    { id: 16, name: "Global Percentages of Average Unilateral Proficiency - XTR", icon: "🥧", type: "pie" },
    { id: 17, name: "Global Percentages of Average Unilateral Proficiency - XPR", icon: "🥧", type: "pie" },
    { id: 18, name: "Global Percentages of Average Unilateral Proficiency - XRVSR", icon: "🥧", type: "pie" },
    { id: 19, name: "Global Percentages of Average Unilateral Proficiency - XPVSR", icon: "🥧", type: "pie" },
    { id: 20, name: "Global Percentages of Average Unilateral Proficiency - XAVSR", icon: "🥧", type: "pie" },
    { id: 21, name: "Global Percentages of Average Composite Proficiency - XCP", icon: "🥧", type: "pie" },
    { id: 22, name: "Global Percentages of Average Band Proficiency - XBP", icon: "🥧", type: "pie" },
    { id: 23, name: "Global Percentages of Stability in Proficiency - STA/P", icon: "🥧", type: "pie" },
    { id: 24, name: "Global Percentages of Average Butler Interaction Proficiency - MSIP", icon: "🥧", type: "pie" },
    { id: 25, name: "Global Percentages of Average Interaction Class - IC", icon: "🥧", type: "pie" },
    { id: 26, name: "Global Percentages of Equivalent Growth - GEQ", icon: "🥧", type: "pie" },
    { id: 27, name: "Global Percentages of Average Growth - ∆RR", icon: "🥧", type: "pie" },
    { id: 28, name: "Global Percentages of Average Growth - ∆PR", icon: "🥧", type: "pie" },
    { id: 29, name: "Global Percentages of Average Growth - ∆AR", icon: "🥧", type: "pie" },
    { id: 30, name: "Global Percentages of Cumulative Growth - ∆RR", icon: "🥧", type: "pie" },
    { id: 31, name: "Global Percentages of Cumulative Growth - ∆PR", icon: "🥧", type: "pie" },
    { id: 32, name: "Global Percentages of Cumulative Growth - ∆AR", icon: "🥧", type: "pie" },
    { id: 33, name: "Global Percentages of Stability in Growth - STA/G", icon: "🥧", type: "pie" },
    { id: 34, name: "Global Percentages of Utilization Rates", icon: "🥧", type: "pie" },
    { id: 35, name: "Shared Global Analytics Index Table", icon: "🥧", type: "table" }
  ];
  

  const [selectedChart, setSelectedChart] = useState(chart[0]);

  const [selectedRow, setSelectedRow] = useState(null);

  if (!visible) return null;


  const metricRows = [
    "Global Percentage of Case 1 Profiles",
    "Global Percentage of Case 2 Profiles",
    "Global Percentage of Case 3a Profiles",
    "Global Percentage of Case 3b Profiles",
    "Global Percentage of CI/CO",
    "Global Percentage of T&P",
    "Global Percentage of Third Parameter",
    "Global Percentage of Units with Candidate-to-Leader Ratio, CTL ≤ 20",
    "Global Percentage of Units with Candidate-to-Leader Ratio, 20 < CTL ≤ 30",
    "Global Percentage of Units with Candidate-to-Leader Ratio, CTL > 30",
    "Global Percentage of Benchmark Counts, BC ≤ 10",
    "Global Percentage of Benchmark Counts, 10 < BC ≤ 25",
    "Global Percentage of Benchmark Counts, BC > 25",
  ];

  // Initialize table state
  const [tableData, setTableData] = useState(
    metricRows.map((metric) => ({
      metricDescription: metric,
      metricValue: '',
      assignedWeight: '',
      metricWeight: '',
    }))
  );



  const renderChartContent = () => {
    if (!selectedChart) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-500">Select a plot from the list</p>
        </div>
      );
    }


    if (selectedChart.type === "table") {
      return (
        <div className="text-sm text-gray-600 mt-2 w-full overflow-auto">
          <table className="table-auto w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-3 py-2 text-left">Metric Descriptions</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Metric Values</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Assigned Weights</th>
                <th className="border border-gray-300 px-3 py-2 text-left">Metric Weights</th>
              </tr>
            </thead>
            <tbody>
              {metricRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-blue-50">
                  <td className="border border-gray-300 px-3 py-2">{row}</td>
                  <td className="border border-gray-300 px-3 py-2"></td>
                  <td className="border border-gray-300 px-3 py-2"> </td>
                  <td className="border border-gray-300 px-3 py-2"></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      // Render chart for all other types
      return (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }
  }

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center">
        <span className='pl-2 text-md'>Plot Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>
      <div className="flex h-full w-full my-2">
        <div className='w-6/12 lg:w-3/12 flex flex-col border-2 h-full border-gray-200  p-1'>
          <div className="flex items-center justify-between mb-3 px-1 mx-1 mt-1 text-gray-700 ">
            <h2 className="text-sm font-semibold">Plots</h2>

          </div>

          <div className=" h-full overflow-hidden w-full my-2">
            <div className="h-full flex flex-col border border-gray-200">
              <div className="flex-1 overflow-auto p-1">
                {/* Fixed Header */}
                <div className="grid grid-cols-12 bg-gray-100 text-gray-600 sticky top-0 z-10 text-sm border-b border-gray-200">
                 
                  <div className="col-span-10 px-1 py-1 text-left">Entities</div>
                 
                  <div className="col-span-2 py-1 text-left">ID</div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                  {chart.map((item) => (
                    <div
                      key={item.id}
                      className={`grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 ${selectedRow === item.id ? "bg-blue-100 font-medium" : ""} cursor-pointer`}
                      onClick={() => {
                        setSelectedChart(item);
                        setSelectedRow(item.id);
                      }}
                    >
                     
                      <div className="col-span-10 text-xs text-gray-700 truncate">🧭 {item.name}</div>
                    
                      <div className="col-span-2 pl-3 text-xs text-gray-400">{item.id}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-6/12 lg:w-9/12 flex flex-col border-2 h-full border-gray-200  bg-gray-100 ml-1">
          <div className="h-full overflow-auto m-5">
            <h2 className="text-lg text-center font-semibold text-gray-700 mb-4">{selectedChart.name}</h2>
            
            <div className="h-full overflow-auto m-5">
              {renderChartContent()}
            </div>
          </div>
        </div>
      </div>






      {ScoreAdd && (
        <div className="overflow-auto my-2">
          <ScoringCriteria onClose={() => setScoreAdd(false)} />
        </div>
      )}

    </>
  );
}
