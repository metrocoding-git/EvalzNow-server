'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X, RefreshCw, FolderOutput } from 'lucide-react';
import ScoringCriteria from './ScoringCriteria';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
  Label,
  ScatterChart,
  Scatter,
  PieChart,
  Pie,
  ReferenceLine,
  Cell
} from 'recharts';
import PropertyEditor from '../../components/PropertyEditor';
import { getUnitAndCandidateSummary, getUnitAndMultipleCandidateSummary } from '@/services/tabulationTableService';
import { getUnitById } from '@/services/unitService';

export default function PlotSelections({ selectedSort, unitId, candidateId, unitType, filters, onResetFilters}) {
  const [curves, setCurves] = useState([{ id: 1, name: 'curve1' }, { id: 2, name: 'curve2' }, { id: 3, name: 'curve3' }, { id: 4, name: 'curve4' }, { id: 5, name: 'curve5' }, { id: 6, name: 'curve6' }, { id: 7, name: 'curve7' }, { id: 8, name: 'curve8' }, { id: 9, name: 'curve9' }, { id: 10, name: 'curve10' }, { id: 11, name: 'curve11' }, { id: 12, name: 'curve12' },]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [ScoreAdd, setScoreAdd] = useState(false);

  const floatChartData = [
    { name: "Jan", xValue: 1.2, yValue: 2.1, zValue: 0.9 },
    { name: "Feb", xValue: 2.8, yValue: 1.4, zValue: 1.6 },
    { name: "Mar", xValue: 1.5, yValue: 2.9, zValue: 2.2 },
    { name: "Apr", xValue: 3.1, yValue: 3.0, zValue: 2.7 },
    { name: "May", xValue: 2.0, yValue: 1.8, zValue: 3.1 },
    { name: "Jun", xValue: 2.6, yValue: 2.2, zValue: 3.4 },
  ];

  const [stabilitySummary, setStabilitySummary] = useState({ stable: 0, unstable: 0 });

  const [points, setPoints] = useState(
    Array.from({ length: 10 }, () => ({ x: '', y: '' }))
  );
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('IndirectPerformancePoint');
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] = useState('Table');

  const [selectedChart, setSelectedChart] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [thresholdValue, setThresholdValue] = useState(null);

  const canvasRef = useRef(null);

  // Example line chart data
  const data = [
    { name: 'A', uv: 400, pv: 240 },
    { name: 'B', uv: 300, pv: 139 },
    { name: 'C', uv: 200, pv: 980 },
  ];

  const unitTypeCharts = {
    communicativeIO: [
      "Reading Ratio (XRR)",
      "Listening Ratio (XLR)",
      "Speaking Ratio (XSR)",
      "Writing Ratio (XWR)",
    ],
    theoryPractice: [
      "Theory-Based Ratio (XTR)",
      "Practical Ratio (XPR)",
    ],
    thirdParameter: [
      "Receptive Variable Score Ratio (XRVSR)",
      "Productive Variable Score Ratio (XPVSR)",
      "Acuity Variable Score Ratio (XAVSR)",
    ],
  };
  
  
  const activateCandidateLevel = [
    { id: "1", name: "Equivalent Proficiency (XEP)", icon: "📈", type: "line" },
    // { id: "2", name: "Unilateral Proficiency (XBP)", icon: "📈", type: "line" },
    { id: "2", name: "Reading Ratio (XRR)", icon: "📘", type: "line"  },
    { id: "3", name: "Listening Ratio (XLR)", icon: "🎧", type: "line" },
    { id: "4", name: "Speaking Ratio (XSR)", icon: "🎤", type: "line" },
    { id: "5", name: "Writing Ratio (XWR)", icon: "✍️", type: "line" },
    { id: "6", name: "Theory-Based Ratio (XTR)", icon: "📚", type: "line" },
    { id: "7", name: "Practical Ratio (XPR)", icon: "🛠️", type: "line" },
    { id: "8", name: "Receptive Variable Score Ratio (XRVSR)", icon: "📥", type: "line" },
    { id: "9", name: "Productive Variable Score Ratio (XPVSR)", icon: "📤", type: "line" },
    { id: "10", name: "Acuity Variable Score Ratio (XAVSR)", icon: "🧠", type: "line" },
    { id: "11", name: "Composite Proficiency (XCP)", icon: "🧩", type: "line" },
    { id: "12", name: "Band Proficiency (XBP)", icon: "🎼", type: "line" },
    { id: "13", name: "Butler Interaction Proficiency (MSIP)", icon: "🤝", type: "line" },
    { id: "14", name: "Stability in Proficiency (STAP)", icon: "🧭", type: "pie" },
  ];

  const activateUnitLevel = [
    { id: "1", name: "Equivalent Proficiency (XEP)", icon: "📊", type: "scatter" },
    // { id: "2", name: "Unilateral Proficiency (XBP)", icon: "📊", type: "scatter" },
    { id: "2", name: "Reading Ratio (XRR)", icon: "📘", type: "scatter" },
    { id: "3", name: "Listening Ratio (XLR)", icon: "🎧", type: "scatter" },
    { id: "4", name: "Speaking Ratio (XSR)", icon: "🎤", type: "scatter" },
    { id: "5", name: "Writing Ratio (XWR)", icon: "✍️", type: "scatter" },
    { id: "6", name: "Theory-Based Ratio (XTR)", icon: "📚", type: "scatter" },
    { id: "7", name: "Practical Ratio (XPR)", icon: "🛠️", type: "scatter" },
    { id: "8", name: "Receptive Variable Score Ratio (XRVSR)", icon: "📥", type: "scatter" },
    { id: "9", name: "Productive Variable Score Ratio (XPVSR)", icon: "📤", type: "scatter" },
    { id: "10", name: "Acuity Variable Score Ratio (XAVSR)", icon: "🧠", type: "scatter" },
    { id: "11", name: "Composite Proficiency (XCP)", icon: "🧩", type: "scatter" },
    { id: "12", name: "Band Proficiency (XBP)", icon: "🎼", type: "scatter" },
    { id: "13", name: "Butler Interaction Proficiency (MSIP)", icon: "🤝", type: "scatter" },
    { id: "14", name: "Stability in Proficiency (STAP)", icon: "🧭", type: "pie" },
  ];
  
  const [chartProperties, setChartProperties] = useState({
  // Standard
  positiveVisibility: true,
  negativeVisibility: true,
  layer: 1,
  reference: false,

  // Curve Label
  showLabel: true,
  labelType: "X Type",
  // showLabelPrefix: false,
  // labelPrefix: "X File name",
  // showLabelSuffix: false,
  // labelSuffix: "Y subcase",

  // Line Attribute
  lineStyle: "solid",
  lineColor: "#3b82f6",
  lineThickness: 2,

  // Symbol Attribute
  symbolStyle: "circle",
  symbolColor: "#3b82f6",
  positiveSymbolColor: "#10b981", // Separate symbol color for positive
  negativeSymbolColor: "#ef4444",
  symbolFrequency: 1,
  symbolScaleSize: 3,

  // Shade area
  shadeArea: "#ffffff",
  positiveLineColor: "#10b981", // Green for positive
  negativeLineColor: "#ef4444",
});

console.log("candidate IdS::", candidateId);
useEffect(() => {
  const fetchTabulationData = async () => {
    if (!unitId || !candidateId) {
      setTableData([]); // clear previous table data
      setStabilitySummary({ stable: 0, unstable: 0 });
      return;
    }

    console.log("logging data::-> ", filters);
    setLoading(true);
    setError(null);
    try {
      const data = await getUnitAndMultipleCandidateSummary({
        unitId: unitId,
        candidate_id: candidateId,       // make sure filters contains candidate_id
        ppIdFrom: filters?.ppIdFrom ?? undefined,    
        ppIdTo: filters?.ppIdTo ?? undefined,
        criticalRefDateFrom: filters?.criticalDateFrom ?? undefined,
        criticalRefDateTo: filters?.criticalDateTo ?? undefined
      });


      const { results, average, stdDev, stdErr } = data;  

      const formattedData = results.map(row => ({
        ppId: row.ppId,
        XEP: row.XEP || 0,
        XBP: row.XBP || 0,
        XRR: row.XRR || 0,
        XLR: row.XLR || 0,
        XSR: row.XSR || 0,
        XWR: row.XWR || 0,
        XTR: row.XTR || 0,
        XPR: row.XPR || 0,
        XRVSR: row.XRVSR || 0,
        XPVSR: row.XPVSR || 0,
        XAVSR: row.XAVSR || 0,
        XCP: row.XCP || 0,
        MSIP: row.MSIP || 0, 
        STAP: row.STAP || 0,
      }));
      
      
      setTableData(formattedData);

      // ✅ Calculate stability counts
      const stableCount = results.filter(r => r.STAP === "STABLE").length;
      const unstableCount = results.filter(r => r.STAP === "UNSTABLE").length;

      setStabilitySummary({ stable: stableCount, unstable: unstableCount });

      console.log("✅ Stability Summary:", { stable: stableCount, unstable: unstableCount });
      
    } catch (err) {
      console.error("Failed to fetch tabulation data:", err);
      setError("Failed to load table data.");
      setStabilitySummary({ stable: 0, unstable: 0 });
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  fetchTabulationData();
}, [unitId, candidateId, filters]);

useEffect(() => {
  const fetchThreshold = async () => {
    if (!unitId) {
      setThresholdValue(null);
      return;
    }

    try {
      const data = await getUnitById(unitId);

      // Safely extract only threshold ratio fields
      const extractedThresholds = {
        XEP: parseFloat(data?.XEP) ?? null,
        XRR: parseFloat(data?.XRR) ?? null,
        XLR: parseFloat(data?.XLR) ?? null,
        XSR: parseFloat(data?.XSR) ?? null,
        XWR: parseFloat(data?.XWR) ?? null,
        XTR: parseFloat(data?.XTR) ?? null,
        XPR: parseFloat(data?.XPR) ?? null,
        XRVSR: parseFloat(data?.XRVSR) ?? null,
        XPVSR: parseFloat(data?.XPVSR) ?? null,
        XAVSR: parseFloat(data?.XAVSR) ?? null,
        XCP: parseFloat(data?.XCP) ?? null,
        XBP: parseFloat(data?.XBP) ?? null,
        MSIP: parseFloat(data?.MSIP) ?? null,
      };

      setThresholdValue(extractedThresholds);

      console.log("✅ Extracted Threshold Values:", extractedThresholds);
    } catch (error) {
      console.error("❌ Failed to fetch threshold values:", error);
      setThresholdValue(null);
    }
  };

  fetchThreshold();
}, [unitId]);



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

  console.log("unit type: ", unitType);

  // ✅ Sort and prepare chart data
const sortedTableData = [...tableData].sort((a, b) => {
  if (isNaN(a.ppId)) return 1;
  if (isNaN(b.ppId)) return -1;

  if (a.ppId < 0 && b.ppId < 0) return b.ppId - a.ppId; // both negative → descending
  if (a.ppId > 0 && b.ppId > 0) return a.ppId - b.ppId; // both positive → ascending
  if (a.ppId < 0 && b.ppId > 0) return -1; // negatives before positives
  if (a.ppId > 0 && b.ppId < 0) return 1;
  return 0;
});

// ✅ Prepare data for the selected chart
let chartData = [];
if (selectedChart && sortedTableData.length > 0) {
  const keyName = selectedChart.name.match(/\((.*?)\)/)?.[1]; // extract "XEP" etc.
  if (keyName) {
    chartData = sortedTableData.map(row => ({
      ppId: row.ppId,
      value: row[keyName],
    }));
  }
}


// Function to render dot based on symbol style
const renderCustomDot = (props, color) => {
  const { cx, cy } = props;
  const r = chartProperties.symbolScaleSize;

  switch (chartProperties.symbolStyle) {
    case "square":
      return (
        <rect
          x={cx - r}
          y={cy - r}
          width={2 * r}
          height={2 * r}
          fill={color}
        />
      );
    case "triangle":
      return (
        <polygon
          points={`${cx},${cy - r} ${cx - r},${cy + r} ${cx + r},${cy + r}`}
          fill={color}
        />
      );
    case "diamond":
      return (
        <polygon
          points={`${cx},${cy - r} ${cx - r},${cy} ${cx},${cy + r} ${cx + r},${cy}`}
          fill={color}
        />
      );
    default:
      return (
        <circle
          cx={cx}
          cy={cy}
          r={r}
          fill={color}
        />
      );
  }
};


  if (!visible) return null;

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center">
        <span className="pl-2 text-md">Plot Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>
      <div className="flex h-full w-full my-2 mx-1">
        <div className='w-6/12 lg:w-4/12 flex flex-col border-2 h-full border-gray-200  p-1'>
          <div className="flex items-center justify-between px-1 mx-1 text-gray-700">
            <h2 className="text-sm font-semibold">Plots</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => {
                  if (typeof onResetFilters === "function") {
                    onResetFilters(); // ✅ reset filters in parent
                  }
                  // setScoreAdd(true); 
                }}
                title="Create Material" className='text-blue-600 hover:text-blue-800 cursor-pointer'>
                <RefreshCw className="w-4 h-4 hover:text-green-600" />
              </button>
              <button onClick={handleDeleteCurve} title="Delete Curve" className='text-red-600 hover:text-red-800 cursor-pointer'>
                <FolderOutput className="w-4 h-4 hover:text-blue-600" />
              </button>

            </div>
          </div>

          <div className="h-full overflow-hidden w-full my-2">
            <div className="h-1/2 flex flex-col border border-gray-200">
              <div className="flex-1 overflow-auto">
                {/* Fixed Header */}
                <div className="grid grid-cols-12 bg-gray-100 text-gray-600 sticky top-0 z-10 text-sm border-b border-gray-200">
                  
                  <div className="col-span-9 px-1 py-1 text-left">Entities</div>
                  <div className="col-span-3  py-1 text-left">ID</div>
                </div>
                
                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                  {selectedSort === 'activateCandidateLevel' && (
                    activateCandidateLevel.filter(chart => {
                      // Common charts for all
                      const commonCharts = ["Equivalent Proficiency (XEP)", "Unilateral Proficiency (XBP)", "Composite Proficiency (XCP)", "Band Proficiency (XBP)", "Butler Interaction Proficiency (MSIP)", "Stability in Proficiency (STAP)"];
                      if (commonCharts.includes(chart.name)) return true;
              
                      // Unit-specific charts
                      if (unitType === "Communicative I/O") {
                        return unitTypeCharts.communicativeIO.includes(chart.name);
                      }
                      if (unitType === "Theory & Practice") {
                        return unitTypeCharts.theoryPractice.includes(chart.name);
                      }
                      if (unitType === "Third Parameter") {
                        return unitTypeCharts.thirdParameter.includes(chart.name);
                      }
              
                      return false;
                    }).map((chart, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-12 items-center gap-2 px-2 py-1 cursor-pointer
                          ${selectedChart?.name === chart.name ? "bg-gray-100" : "hover:bg-gray-200"} `}
                        onClick={() => {
                          setSelectedChart(chart);
                        }}
                      >
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-3 pl-3 text-xs text-gray-400">{index + 1}</div>
                      </div>
                    ))
                  )}
                  {selectedSort === 'activateUnitLevel' && (
                    activateUnitLevel.filter(chart => {
                      // Common charts for all
                      const commonCharts = ["Equivalent Proficiency (XEP)", "Unilateral Proficiency (XBP)", "Composite Proficiency (XCP)", "Band Proficiency (BXP)", "Butler Interaction Proficiency (MSIP)", "Stability in Proficiency (STAP)"];
                      if (commonCharts.includes(chart.name)) return true;
              
                      // Unit-specific charts
                      if (unitType === "Communicative I/O") {
                        return unitTypeCharts.communicativeIO.includes(chart.name);
                      }
                      if (unitType === "Theory & Practice") {
                        return unitTypeCharts.theoryPractice.includes(chart.name);
                      }
                      if (unitType === "Third Parameter") {
                        return unitTypeCharts.thirdParameter.includes(chart.name);
                      }
              
                      return false;
                    }).map((chart, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer 
                          ${selectedChart?.name === chart.name ? "bg-gray-100" : "hover:bg-gray-200"}`}
                        onClick={() => {
                          setSelectedChart(chart); 
                        }}
                      >
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-3 pl-3 text-xs text-gray-400">{index + 1}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="h-1/2 flex flex-col border border-gray-200">
              {/* Tab Buttons */}
              <div className="flex space-x-2 border-b p-2">
                <button
                  className={`px-3 py-1 text-sm  cursor-pointer ${activeAdjustPropertieTab === "Property editor"
                      ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 border-t border-r border-b-transparent border-gray-300 hover:bg-white"
                    }`}
                  onClick={() => setActiveAdjustPropertieTab("Property editor")}
                >
                  Property editor
                </button>
                <button
                  className={`px-3 py-1 text-sm  cursor-pointer ${activeAdjustPropertieTab === "Table"
                      ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 border-t border-r border-b-transparent border-gray-300 hover:bg-white"
                    }`}
                  onClick={() => setActiveAdjustPropertieTab("Table")}
                >
                  Table
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-auto p-2 h-full mb-8">
                {activeAdjustPropertieTab === "Property editor" && (
                  <PropertyEditor
                    properties={chartProperties}
                    onChange={setChartProperties}
                  />
                )}

                {activeAdjustPropertieTab === "Table" && (
                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto min-h-50 mb-10 pb-3 space-y-10">

                    {/* ✅ Positive PP IDs Table */}
                    <div>
                      <h3 className="text-gray-400 font-semibold mb-2 ml-2">Positive PP IDs</h3>
                      <table className="table-auto w-full text-sm border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                              PP Id / Label
                            </th>
                            <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                              X Axis Value
                            </th>
                            <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                              {selectedChart?.name?.match(/\(([^)]+)\)/)?.[1] || selectedChart?.name}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.filter(row => row.ppId > 0).length > 0 ? (
                            chartData
                              .filter(row => row.ppId > 0)
                              .map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50">
                                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                    {row.ppId}
                                  </td>
                                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                    {row.ppId} {/* X Axis */}
                                  </td>
                                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                    {row.value}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="text-center text-gray-500 border border-gray-300 px-3 py-2"
                              >
                                No positive data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* ✅ Negative PP IDs Table */}
                    <div>
                      <h3 className="text-gray-400 font-semibold mb-2 ml-2">Negative PP IDs</h3>
                      <table className="table-auto w-full text-sm border border-gray-300">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                              PP Id / Label
                            </th>
                            <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                              X Axis Value
                            </th>
                            <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                              {selectedChart?.name?.match(/\(([^)]+)\)/)?.[1] || selectedChart?.name}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {chartData.filter(row => row.ppId < 0).length > 0 ? (
                            chartData
                              .filter(row => row.ppId < 0)
                              .map((row, idx) => (
                                <tr key={idx} className="hover:bg-blue-50">
                                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                    {row.ppId}
                                  </td>
                                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                    {row.ppId} {/* X Axis */}
                                  </td>
                                  <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                    {row.value}
                                  </td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="text-center text-gray-500 border border-gray-300 px-3 py-2"
                              >
                                No negative data available
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}

              </div>
            </div>
          </div>
        </div>

        <div className="w-6/12 lg:w-9/12 flex flex-col border-2 h-full border-gray-200  bg-gray-100 ml-1 " >
          <div className="h-full overflow-auto m-5">
            {/* <h2 className="text-lg text-center font-semibold text-gray-700 mb-4">
              {selectedChart ? `${selectedChart.icon} ${selectedChart.name}` : 'Select a plot'}
            </h2> */}
            {/* <h2 className="text-lg text-center font-semibold text-gray-700 mb-4"></h2>{selectedChart.icon} {selectedChart.name} </h2> */}
            
            {/* 📊 DYNAMIC CHART SECTION */}
            <div className="space-y-8">
              {selectedChart ? (
                (() => {
                  const keyName = selectedChart.name.match(/\((.*?)\)/)?.[1];
                  if (!keyName) return <div className="text-gray-500">Invalid chart selection</div>;

                  // Split data into positive and negative ppIds
                  const negativeData = [...tableData]
                    .filter(row => row.ppId < 0 && !isNaN(row[keyName]))
                    .sort((a, b) => b.ppId - a.ppId)
                    .map(row => ({ ppId: row.ppId, value: row[keyName] }));

                  const positiveData = [...tableData]
                    .filter(row => row.ppId > 0 && !isNaN(row[keyName]))
                    .sort((a, b) => a.ppId - b.ppId)
                    .map(row => ({ ppId: row.ppId, value: row[keyName] }));

                  // ✅ Render a combined chart with both datasets
                  if (selectedChart.type === "line") {
                    // Skip rendering if visibility is false
                    // if (!chartProperties.visibility) {
                    //   return (
                    //     <div className="text-gray-400 italic text-center">
                    //       Chart visibility is turned off
                    //     </div>
                    //   );
                    // }
                  
                    // Determine stroke style based on lineStyle
                    const strokeDasharray =
                      chartProperties.lineStyle === "dashed"
                        ? "6 4"
                        : chartProperties.lineStyle === "dotted"
                        ? "2 4"
                        : "0";
                    
                  
                    return (
                      <div className="p-4 bg-white rounded-xl shadow-sm" style={{ backgroundColor: chartProperties.shadeArea }}>
                        <h2 className="text-lg font-semibold mb-2 text-center">
                          {selectedChart.icon} {selectedChart.name}
                        </h2>
                        <ResponsiveContainer width="100%" height={400}>
                          <LineChart margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              dataKey="ppId"
                              domain={["auto", "auto"]}
                            >
                              {(chartProperties.showLabel || chartProperties.labelType !== "X Type") && (
                              <Label value={`PP ID`} offset={-10} position="insideBottom" />
                            )}
                            </XAxis>
                            <YAxis
                              // label={{
                              //   value: selectedChart.name,
                              //   angle: -90,
                              //   position: "insideLeft",
                              // }}
                            >
                              {(chartProperties.showLabel || chartProperties.labelType !== "Y Type") && (
                                <Label
                                  value={`${selectedChart.name} (Y)`}
                                  angle={-90}
                                  position="insideLeft"
                                  offset={10}
                                  dy={90}
                                />
                              )}
                            </YAxis>
                            <Tooltip />
                            <Legend />

                            {thresholdValue && keyName && filters?.thresholdEnabled === true && thresholdValue[keyName] !== null && (
                              <ReferenceLine
                                y={thresholdValue[keyName]}
                                stroke="#000000"        // Amber (you can change this)
                                strokeWidth={2}
                                strokeDasharray="7 4 1 4"
                                label={{
                                  // value: `Threshold (${keyName}: ${thresholdValue[keyName]})`,
                                  position: "right",
                                  fill: "#f59e0b",
                                  fontSize: 12,
                                }}
                              />
                            )}
                  
                            {/* 🔴 Negative PP IDs */}
                            {chartProperties.negativeVisibility && (
                              <Line
                                name="Negative PP IDs"
                                type="linear"
                                dataKey="value"
                                data={negativeData}
                                stroke={chartProperties.negativeLineColor}
                                strokeDasharray={
                                  chartProperties.negativeLineStyle === "dashed"
                                    ? "6 4"
                                    : chartProperties.negativeLineStyle === "dotted"
                                    ? "2 4"
                                    : chartProperties.negativeLineStyle === "dashdot"
                                    ? "8 4 2 4"
                                    : "0"
                                }
                                strokeWidth={chartProperties.negativeLineThickness}
                                dot={(props) => {
                                  const { index } = props;
                                  if (index % chartProperties.symbolFrequency !== 0) return null;
                                  return renderCustomDot(props, chartProperties.symbolColor);
                                }}
                                // activeDot={getSymbolShape(chartProperties.symbolStyle)}
                                // shape={getSymbolShape(chartProperties.symbolStyle)} 
                              />
                            )}

                            {/* 🔵 Positive PP IDs */}
                            {chartProperties.positiveVisibility && (
                              <Line
                                name="Positive PP IDs"
                                type="linear"
                                dataKey="value"
                                data={positiveData}
                                stroke={chartProperties.positiveLineColor}
                                strokeDasharray={
                                  chartProperties.positiveLineStyle === "dashed"
                                    ? "6 4"
                                    : chartProperties.positiveLineStyle === "dotted"
                                    ? "2 4"
                                    : chartProperties.positiveLineStyle === "dashdot"
                                    ? "8 4 2 4"
                                    : "0"
                                }
                                strokeWidth={chartProperties.positiveLineThickness}
                                dot={(props) => {
                                  const { index } = props;
                                  if (index % chartProperties.symbolFrequency !== 0) return null;
                                  return renderCustomDot(props, chartProperties.symbolColor);
                                }}
                                // activeDot={getSymbolShape(chartProperties.symbolStyle)}
                                // shape={getSymbolShape(chartProperties.symbolStyle)} 
                              />
                            )}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }
                  

                  if (selectedChart.type === "scatter") {
                    return (
                      <div className="p-4 bg-white rounded-xl shadow-sm" style={{ backgroundColor: chartProperties.shadeArea }}>
                        <h2 className="text-lg font-semibold mb-2 text-center">{selectedChart.name}</h2>
                        <ResponsiveContainer width="100%" height={400}>
                          <ScatterChart margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" dataKey="ppId" name="PP ID" >
                              {(chartProperties.showLabel || chartProperties.labelType !== "X Type") && (
                                <Label value={`PP ID`} offset={-10} position="insideBottom" />
                              )}
                            </XAxis>
                            <YAxis type="number" dataKey="value" name={selectedChart.name}>
                              {(chartProperties.showLabel || chartProperties.labelType !== "Y Type") && (
                                <Label
                                  value={`${selectedChart.name} (Y)`}
                                  angle={-90}
                                  position="insideLeft"
                                  offset={10}
                                  dy={90}
                                />
                              )}
                            </YAxis>
                            <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                            <Legend />
                            <Scatter
                              name="Negative PP IDs"
                              data={negativeData}
                              fill={chartProperties.negativeLineColor} // red
                              shape={(props) => renderCustomDot(props, chartProperties.negativeLineColor)}
                            />
                            <Scatter
                              name="Positive PP IDs"
                              data={positiveData}
                              fill={chartProperties.positiveLineColor} // blue
                              shape={(props) => renderCustomDot(props, chartProperties.positiveLineColor)}
                            />
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }

                  if (selectedChart.type === "pie" && selectedChart.name.includes("Stability")) {
                    // Create data from stabilitySummary state
                    const pieData = [
                      { name: "STABLE", value: stabilitySummary.stable },
                      { name: "UNSTABLE", value: stabilitySummary.unstable },
                    ];
                  
                    return (
                      <div className="p-4 bg-white rounded-xl shadow-sm">
                        <h2 className="text-lg font-semibold mb-2 text-center">{selectedChart.name}</h2>
                  
                        <ResponsiveContainer width="100%" height={400}>
                          <PieChart>
                            <Tooltip />
                            <Legend verticalAlign="bottom" />
                            <Pie
                              data={pieData}
                              dataKey="value"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={120}
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              <Cell key="stable" fill="#10b981" />   {/* Green for Stable */}
                              <Cell key="unstable" fill="#ef4444" /> {/* Red for Unstable */}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }
                  

                  return <div className="text-gray-500">Unsupported chart type</div>;
                })()
              ) : (
                <div className="flex justify-center items-center h-full text-gray-400 text-lg">
                  Select a plot to visualize
                </div>
              )}
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
