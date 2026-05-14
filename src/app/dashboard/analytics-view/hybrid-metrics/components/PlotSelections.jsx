'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X, RefreshCw, FolderOutput } from 'lucide-react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import PropertyEditor from '../../components/PropertyEditor';

export default function PlotSelections({ selectedSort, onInteractionClassSelect }) {
  const [curves, setCurves] = useState([{ id: 1, name: 'curve1' }, { id: 2, name: 'curve2' }, { id: 3, name: 'curve3' }, { id: 4, name: 'curve4' }, { id: 5, name: 'curve5' }, { id: 6, name: 'curve6' }, { id: 7, name: 'curve7' }, { id: 8, name: 'curve8' }, { id: 9, name: 'curve9' }, { id: 10, name: 'curve10' }, { id: 11, name: 'curve11' }, { id: 12, name: 'curve12' },]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);

  const [ScoreAdd, setScoreAdd] = useState(false);
  const [isSelectedInteractionClass, setIsSelectedInteractionClass] = useState(false);

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
      name: "Interaction Class (IC) vs. PP ID",
      icon: "🔀",
      type: "line", // Separate lines for -PP IDs and +PP IDs
      id: "1"
    },
    {
      name: "PR vs. RR Cross Plot",
      icon: "📊",
      type: "scatter-2d",
      id: "2"
    },
    {
      name: "AR vs. RR Cross Plot",
      icon: "📊",
      type: "scatter-2d",
      id: "3"
    },
    {
      name: "PR vs. AR Cross Plot",
      icon: "📊",
      type: "scatter-2d",
      id: "4"
    },
    {
      name: "AR vs. PR vs. RR Cross Plot",
      icon: "📈",
      type: "scatter-3d", // Z, Y, X
      id: "5"
    },
  ];


  const activateUnitLevel = [
    {
      name: "Interaction Class (IC) vs. PP ID",
      icon: "🔀",
      type: "line", // Separate lines for -PP IDs and +PP IDs
      id: "1"
    },
    {
      name: "PR vs. RR Cross Plot",
      icon: "📊",
      type: "scatter-2d",
      id: "2",
    },
    {
      name: "AR vs. RR Cross Plot",
      icon: "📊",
      type: "scatter-2d",
      id: "3"
    },
    {
      name: "PR vs. AR Cross Plot",
      icon: "📊",
      type: "scatter-2d",
      id: "4"
    },
    {
      name: "AR vs. PR vs. RR Cross Plot",
      icon: "📈",
      type: "scatter-3d", // Z, Y, X
      id: "5"
    },
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

  const handleChartSelect = (chart) => {
    setSelectedChart(chart);

    if (chart.name === "Interaction Class (IC) vs. PP ID") {
      setIsSelectedInteractionClass(true);
      onInteractionClassSelect?.(true); // ✅ notify parent
    } else {
      setIsSelectedInteractionClass(false);
      onInteractionClassSelect?.(false);
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

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center">
        <span className='pl-2 text-md'>Plot Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>
      <div className="flex h-full w-full my-2">
        <div className='w-6/12 lg:w-4/12 flex flex-col border-2 h-full border-gray-200 p-1'>
            <div className="flex items-center justify-between px-1 mx-1 text-gray-700">
              <h2 className="text-sm font-semibold">Plots</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowCreateMaterial(true)} title="Create Reset" className='text-blue-600 hover:text-blue-800 cursor-pointer'>
                <RefreshCw className="w-4 h-4 hover:text-green-600" onClick={() => setScoreAdd(true)} />
              </button>
              <button onClick={handleDeleteCurve} title="Export" className='text-red-600 hover:text-red-800 cursor-pointer'>
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
                  <div className="col-span-3  py-1 text-left">ID</div>
                </div>
                
                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                  {selectedSort === 'activateCandidateLevel' ? (
                    activateCandidateLevel.map((chart) => (
                      <div
                        key={chart.id} // Use id instead of index
                        className="grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleChartSelect(chart)}
                      >
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-3 pl-3 text-xs text-gray-400">{chart.id}</div>
                      </div>
                    ))
                  ) : selectedSort === 'activateUnitLevel' ? (
                    activateUnitLevel.map((chart) => (
                      <div
                        key={chart.id} // Use id instead of index
                        className="grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleChartSelect(chart)}
                      >
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-3 pl-3 text-xs text-gray-400">{chart.id}</div>
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
                  className={`px-3 py-1 text-sm cursor-pointer ${activeAdjustPropertieTab === 'Property editor'
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
                          <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">Month</th>
                           <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">X Axis Value</th>
                           <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">Y Axis Value</th>
                           <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">Z Axis Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {floatChartData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50">
                            <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">{row.name}</td>
                            <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">{row.xValue}</td>
                            <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">{row.yValue}</td>
                            <td className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">{row.zValue}</td>
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
            {selectedChart ? `${selectedChart.icon} ${selectedChart.name}` : 'Select a plot'}
          </h2>

          <div className="h-full overflow-auto m-5">
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
          </div>
        </div>
      </div>








    </>
  );
}
