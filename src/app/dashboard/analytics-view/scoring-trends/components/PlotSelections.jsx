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
  Label,
  Area,
} from "recharts";
import PropertyEditor from "../../components/PropertyEditor";
import { getScoringCriteriaByUnitId } from "@/services/scoringCriteriaService";
import { getAttainedScoreSummary, getMaxScoresSummary, getScoringTrendsSummary } from "@/services/scoringTrendsService";
import html2canvas from "html2canvas-pro";
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx";
import ExcelJS from 'exceljs';

export default function PlotSelections({ filters, unitId, environment, candidateId, onResetFilters }) {
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

  const [points, setPoints] = useState(
    Array.from({ length: 10 }, () => ({ x: "", y: "" }))
  );
  const [visible, setVisible] = useState(true);
  const [activeTab, setActiveTab] = useState("IndirectPerformancePoint");
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] =
    useState("Table");

  const canvasRef = useRef(null);
  const chartContainerRef = useRef(null);

  // Example line chart data
  const data = [
    { name: "A", uv: 400, pv: 240 },
    { name: "B", uv: 300, pv: 139 },
    { name: "C", uv: 200, pv: 980 },
  ];

  const [chart, setChart] = useState([
    { name: "Communication (MC1) vs. Insert Score Row Counter", key: "mc1", icon: "📉", id: "1" },
    { name: "Intelligence (MC2) vs. Insert Score Row Counter", key: "mc2", icon: "📉", id: "2" },
    { name: "Responsiveness (MC3) vs. Insert Score Row Counter ", key: "mc3", icon: "📉", id: "3" },
    { name: "Efficiency (MC4) vs. Insert Score Row Counter ", key: "mc4", icon: "📉", id: "4" },
    { name: "Adaptation (MC5) vs. Insert Score Row Counter ", key: "mc5", icon: "📉", id: "5" },
    { name: "Accuracy (MC6) vs. Insert Score Row Counter ", key: "mc6", icon: "📉", id: "6" },
    { name: "Verbal Reasoning (MC7) vs. Insert Score Row Counter ", key: "mc7", icon: "📉", id: "7" },
    { name: "Spatial Reasoning (MC8) vs. Insert Score Row Counter ", key: "mc8", icon: "📉", id: "8" },
    { name: "Numerical Reasoning (MC9) vs. Insert Score Row Counter ", key: "mc9", icon: "📉", id: "9" },
    { name: "Problem Solving (MC10) vs. Insert Score Row Counter", key: "mc10", icon: "📉", id: "10" },
    { name: "Memory (MC11) vs. Insert Score Row Counter", key: "mc11", icon: "📉", id: "11" },
    { name: "Data Checking (MC12) vs. Insert Score Row Counter ", key: "mc12", icon: "📉", id: "12" },
    { name: "Work Sampling (MC13) vs. Insert Score Row Counter", key: "mc13", icon: "📉", id: "13" },
    { name: "Quality of Work (MC14) vs. Insert Score Row Counter", key: "mc14", icon: "📉", id: "14" },
    { name: "Resourcefulness (MC15) vs. Insert Score Row Counter ", key: "mc15", icon: "📉", id: "15" },
    { name: "Following Instructions (MC16) vs. Insert Score Row Counter ", key: "mc16", icon: "📉", id: "16" },
    { name: "Working in Teams (MC17) vs. Insert Score Row Counter", key: "mc17", icon: "📉", id: "17" },
    { name: "Working Alone (MC18) vs. Insert Score Row Counter", key: "mc18", icon: "📉", id: "18" },
    { name: "Initiative (MC19) vs. Insert Score Row Counter", key: "mc19", icon: "📉", id: "19" },
    { name: "Sick/Injury Avoidance (MC20) vs. Insert Score Row Counter ", key: "mc20", icon: "📉", id: "20" },
    { name: "Attained Score vs. Insert Score Row Counter ", key: "attained", icon: "📉", id: "21" },
    { name: "Maximum Score vs. Insert Score Row Counter ", key: "max", icon: "📉", id: "22" }
  ]
  );
  

  const [selectedChart, setSelectedChart] = useState(chart[0]);
  const [customCriteria, setCustomCriteria] = useState([]);

  const [scoringData, setScoringData] = useState(null);
  const [positiveScoringData, setPositiveScoringData] = useState(null);
  const [negativeScoringData, setNegativeScoringData] = useState(null);
  const [attainedScoreData, setAttainedScoreData] = useState(null);
  const [maxScoreData, setMaxScoreData] = useState(null);

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

  useEffect(() => {
    if (chartProperties) {

    }
  }, [chartProperties.shadeArea] );


  console.log("Shade color:", chartProperties.shadeArea);


  useEffect(() => {
    const fetchCriteria = async () => {
      if (!unitId) return;
  
      try {
        const data = await getScoringCriteriaByUnitId(unitId);
        if (!Array.isArray(data)) throw new Error("Invalid scoring criteria response");
  
        // Sort by criteriaId
        const sorted = [...data].sort((a, b) => a.criteriaId - b.criteriaId);
  
        setChart((prev) => {
          // Find the max current numeric ID in chart (or just start from 22)
          const startId = 23;
        
          // Map new criteria with sequential IDs starting from 23 and keys starting from cc1
          const mappedCharts = sorted.map((c, index) => ({
            name: `${c.criteria} (CC${c.criteriaId}) vs. Insert Score Row Counter (Workforce Only - Line Graph)`,
            key: `cc${index + 1}`, // cc1, cc2, ...
            icon: "📉",
            id: (startId + index).toString(),
          }));
        
          return [...chart.slice(0, 22), ...mappedCharts]; // append to existing chart array
        });
        
  
        setCustomCriteria(data);
      } catch (err) {
        console.error("Failed to fetch scoring criteria:", err);
      }
    };
  
    fetchCriteria();
  }, [unitId]);

  
  useEffect(() => {
    const fetchScoringData = async () => {
      if (!unitId || !candidateId) return;

      try {
        const data = await getScoringTrendsSummary({
          unitId: unitId,
          candidate_id: candidateId,       // make sure filters contains candidate_id
          ppIdFrom: filters?.ppIdFrom ?? undefined,    
          ppIdTo: filters?.ppIdTo ?? undefined,
          criticalRefDateFrom: filters?.criticalDateFrom ?? undefined,
          criticalRefDateTo: filters?.criticalDateTo ?? undefined
        });
        setPositiveScoringData(data.positiveData);
        setNegativeScoringData(data.negativeData);
      } catch (err) {
        console.error("Failed to fetch scoring trends:", err);
      }
    };

    fetchScoringData();
  }, [unitId, filters, candidateId]);

  console.log("positve score:", positiveScoringData);
  console.log("ngative score:", negativeScoringData);

  useEffect(() => {
    const fetchAttainedScoreData = async () => {
      if (!unitId || !candidateId) return;

      try {
        const data = await getAttainedScoreSummary({
          unitId: unitId,
          candidate_id: candidateId,       // make sure filters contains candidate_id
          ppIdFrom: filters?.ppIdFrom ?? undefined,    
          ppIdTo: filters?.ppIdTo ?? undefined,
          criticalRefDateFrom: filters?.criticalDateFrom ?? undefined,
          criticalRefDateTo: filters?.criticalDateTo ?? undefined
        });
        setAttainedScoreData(data.data);
      } catch (err) {
        console.error("Failed to fetch scoring trends:", err);
      }
    };

    fetchAttainedScoreData();
  }, [unitId, filters, candidateId]);


  useEffect(() => {
    const fetchMaxScoreData = async () => {
      if (!unitId || !candidateId) return;

      try {
        const data = await getMaxScoresSummary({
          unitId: unitId,
          candidate_id: candidateId,       // make sure filters contains candidate_id
          ppIdFrom: filters?.ppIdFrom ?? undefined,    
          ppIdTo: filters?.ppIdTo ?? undefined,
          criticalRefDateFrom: filters?.criticalDateFrom ?? undefined,
          criticalRefDateTo: filters?.criticalDateTo ?? undefined
        });
        setMaxScoreData(data);
      } catch (err) {
        console.error("Failed to fetch scoring trends:", err);
      }
    };

    fetchMaxScoreData();
  }, [unitId, filters, candidateId]);

  const buildXYChartData = (
    positiveData,
    negativeData,
    attainedScoreData,
    maxScoreData,
    selectedChart
  ) => {
    if (!selectedChart) return { positive: [], negative: [] };
  
    const key = selectedChart.key;
    const isMC = key.startsWith("mc");
  
    // ✅ Attained Score Chart
    if (key === "attained") {
      if (!attainedScoreData) return { positive: [], negative: [] };
  
      const positivePoints = attainedScoreData
        .filter((row) => (row.ppId ?? 0) > 0)
        .map((row) => ({
          x: Number(row.serialNo ?? 0),
          y: Number(row.attainedScore ?? 0),
          ppId: row.ppId,
          label: `Row ${row.serialNo}`,
          type: "attained",
        }))
        .sort((a, b) => a.x - b.x);
  
      const negativePoints = attainedScoreData
        .filter((row) => (row.ppId ?? 0) <= 0)
        .map((row) => ({
          x: Number(row.serialNo ?? 0),
          y: Number(row.attainedScore ?? 0),
          ppId: row.ppId,
          label: `Row ${row.serialNo}`,
          type: "attained",
        }))
        .sort((a, b) => a.x - b.x);
  
      return { positive: positivePoints, negative: negativePoints };
    }
  
    // ✅ Max Score Chart
    if (key === "max") {
      const source = maxScoreData?.data ?? attainedScoreData ?? [];
      if (!source) return { positive: [], negative: [] };
  
      const positivePoints = source
        .filter((row) => (row.ppId ?? 0) > 0)
        .map((row) => ({
          x: Number(row.serialNo ?? 0),
          y: Number(row.maxScore ?? 0),
          ppId: row.ppId,
          label: `Row ${row.serialNo}`,
          type: "max",
        }))
        .sort((a, b) => a.x - b.x);
  
      const negativePoints = source
        .filter((row) => (row.ppId ?? 0) <= 0)
        .map((row) => ({
          x: Number(row.serialNo ?? 0),
          y: Number(row.maxScore ?? 0),
          ppId: row.ppId,
          label: `Row ${row.serialNo}`,
          type: "max",
        }))
        .sort((a, b) => a.x - b.x);
  
      return { positive: positivePoints, negative: negativePoints };
    }
  
    // ✅ Handle MC/CC Charts (normal case)
    if ((!positiveData && !negativeData) || !key)
      return { positive: [], negative: [] };
  
    const buildPoints = (data, type) => {
      if (!data) return [];
      return data
        .map((row) => {
          const val =
            key.startsWith("mc")
              ? row.mcValues?.[key] ?? 0
              : row.ccValues?.[key] ?? 0;
  
          return {
            x: Number(row.serialNo ?? 0),
            y: Number(val ?? 0),
            ppId: row.ppId,
            label: `${row.ppId}`,
            type,
          };
        })
        .sort((a, b) => a.x - b.x); // ✅ SORT BY X VALUE HERE
    };
  
    const positivePoints = buildPoints(positiveData, "positive");
    const negativePoints = buildPoints(negativeData, "negative");
  
    return { positive: positivePoints, negative: negativePoints };
  };
  
  
  
  
  const { positive: positiveData, negative: negativeData } = buildXYChartData(
    positiveScoringData,
    negativeScoringData,
    attainedScoreData,
    maxScoreData,
    selectedChart
  );

  // For table display - combine both datasets
  const combinedData = [...positiveData, ...negativeData].sort((a, b) => a.x - b.x);

  // const positiveData = xyData
  // .filter((p) => p.y >= 0)
  // .sort((a, b) => a.x - b.x);

  // const negativeData = xyData
  //   .filter((p) => p.y < 0)
  //   .sort((a, b) => a.x - b.x);

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

 
  // Function to export with image and data in single worksheet
  const exportToExcel = async () => {
    if (!chartContainerRef.current || (!positiveData.length && !negativeData.length)) {
      alert("No data available to export");
      return;
    }

    try {
      // Capture chart as image
      const canvas = await html2canvas(chartContainerRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const chartImageBuffer = await new Promise((resolve) => {
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = () => resolve(new Uint8Array(reader.result));
          reader.readAsArrayBuffer(blob);
        });
      });

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Chart Report');

      // Add header section
      worksheet.addRow(['CHART EXPORT REPORT']);
      worksheet.getCell('B2').font = { size: 16, bold: true };
      worksheet.addRow([`Chart: ${selectedChart.name}`]);
      worksheet.addRow([`Key: ${selectedChart.key}`]);
      worksheet.addRow([`Export Date: ${new Date().toLocaleString()}`]);
      worksheet.addRow([]);

      // Add the chart image
      const imageId = workbook.addImage({
        buffer: chartImageBuffer,
        extension: 'png',
      });

      // Insert image after header (row 6, column A)
      worksheet.addImage(imageId, {
        tl: { col: 0, row: 5 },
        br: { col: 8, row: 25 },
      });

      // Add data section after the image
      worksheet.addRow([]);
      worksheet.addRow(['COORDINATES DATA']);
      worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true };
      
      const headerRow = worksheet.addRow(['PP Id / Label', 'X Axis Value', 'Y Axis Value', 'Type']);
      headerRow.font = { bold: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE6E6FA' }
      };

      // Add data rows for both positive and negative
      combinedData.forEach((point) => {
        worksheet.addRow([
          point.label ?? point.ppId ?? 'N/A',
          point.x,
          point.y,
          point.type?.toUpperCase() || 'N/A'
        ]);
      });

      // Add summary
      worksheet.addRow([]);
      worksheet.addRow(['SUMMARY']);
      worksheet.getCell(`B${worksheet.rowCount}`).font = { bold: true };
      worksheet.addRow([`Total Data Points: ${combinedData.length}`]);
      worksheet.addRow([`Positive Points: ${positiveData.length}`]);
      worksheet.addRow([`Negative Points: ${negativeData.length}`]);
      worksheet.addRow([`X Value Range: ${Math.min(...combinedData.map(p => p.x))} - ${Math.max(...combinedData.map(p => p.x))}`]);
      worksheet.addRow([`Y Value Range: ${Math.min(...combinedData.map(p => p.y))} - ${Math.max(...combinedData.map(p => p.y))}`]);

      // Set column widths
      worksheet.columns = [
        { width: 20 }, { width: 15 }, { width: 15 }, { width: 12 }
      ];

      // Generate and save file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });
      
      saveAs(blob, `chart-report-${selectedChart.key}-${new Date().getTime()}.xlsx`);

    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export: ' + error.message);
    }
  };


   // Update your existing handleDeleteCurve function or create a new one
   const handleExportGraph = () => {
    exportToExcel();
  };
  
  console.log("Scoring Trends Data: ", scoringData);

  if (!visible) return null;

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-2 flex items-center">
        <span className="pl-2 text-md">Plot Selections</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>
      <div className="flex h-full w-full my-2 mx-1">
        <div className="w-6/12 lg:w-4/12 flex flex-col border-2 h-full border-gray-200  p-1">
          <div className="flex items-center justify-between px-1 mx-1  text-gray-700 ">
            <h2 className="text-sm font-semibold">Plots</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (typeof onResetFilters === "function") {
                    onResetFilters(); // ✅ reset filters in parent
                  }
                  // setScoreAdd(true); 
                }}
                title="Reset"
                className="text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <RefreshCw
                  className="w-4 h-4 hover:text-green-600"
                  // onClick={() => setScoreAdd(true)}
                />
              </button>
              <button
                onClick={handleExportGraph}
                title="Export Graph"
                className="text-red-600 hover:text-red-800 cursor-pointer"
              >
                <FolderOutput className="w-4 h-4 hover:text-blue-600" />
              </button>
            </div>
          </div>

          <div className=" h-full overflow-hidden w-full my-2">
            <div className=" h-1/2 flex flex-col border border-gray-200  ">
              <div className="flex-1 overflow-auto  ">
                <div className="h-full overflow-hidden flex flex-col">
                    {/* Table Header - Fixed */}
                    <div className="grid grid-cols-12 bg-gray-100 text-gray-600 sticky top-0 z-10 text-sm">
                      <div className="col-span-10 px-2 py-1 text-left font-medium">Entities</div>
                      <div className="col-span-2 py-1 text-left font-medium">ID</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto">
                      {chart
                        .filter((item) => {
                          // 🔹 If environment is Workforce → show everything
                          if (environment === "Workforce") return true;

                          // 🔹 For other types (like Classroom) → show only Attained & Max
                          return ["attained", "max"].includes(item.key);
                        })
                        .map((item, index) => (
                          <div
                            key={index}
                            className={`grid grid-cols-12 hover:bg-gray-200 cursor-pointer ${
                              selectedChart.name === item.name ? "bg-gray-100" : ""
                            }`}
                            onClick={() => setSelectedChart(item)}
                          >
                            <div className="col-span-10 px-2 py-1 whitespace-nowrap text-sm">
                              <div className="flex items-center">
                                <span className="truncate">📉 {item.name}</span>
                              </div>
                            </div>
                            <div className="col-span-2 px-3 py-1 whitespace-nowrap text-sm">
                              {index + 1}
                            </div>
                          </div>
                        ))
                      }
                    </div>
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
              <div className="flex-1 overflow-auto p-2 h-full">
                {activeAdjustPropertieTab === "Property editor" && (
                  <PropertyEditor
                    properties={chartProperties}
                    onChange={setChartProperties}
                  />
                )}

                {activeAdjustPropertieTab === "Table" && (
                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto min-h-50 mb-7 pb-3">
                    {(() => {
                      const positiveRows = combinedData.filter((r) => (r.ppId ?? 0) > 0);
                      const negativeRows = combinedData.filter((r) => (r.ppId ?? 0) <= 0);

                      const renderTable = (title, rows, color) => (
                        <div className="mb-6">
                          <h3
                            className={`text-sm font-semibold mb-2 px-2 py-1 rounded ${color} text-gray-400`}
                          >
                            {title}
                          </h3>
                          <table className="table-auto w-full text-sm ">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                                  PP Id / Label
                                </th>
                                <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                                  X Axis Value
                                </th>
                                <th className="whitespace-nowrap border border-gray-300 px-3 py-2 text-center">
                                  Y Axis Value
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {rows.length > 0 ? (
                                rows.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50">
                                    <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                      {row.label ?? row.ppId ?? `#${idx + 1}`}
                                    </td>
                                    <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                      {row.x}
                                    </td>
                                    <td className="whitespace-nowrap text-center border border-gray-300 px-3 py-2">
                                      {row.y}
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan={3}
                                    className="text-center text-gray-500 border border-gray-300 px-3 py-2"
                                  >
                                    No data available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      );

                      return (
                        <>
                          {renderTable("Positive PP ID", positiveRows)}
                          {renderTable("Negative PP ID", negativeRows )}
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div ref={chartContainerRef} className={`w-6/12 lg:w-9/12 flex flex-col border-2 h-full border-gray-200 ml-1`} 
          style={{ backgroundColor: chartProperties.shadeArea }}>
          <div className="h-full overflow-auto m-5">
            <h2 className="text-lg text-center font-semibold text-gray-700 mb-4">{selectedChart.icon} {selectedChart.name.replace(/\s*vs\. Insert Score Row Counter.*$/i, "").trim()}</h2>

            <ResponsiveContainer width="100%" height="95%">
              <LineChart
                key={
                  chartProperties.positiveLineColor +
                  chartProperties.negativeLineColor +
                  chartProperties.lineStyle +
                  chartProperties.symbolStyle +
                  chartProperties.symbolScaleSize +
                  chartProperties.shadeArea
                }
                margin={{ top: 10, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />

                {/* X Axis */}
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, "dataMax"]}
                  allowDecimals={false}
                >
                  {(chartProperties.showLabel || chartProperties.labelType !== "X Type") && (
                    <Label value={`Total Rows (X)`} offset={-10} position="insideBottom" />
                  )}
                </XAxis>

                {/* Y Axis */}
                <YAxis type="number" dataKey="y">
                  {(chartProperties.showLabel || chartProperties.labelType !== "Y Type") && (
                    <Label
                      value={`${selectedChart.key} (Y)`}
                      angle={-90}
                      position="insideLeft"
                      offset={10}
                    />
                  )}
                </YAxis>

                <Tooltip
                  formatter={(value, name) => [value, name === "positive" ? "Positive" : "Negative"]}
                  labelFormatter={(label) => `Value: ${label}`}
                  contentStyle={{ fontSize: 12 }}
                />

                <Legend />

                {/* Shade Area (behind the lines) */}
                {/* Shade Area (behind the lines) */}
{chartProperties.shadeArea !== "#ffffff" && (
  <>
    {/* Positive Shade */}
    <Area
      type="linear"
      data={positiveData}
      dataKey="y"
      stroke="none"
      fill={chartProperties.shadeArea}
      fillOpacity={0.1}
      hide={!chartProperties.positiveVisibility}
    />

    {/* Negative Shade */}
    <Area
      type="linear"
      data={negativeData}
      dataKey="y"
      stroke="none"
      fill={chartProperties.shadeArea}
      fillOpacity={0.1}
      hide={!chartProperties.negativeVisibility}
    />
  </>
)}

{/* Positive Data Line */}
<Line
  type="linear"
  data={positiveData}
  dataKey="y"
  name="Positive PP IDs"
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
  isAnimationActive={false}
  hide={!chartProperties.positiveVisibility}
  dot={(props) => {
    const { index } = props;
    if (index % chartProperties.symbolFrequency !== 0) return null;
    return renderCustomDot(props, chartProperties.positiveSymbolColor);
  }}
/>

{/* Negative Data Line */}
<Line
  type="linear"
  data={negativeData}
  dataKey="y"
  name="Negative PP IDs"
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
  isAnimationActive={false}
  hide={!chartProperties.negativeVisibility}
  dot={(props) => {
    const { index } = props;
    if (index % chartProperties.symbolFrequency !== 0) return null;
    return renderCustomDot(props, chartProperties.negativeSymbolColor);
  }}
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
    </>
  );
}
