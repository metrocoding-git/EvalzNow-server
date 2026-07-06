'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X, RefreshCw, FolderOutput } from 'lucide-react';
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
  Label
} from 'recharts';
import PropertyEditor from '../../components/PropertyEditor';
import NeuroObject from './NeuroObject';

export default function PlotSelections({ activeChart, setActiveChart }) {
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


  const neuroToolsTable = [
    { index: 1, ppId: 1, value: 'Yes' },
    { index: 2, ppId: 2, value: 'Yes' },
    { index: 3, ppId: 3, value: 'No' },
    { index: 4, ppId: 4, value: 'No' },
    { index: 5, ppId: 5, value: 'Yes' },
    { index: 6, ppId: 6, value: 'No' },
    { index: 7, ppId: 7, value: 'Yes' },

  ]

  const indicatorsData = [
    { ppId: 1, target: 'Proficiency', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 1, target: 'Growth', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 2, target: 'Proficiency', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 2, target: 'Growth', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 3, target: 'Proficiency', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 3, target: 'Growth', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 4, target: 'Proficiency', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
    { ppId: 4, target: 'Growth', RMS1: '', RMS2: '', RMS3: '', RMS4: '', RMS5: '', RMS6: '', RMS7: '', RMS8: '' },
  ]

  const loadsData = [
    { ppId: 1, target: 'Proficiency', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 1, target: 'Growth', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 2, target: 'Proficiency', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 2, target: 'Growth', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 3, target: 'Proficiency', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 3, target: 'Growth', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 4, target: 'Proficiency', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
    { ppId: 4, target: 'Growth', Cognitive1: '', Cognitive2: '', Cognitive3: '', Cognitive4: '', Cognitive5: '', Cognitive6: '', Cognitive7: '', Cognitive8: '' },
  ]

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
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] = useState('Neuro Tools Table');


  const canvasRef = useRef(null);

  // Example line chart data
  const data = [
    { name: 'A', uv: 400, pv: 240 },
    { name: 'B', uv: 300, pv: 139 },
    { name: 'C', uv: 200, pv: 980 },
  ];


  const entities = [
    {
      name: " Neuro Tools Table",
      type: "table",
      id: "1"
    },
    {
      name: "Neuro-Indicator Trends for Proficiency - RMS (L) - Frontal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "2"
    },
    {
      name: "Neuro-Indicator Trends for Proficiency - RMS (L) - Occipital Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "3"
    },
    {
      name: "Neuro-Indicator Trends for Proficiency - RMS (L) - Parietal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "4"
    },
    {
      name: "Neuro-Indicator Trends for Proficiency - RMS (L) - Temporal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "5"
    },
    {
      name: " Neuro-Indicator Trends for Proficiency - RMS (R) - Frontal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "6"
    }, {
      name: "Neuro-Indicator Trends for Proficiency - RMS (R) - Occipital Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "7"
    }, {
      name: "Neuro-Indicator Trends for Proficiency - RMS (R) - Parietal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "8"
    }, {
      name: "Neuro-Indicator Trends for Proficiency - RMS (R) - Temporal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "9"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (L) - Frontal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "10"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (L) - Occipital Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "11"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (L) - Parietal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "12"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (L) - Temporal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "13"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (R) - Frontal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "14"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (R) - Occipital Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "15"
    }, {
      name: "Neuro-Indicator Trends for Growth - RMS (R) - Parietal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "16"
    }, {
      name: " Neuro-Indicator Trends for Growth - RMS (R) - Temporal Lobe vs. PP ID (Line Graphs below)",
      type: "chart",
      id: "17"
    },
  ];

  const [selectedChart, setSelectedChart] = useState(entities[0]);

  const [selectedNeuroTools, setSelectedNeuroTools] = useState(1);

  const [showNeuroObject, setShowNeuroObject] = useState(false);

  const handlePlusClick = () => setShowNeuroObject(true);
  const handleCloseNeuroObject = () => setShowNeuroObject(false);



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

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center relative">
        <span className='pl-2 text-md'>Entity Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
        {showNeuroObject && (
          <div className="absolute top-0 left-0 z-50 w-[500px] h-[400px] bg-white shadow-2xl border border-gray-200 rounded-md">
            <NeuroObject onClose={handleCloseNeuroObject} />
          </div>
        )}
      </h2>

      <div className="flex h-full w-full my-2">
        <div className={`${activeChart ? "w-6/12 " : "w-full"}  flex flex-col border-2 h-full border-gray-200 p-1`}>
          <div className="flex items-center justify-between px-1 mx-1 text-gray-700">
            <h2 className="text-sm font-semibold">Tables & Plots</h2>
            <div className="flex items-center gap-2">
              <button onClick={handlePlusClick} title="Add Neuro Object" className="text-red-600 hover:text-red-800 cursor-pointer">
                <Plus className="w-4 h-4 hover:text-blue-600" />
              </button>
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
                  <div className="col-span-10 px-1 py-1 text-left">Entities</div>
                  <div className="col-span-2  py-1 text-left">ID</div>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                  {/* 
                  {entities.map((chart) => (
                    <div
                      key={chart.id} // Use id instead of index
                      className="grid grid-cols-12 items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-100 cursor-pointer"
                      onClick={() => setSelectedChart(chart)}
                    >
                      {chart.type === "table" && <div className="col-span-9 text-xs text-gray-700 truncate">📑{chart.name}</div>}
                      {chart.type === "chart" && <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>}
                      <div className="col-span-3 pl-3 text-xs text-gray-400">{chart.id}</div>
                    </div>
                  ))} */}
                  {entities.map((item, index) => (
                    <div
                      key={index}
                      className={`grid grid-cols-12 hover:bg-gray-200 cursor-pointer ${selectedChart.name === item.name ? "bg-gray-100" : ""}`}
                      onClick={() => {
                        setSelectedChart(item);
                        if (item.type === "chart") {
                          setActiveChart(true);
                          setActiveAdjustPropertieTab("Table");
                        } else {
                          setActiveChart(false);
                          setActiveAdjustPropertieTab("Neuro Tools Table");
                        }

                      }}
                    >
                      <div className="col-span-10 px-2 py-1 whitespace-nowrap text-sm">
                        <div className="flex items-center">
                          {item.type === "table" && <div className="col-span-9 text-xs text-gray-700 truncate">📑 {item.name}</div>}
                          {item.type === "chart" && <div className="col-span-9 text-xs text-gray-700 truncate">📉 {item.name}</div>}
                        </div>
                      </div>
                      <div className="col-span-2 px-3 py-1 whitespace-nowrap text-sm">
                        {item.id}
                      </div>
                    </div>
                  ))}


                </div>
              </div>
            </div>


            <div className="h-1/2 flex flex-col border border-gray-200">


              {/* Tab Buttons */}
              <div className="flex space-x-2 border-b p-2">
                {activeChart && (
                  <>
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
                  </>
                )}
                {!activeChart && (
                  <>

                    <button
                      className={`px-3 py-1 text-sm cursor-pointer ${activeAdjustPropertieTab === 'Neuro Tools Table'
                        ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                        }`}
                      onClick={() => setActiveAdjustPropertieTab('Neuro Tools Table')}
                    >
                      Neuro Tools Table
                    </button>
                    <button
                      className={`px-3 py-1 text-sm cursor-pointer ${activeAdjustPropertieTab === 'Indicators'
                        ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                        }`}
                      onClick={() => setActiveAdjustPropertieTab('Indicators')}
                    >
                      Indicators
                    </button>
                    <button
                      className={`px-3 py-1 text-sm  cursor-pointer ${activeAdjustPropertieTab === 'Loads'
                        ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                        }`}
                      onClick={() => setActiveAdjustPropertieTab('Loads')}
                    >
                      Loads
                    </button>
                  </>
                )}

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


                {activeAdjustPropertieTab === 'Neuro Tools Table' && (
                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto">
                    <table className="table-auto w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">PP ID</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Form Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {neuroToolsTable.map((row, idx) => (
                          <tr
                            key={idx}
                            className={`hover:bg-gray-200 cursor-pointer ${selectedNeuroTools === row.index ? "bg-gray-100" : ""
                              }`}
                            onClick={() => setSelectedNeuroTools(row.index)}
                          >
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.ppId}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.value}</td>
                          </tr>
                        ))}
                      </tbody>

                    </table>
                  </div>
                )}


                {activeAdjustPropertieTab === 'Indicators' && (

                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto">
                    <table className="table-auto w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">PP ID Callout</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Target</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Frontal Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Occipital Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Parietal Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Temporal Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Frontal Lobe ®</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Occipital Lobe ®</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Parietal Lobe ®</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">RMS - Temporal Lobe ®</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indicatorsData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50">
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.ppId}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.target}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS1}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS2}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS3}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS4}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS5}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS6}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS7}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.RMS8}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}


                {activeAdjustPropertieTab === 'Loads' && (
                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto">
                    <table className="table-auto w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">PP ID Callout</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Target</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Frontal Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Occipital Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Parietal Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Temporal Lobe (L)</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Frontal Lobe ®</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Occipital Lobe ®</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Parietal Lobe ®</th>
                          <th className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">Cognitive Load - Temporal Lobe ®</th>
                        </tr>
                      </thead>
                      <tbody>
                        {indicatorsData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50">
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.ppId}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.target}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive1}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive2}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive3}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive4}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive5}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive6}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive7}</td>
                            <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">{row.Cognitive8}</td>
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

        {activeChart && (
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
        )}


      </div>








    </>
  );
}
