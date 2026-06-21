'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X, RefreshCw, FolderOutput } from 'lucide-react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import PropertyEditor from '../../components/PropertyEditor';

export default function PlotSelections({ selectedSort }) {
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

  const [chartProperties, setChartProperties] = useState({
  // Standard
  visibility: true,
  layer: 1,
  reference: false,

  // Curve Label
  showLabel: false,
  labelType: "X Type",
  showLabelPrefix: false,
  labelPrefix: "X File name",
  showLabelSuffix: false,
  labelSuffix: "Y subcase",

  // Line Attribute
  lineStyle: "solid",
  lineColor: "#3b82f6",
  lineThickness: 2,

  // Symbol Attribute
  symbolStyle: "circle",
  symbolColor: "#3b82f6",
  symbolFrequency: 1,
  symbolScaleSize: 1,

  // Shade area
  shadeArea: "#ffffff",
});


  const [points, setPoints] = useState(
    Array.from({ length: 10 }, () => ({ x: '', y: '' }))
  );
  const [visible, setVisible] = useState(true);
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] = useState('Table');


  const canvasRef = useRef(null);

  // Example line chart data
  const data = [
    { name: 'A', uv: 400, pv: 240 },
    { name: 'B', uv: 300, pv: 139 },
    { name: 'C', uv: 200, pv: 980 },
  ];

  const [selectedChart, setSelectedChart] = useState(null);

  const activateCandidateLevel = [
    {
      name: "Butler Equivalency CSD - Accumulated Time (Days) vs. PP ID",
      icon: "📈",
      type: "multi-line",
      id: 1
    },
    {
      name: "Actual Tenure Period (Days) vs. PP ID",
      icon: "📊",
      type: "scatter-2d",
      id: 2
    },
    {
      name: "Effective Work Count (Days) vs. PP ID",
      icon: "📊",
      type: "scatter-2d",
      id: 3
    },
    {
      name: "Butler Equivalency USD - Accumulated Time (Days) vs. PP ID",
      icon: "📈",
      type: "multi-line",
      id: 4
    },
    {
      name: "Actual Tenure Period (Days) vs. PP ID",
      icon: "📊",
      type: "scatter-2d",
      id: 5
    },
    {
      name: "Effective Work Count (Days) vs. PP ID",
      icon: "📊",
      type: "scatter-2d",
      id: 6
    },
    {
      name: "Butler Productivity CSD - Productivity Rates vs. PP ID",
      icon: "📈",
      type: "line",
      id: 7
    },
    {
      name: "Butler Productivity USD - Productivity Rates vs. PP ID",
      icon: "📈",
      type: "line",
      id: 8
    },
    {
      name: "Attendance Tracking",
      icon: "🥧",
      type: "pie",
      id: 9
    },
    {
      name: "Engagement Tracking",
      icon: "🥧",
      type: "pie",
      id: 10
    },
  
    // 👉 Added table-based items for Candidate Level
    {
      name: "Needs Assessment Table",
      icon: "📑",
      type: "table",
      id: 11
    },
    {
      name: "Needs Assessment Chains",
      icon: "🔗",
      type: "table",
      id: 12
    },
    {
      name: "Task Declarations",
      icon: "📝",
      type: "table",
      id: 13
    },
    {
      name: "Candidate Marks",
      icon: "✅",
      type: "table",
      id: 14
    }
  ];
  
  const activateUnitLevel = [
    {
      name: "Butler Productivity CSD - Productivity Rates vs. PP ID",
      icon: "📊",
      type: "scatter-2d",
      id: 1
    },
    {
      name: "Butler Productivity USD - Productivity Rates vs. PP ID",
      icon: "📊",
      type: "scatter-2d",
      id: 2
    },
    {
      name: "Attendance Tracking",
      icon: "🥧",
      type: "pie",
      id: 3
    },
    {
      name: "Engagement Tracking",
      icon: "🥧",
      type: "pie",
      id: 4
    },
    {
      name: "Unit Outcomes",
      icon: "🥧",
      type: "pie",
      id: 5
    },
    {
      name: "Needs Assessment Tracking",
      icon: "🥧",
      type: "pie",
      id: 6
    },
  
    {
      name: "Unit Improvements & Optimization",
      icon: "⚙️",
      type: "table",
      id: 7
    },
    {
      name: "Leader Marks",
      icon: "⭐",
      type: "table",
      id: 8
    }
  ];
  



  const copyToClipboard = async () => {
    if (!canvasRef.current) return;

    const blob = await html2image.toBlob(canvasRef.current);
    if (blob) {
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob }),
      ]);
      alert("Chart copied to clipboard!");
    }
  };



  const handleDeleteCurve = () => {
    const updated = curves.filter((c) => c.id !== selectedCurveId);
    setCurves(updated);
    if (updated.length > 0) {
      setSelectedCurveId(updated[0].id);
    } else {
      setSelectedCurveId(null);
    }
  };

  if (!visible) return null;


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
                <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Entry</th>
                <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Impact Type</th>
                <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Concern Identified</th>
                <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Identity Date</th>
                <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Concern Resolved</th>
                <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Resolution Date</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((num) => (
                <tr key={num} className="hover:bg-blue-50">
                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{num}</td>
                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Type {num}</td>
                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Concern {num}</td>
                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">2025-08-0{num}</td>
                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{num % 2 === 0 ? "Yes" : "No"}</td>
                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                    {num % 2 === 0 ? `2025-08-1${num}` : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else {
      // Render chart for all other types
      return (
        <ResponsiveContainer width="100%" height="95%">
          <LineChart data={floatChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name">
              <Label value="Time Period (X)" offset={-10} position="insideBottom" />
            </XAxis>
            <YAxis>
              <Label
                value="Score / Value (Y/Z)"
                angle={-90}
                position="insideLeft"
                offset={10}
              />
            </YAxis>
            <Tooltip />
            <Legend verticalAlign="top" />
            <Line
              type="monotone"
              dataKey="xValue"
              name="X Axis Value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot
            />
            <Line
              type="monotone"
              dataKey="yValue"
              name="Y Axis Value"
              stroke="#10b981"
              strokeWidth={2}
              dot
            />
            <Line
              type="monotone"
              dataKey="zValue"
              name="Z Axis Value"
              stroke="#f59e0b"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center">
        <span className='pl-2 text-md'>Plot Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>
      <div className="flex h-full w-full my-2">
        <div className='w-6/12 lg:w-4/12 flex flex-col border-2 h-full border-gray-200  p-1'>
            <div className="flex items-center justify-between px-1 mx-1 text-gray-700">
              <h2 className="text-sm font-semibold">Plots</h2>
            <div className="flex items-center gap-2">
              
              <button onClick={() => setShowCreateMaterial(true)} title="Create Material" className='text-blue-600 hover:text-blue-800 cursor-pointer'>
                <RefreshCw className="w-4 h-4 hover:text-green-600" onClick={() => setScoreAdd(true)} />
              </button>
              <button onClick={handleDeleteCurve} title="Delete Curve" className='text-red-600 hover:text-red-800 cursor-pointer'>
                <FolderOutput className="w-4 h-4 hover:text-blue-600" />
              </button>
              
            </div>
          </div>

          <div className=" h-full overflow-hidden w-full my-2">
          <div className="h-1/2 flex flex-col border border-gray-200">
              <div className="flex-1 overflow-auto p-1">
                {/* Fixed Header */}
                <div className="grid grid-cols-12 bg-gray-100 text-gray-600 sticky top-0 z-10 text-sm border-b border-gray-200">
                 
                  <div className="col-span-9 px-1 py-1 text-left">Entities</div>
                  
                  <div className="col-span-2  py-1 text-left">ID</div>
                </div>
                
                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                  {selectedSort === 'activateCandidateLevel' ? (
                    activateCandidateLevel.map((chart) => (
                      <div
                        key={chart.id} // Use id instead of index
                        className="grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedChart(chart)}
                      >
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-2 pl-3 text-xs text-gray-400">{chart.id}</div>
                      </div>
                    ))
                  ) : selectedSort === 'activateUnitLevel' ? (
                    activateUnitLevel.map((chart) => (
                      <div
                        key={chart.id} // Use id instead of index
                        className="grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => setSelectedChart(chart)}
                      >
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-2 pl-3 text-xs text-gray-400">{chart.id}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-sm text-gray-500">
                      No data available for this selection
                    </div>
                  )}
                </div>
              </div>
            </div>
         

            <div className="h-1/2 flex flex-col border border-gray-200">
              {/* Tab Buttons */}
              <div className="flex space-x-2 border-b p-2">
                <button
                  className={`px-3 py-1 text-sm  cursor-pointer ${activeAdjustPropertieTab === 'Property editor'
                    ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                    }`}
                  onClick={() => setActiveAdjustPropertieTab('Property editor')}
                >
                  Property editor
                </button>
                <button
                  className={`px-3 py-1 text-sm  cursor-pointer ${activeAdjustPropertieTab === 'Table'
                    ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                    }`}
                  onClick={() => setActiveAdjustPropertieTab('Table')}
                >
                  Table
                </button>

              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-2 h-full">
                {activeAdjustPropertieTab === 'Property editor' && (
                  <PropertyEditor
                    properties={chartProperties}
                    onChange={setChartProperties}
                  />
                )}

                {activeAdjustPropertieTab === 'Table' && (

                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto">
                    <table className="table-auto w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Month</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">X Axis Value</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Y Axis Value</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Z Axis Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floatChartData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50">
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.name}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.xValue}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.yValue}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.zValue}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>


                )}


              </div>
            </div>
          </div>
        </div>

        <div className="w-6/12 lg:w-9/12 flex flex-col border-2 h-full border-gray-200  bg-gray-100 ml-1">

          <h2 className="text-lg text-center font-semibold text-gray-700 mb-4">
            {selectedChart ? `${selectedChart.name}` : 'Select a plot'}
          </h2>

          <div className="h-full overflow-auto m-5">
            {renderChartContent()}
          </div>
        </div>
      </div>








    </>
  );
}
