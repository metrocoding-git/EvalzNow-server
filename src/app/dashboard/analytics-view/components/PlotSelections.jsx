"use client";
import React, { useEffect, useRef, useState } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Search,
  X,
  RefreshCw,
  FolderOutput,
} from "lucide-react";
import ScoringCriteria from "./ScoringCriteria";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import PropertyEditor from "./PropertyEditor";

export default function PlotSelections() {
  const [curves, setCurves] = useState([
    { id: 1, name: "curve1" },
    { id: 2, name: "curve2" },
    { id: 3, name: "curve3" },
    { id: 4, name: "curve4" },
    { id: 5, name: "curve5" },
    { id: 6, name: "curve6" },
    { id: 7, name: "curve7" },
    { id: 8, name: "curve8" },
    { id: 9, name: "curve9" },
    { id: 10, name: "curve10" },
    { id: 11, name: "curve11" },
    { id: 12, name: "curve12" },
  ]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);
  const [ScoreAdd, setScoreAdd] = useState(false);
  const [points, setPoints] = useState(
    Array.from({ length: 10 }, () => ({ x: "", y: "" }))
  );
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("IndirectPerformancePoint");
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] =
    useState("Table");
  const canvasRef = useRef(null);

 const [chartProperties, setChartProperties] = useState({
  // Standard
  positiveVisibility: true,
  negativeVisibility: true,
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


  const data = [
    { name: "A", uv: 400, pv: 240 },
    { name: "B", uv: 300, pv: 139 },
    { name: "C", uv: 200, pv: 980 },
    { name: "D", uv: 278, pv: 390 },
    { name: "E", uv: 189, pv: 480 },
    { name: "F", uv: 239, pv: 380 },
    { name: "G", uv: 349, pv: 430 },
  ];

  const chart = [
    { icon: "📊", name: "Bar Chart" },
    { icon: "📈", name: "Line Chart" },
    { icon: "📉", name: "Area Chart" },
    { icon: "🧮", name: "Scatter Chart" },
    { icon: "🧊", name: "Pie Chart" },
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

  return (
    <div>
      <h2 className="text-md font-bold bg-gray-100 flex items-center">
        <span className="pl-2 text-md">Plot Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>
      <div className="flex h-full w-full my-2">
        <div className="w-6/12 lg:w-3/12 flex flex-col border-2 h-full border-gray-200 p-1">
          <div className="flex items-center justify-between mb-1 px-1 mx-1 mt-1 text-gray-700 ">
            <h2 className="text-sm font-semibold">Plots</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {}}
                title="Create Material"
                className="text-gray-600 hover:text-gray-800 cursor-pointer"
              >
                <RefreshCw
                  className="w-4 h-4 hover:text-green-600"
                  onClick={() => setScoreAdd(true)}
                />
              </button>
              <button
                onClick={handleDeleteCurve}
                title="Delete Curve"
                className="text-red-600 hover:text-red-800 cursor-pointer"
              >
                <FolderOutput className="w-4 h-4 hover:text-gray-600" />
              </button>
            </div>
          </div>

          <div className=" h-full overflow-hidden w-full ">
            <div className=" h-1/2 flex flex-col border border-gray-200  ">
              <div className="flex-1 overflow-auto   ">
                <div className="space-y-1">
                  {chart.map((chart, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 border px-2 p-0.5 hover:bg-gray-100 cursor-pointer ${
                        index == 0 ? "bg-gray-300" : ""
                      }`}
                    >
                      <span className="text-xl">{chart.icon}</span>
                      <span className="text-sm text-gray-700">
                        {chart.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="h-1/2 flex flex-col border border-gray-200">
              {/* Tab Buttons */}
              <div className="flex space-x-2 border-b p-0.5">
                <button
                  className={`px-3 py-1 text-sm cursor-pointer ${
                    activeAdjustPropertieTab === "Property editor"
                      ? "bg-gray-100 text-gray-600 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveAdjustPropertieTab("Property editor")}
                >
                  Property editor
                </button>
                <button
                  className={`px-3 py-1 text-sm cursor-pointer ${
                    activeAdjustPropertieTab === "Table"
                      ? "bg-gray-100 text-gray-600 font-semibold"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setActiveAdjustPropertieTab("Table")}
                >
                  Table
                </button>
              </div>

              {/* Tab Content */}
              <div className="overflow-auto h-full">
                {activeAdjustPropertieTab === "Property editor" && (
                  <PropertyEditor
                    properties={chartProperties}
                    onChange={setChartProperties}
                  />
                )}

                {activeAdjustPropertieTab === "Table" && (
                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto">
                    <table className="table-auto w-full text-sm border border-gray-300">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border px-2 py-1">Name</th>
                          <th className="border px-2 py-1">UV</th>
                          <th className="border px-2 py-1">PV</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map((item, index) => (
                          <tr key={index}>
                            <td className="border px-2 py-1">{item.name}</td>
                            <td className="border px-2 py-1">{item.uv}</td>
                            <td className="border px-2 py-1">{item.pv}</td>
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

        <div className="w-6/12 lg:w-9/12 flex flex-col border-2 h-full border-gray-200 bg-gray-100 ">
          <div className="h-full overflow-auto  m-5">
            <ResponsiveContainer width="100%" height="95%">
              <LineChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  label={{
                    value: "X-AXIS (Name)",
                    position: "insideBottom",
                    offset: -5,
                  }}
                />
                <YAxis
                  label={{
                    value: "Y-AXIS (Values)",
                    angle: -90,
                    position: "insideLeft",
                  }}
                />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="uv"
                  name="UV"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="pv"
                  name="PV"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {ScoreAdd && (
        <div className="overflow-auto my-2">
          <ScoringCriteria onClose={() => setScoreAdd(false)} />
        </div>
      )}
    </div>
  );
}
