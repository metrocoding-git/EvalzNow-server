'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X, RefreshCw, FolderOutput, Undo2 } from 'lucide-react';

import IndicatorTable from "./IndicatorTable";
import LoadTable from "./LoadTable";

import PropertyEditor from '../../components/PropertyEditor';
import NeuroObject from './NeuroObject';
import { CartesianGrid, Label, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function CurveEditor({activeAdjustPropertieTab, setActiveAdjustPropertieTab}) {
  const [curves, setCurves] = useState([
    { id: 1, name: 'curve1' }, { id: 2, name: 'curve2' }, { id: 3, name: 'curve3' },
    { id: 4, name: 'curve4' }, { id: 5, name: 'curve1' }, { id: 6, name: 'curve2' },
    { id: 16, name: 'curve3' }, { id: 15, name: 'curve4' }, { id: 14, name: 'curve5' },
    { id: 13, name: 'curve6' }, { id: 7, name: 'curve7' }, { id: 8, name: 'curve8' },
    { id: 9, name: 'curve9' }, { id: 10, name: 'curve10' }, { id: 11, name: 'curve11' },
    { id: 12, name: 'curve12' },
  ]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);

  const [ScoreAdd, setScoreAdd] = useState(false);
  const [showBackButton, setShowBackButton] = useState(false);

  const floatChartData = [
    { name: "Jan", xValue: 1.2, yValue: 2.1, zValue: 0.9 },
    { name: "Feb", xValue: 2.8, yValue: 1.4, zValue: 1.6 },
    { name: "Mar", xValue: 1.5, yValue: 2.9, zValue: 2.2 },
    { name: "Apr", xValue: 3.1, yValue: 3.0, zValue: 2.7 },
    { name: "May", xValue: 2.0, yValue: 1.8, zValue: 3.1 },
    { name: "Jun", xValue: 2.6, yValue: 2.2, zValue: 3.4 },
  ];

  const [points, setPoints] = useState(Array.from({ length: 10 }, () => ({ x: '', y: '' })));
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState('IndirectPerformancePoint');
  const [showNeuroObject, setShowNeuroObject] = useState(false);

  const canvasRef = useRef(null);

  const [chartProperties, setChartProperties] = useState({
    visibility: true,
    layer: 1,
    reference: false,
    showLabel: false,
    labelType: "X Type",
    showLabelPrefix: false,
    labelPrefix: "X File name",
    showLabelSuffix: false,
    labelSuffix: "Y subcase",
    lineStyle: "solid",
    lineColor: "#3b82f6",
    lineThickness: 2,
    symbolStyle: "circle",
    symbolColor: "#3b82f6",
    symbolFrequency: 1,
    symbolScaleSize: 1,
    shadeArea: "#ffffff",
  });

  const indicators = [
    {
      category: "Neuro-Indicator Trends for Proficiency",
      items: [
        { id: "rms_l_frontal", label: "Proficiency RMS (L) - Frontal Lobe vs. PP ID" },
        { id: "rms_l_occipital", label: "Proficiency RMS (L) - Occipital Lobe vs. PP ID" },
        { id: "rms_l_parietal", label: "Proficiency RMS (L) - Parietal Lobe vs. PP ID" },
        { id: "rms_l_temporal", label: "Proficiency RMS (L) - Temporal Lobe vs. PP ID" },
        { id: "rms_r_frontal", label: "Proficiency RMS (R) - Frontal Lobe vs. PP ID" },
        { id: "rms_r_occipital", label: "Proficiency RMS (R) - Occipital Lobe vs. PP ID" },
        { id: "rms_r_parietal", label: "Proficiency RMS (R) - Parietal Lobe vs. PP ID" },
        { id: "rms_r_temporal", label: "Proficiency RMS (R) - Temporal Lobe vs. PP ID" },
      ],
    },
    {
      category: "Neuro-Indicator Trends for Growth",
      items: [
        { id: "growth_l_frontal", label: "Growth RMS (L) - Frontal Lobe vs. PP ID" },
        { id: "growth_l_occipital", label: "Growth RMS (L) - Occipital Lobe vs. PP ID" },
        { id: "growth_l_parietal", label: "Growth RMS (L) - Parietal Lobe vs. PP ID" },
        { id: "growth_l_temporal", label: "Growth RMS (L) - Temporal Lobe vs. PP ID" },
        { id: "growth_r_frontal", label: "Growth RMS (R) - Frontal Lobe vs. PP ID" },
        { id: "growth_r_occipital", label: "Growth RMS (R) - Occipital Lobe vs. PP ID" },
        { id: "growth_r_parietal", label: "Growth RMS (R) - Parietal Lobe vs. PP ID" },
        { id: "growth_r_temporal", label: "Growth RMS (R) - Temporal Lobe vs. PP ID" },
      ],
    },
  ];

  const loads = [
    { id: "l_frontal", label: "Cognitive Load - Frontal Lobe (L)" },
    { id: "l_occipital", label: "Cognitive Load - Occipital Lobe (L)" },
    { id: "l_parietal", label: "Cognitive Load - Parietal Lobe (L)" },
    { id: "l_temporal", label: "Cognitive Load - Temporal Lobe (L)" },
    { id: "r_frontal", label: "Cognitive Load - Frontal Lobe (R)" },
    { id: "r_occipital", label: "Cognitive Load - Occipital Lobe (R)" },
    { id: "r_parietal", label: "Cognitive Load - Parietal Lobe (R)" },
    { id: "r_temporal", label: "Cognitive Load - Temporal Lobe (R)" },
  ];
  

  const handleDeleteCurve = () => {
    const updated = curves.filter((c) => c.id !== selectedCurveId);
    setCurves(updated);
    if (updated.length > 0) setSelectedCurveId(updated[0].id);
    else setSelectedCurveId(null);
  };

  const handlePlusClick = () => setShowNeuroObject(true);
  const handleCloseNeuroObject = () => setShowNeuroObject(false);

  if (!visible) return null;

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center relative">
        {showBackButton && (
          <Undo2
            onClick={() => {
              setActiveAdjustPropertieTab("");
              setShowBackButton(false);
            }}
            className="w-3.5 h-3.5 text-black hover:text-gray-600 cursor-pointer"
          />
        )}
        <span className='pl-3 text-md'>Curve Editor</span>

        {showNeuroObject && (
          <div className="absolute top-0 left-0 z-50 w-[500px] h-[400px] bg-white shadow-2xl border border-gray-200 rounded-md">
            <NeuroObject onClose={handleCloseNeuroObject} />
          </div>
        )}
      </h2>

      {/* Main Split Layout */}
      <div className="flex h-full w-full">
        {/* LEFT COLUMN */}
        <div className={`${activeAdjustPropertieTab === 'Indicators' || activeAdjustPropertieTab === 'Loads'
      ? "w-1/3"
      : "w-full"} flex flex-col gap-2 p-1`}>
          {/* Top Section: Indicators / Loads / Curves */}
          <div className="flex-1 border-2 border-gray-200 rounded-md overflow-auto">
            {activeAdjustPropertieTab === 'Indicators' && selectedCurveId && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-100 text-gray-600">
                  <tr><th className="p-1 border">Entity</th></tr>
                </thead>
                <tbody>
                  {indicators.map(section =>
                    section.items.map(item => (
                      <tr key={item.id} className="cursor-pointer hover:bg-blue-50">
                        <td className="p-1 border truncate">📈 {item.label}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {activeAdjustPropertieTab === 'Loads' && (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-gray-100 text-gray-600">
                  <tr><th className="p-1 border">Entities</th></tr>
                </thead>
                <tbody>
                  {loads.map(load => (
                    <tr key={load.id} className="cursor-pointer hover:bg-blue-50">
                      <td className="p-1 border truncate">📈{load.label}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!(activeAdjustPropertieTab === 'Indicators' || activeAdjustPropertieTab === 'Loads') && (
              <>
                <div className="flex items-center justify-between mb-2 p-1 text-gray-700">
                  <h2 className="text-sm font-semibold">Curve</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={handlePlusClick} title="Add Neuro Object" className="text-red-600 hover:text-red-800 cursor-pointer">
                      <Plus className="w-4 h-4 hover:text-blue-600" />
                    </button>
                    <button onClick={() => setScoreAdd(true)} title="Create Material" className="text-blue-600 hover:text-blue-800 cursor-pointer">
                      <RefreshCw className="w-4 h-4 hover:text-green-600" />
                    </button>
                    <button onClick={handleDeleteCurve} title="Delete Curve" className="text-red-600 hover:text-red-800 cursor-pointer">
                      <FolderOutput className="w-4 h-4 hover:text-blue-600" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="bg-gray-100 text-gray-600">
                      <tr>
                        <th className="p-1 border">Entities</th>
                        <th className="p-1 border">ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {curves.map(curve => (
                        <tr
                          key={curve.id}
                          className={`cursor-pointer hover:bg-blue-50 ${selectedCurveId === curve.id ? 'bg-blue-100' : ''}`}
                          onClick={() => setSelectedCurveId(curve.id)}
                        >
                          <td className="p-1 border">{curve.name}</td>
                          <td className="p-1 border">{curve.id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Bottom Section: Tabs */}
          <div className="h-1/2 flex flex-col border border-gray-200">
            <div className="flex space-x-2 border-b p-2">
              {['Property editor', 'Tables', 'Indicators', 'Loads'].map(tab => (
                <button
                  key={tab}
                  className={`px-3 py-1 text-sm cursor-pointer ${
                    activeAdjustPropertieTab === tab
                      ? "text-black bg-white border-t-2 border-blue-400 shadow-sm"
                      : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                  }`}
                  onClick={() => {
                    setActiveAdjustPropertieTab(tab);
                    if (tab === 'Indicators' || tab === 'Loads') setShowBackButton(true);
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-auto p-2">
              {activeAdjustPropertieTab === 'Tables' && (
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
              )}

              {activeAdjustPropertieTab === 'Property editor' && (
                <PropertyEditor properties={chartProperties} onChange={setChartProperties} />
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (Chart) */}
        {selectedCurveId && (activeAdjustPropertieTab === 'Indicators' || activeAdjustPropertieTab === 'Loads') && (
          <div className="flex-1 border border-gray-300 rounded-md p-2 ml-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={floatChartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name">
                  <Label value="Time Period (X)" offset={-10} position="insideBottom" />
                </XAxis>
                <YAxis>
                  <Label value="Score / Value (Y/Z)" angle={-90} position="insideLeft" offset={10} />
                </YAxis>
                <Tooltip />
                <Legend verticalAlign="top" />
                <Line type="monotone" dataKey="xValue" name="X Axis Value" stroke="#3b82f6" strokeWidth={2} dot />
                <Line type="monotone" dataKey="yValue" name="Y Axis Value" stroke="#10b981" strokeWidth={2} dot />
                <Line type="monotone" dataKey="zValue" name="Z Axis Value" stroke="#f59e0b" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

      </div>
    </>
  );
}
