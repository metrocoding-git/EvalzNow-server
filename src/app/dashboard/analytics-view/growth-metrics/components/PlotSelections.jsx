'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Plus, Trash2, Copy, Search, X, RefreshCw, FolderOutput } from 'lucide-react';
import { createProjection, getProjection } from "@/services/projectionService";
import {
  LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer,
  Label,
  PieChart,
  Pie,
  Scatter,
  ScatterChart,
  ReferenceLine,
  Cell
} from 'recharts';
import PropertyEditor from './PropertyEditor';
import ProjectionTable from './ProjectionTable';
import { getUnitAndMultipleCandidateSummary } from '@/services/tabulationTableService';
import { getUnitById } from '@/services/unitService';
import { GrowthProjectionChart } from './ProjectionGraph';

//This script is used to plot the undershoot curves, the overshoot curves, and the vertical projection lines
//on the Growth Projection graph -> Candidate Analysis: Growth Projections (Data Analytics)
//------------------------------------------------------------------------------------------------------
//spline 2nd derivative at x2
const calculateZ2 = (m1, m2, m3, x1, x2, x3, x4) => {
  let numerator =
    m3 * x2 +
    m2 * x3 -
    m3 * x3 +
    2 * m2 * x4 +
    2 * m1 * x2 -
    2 * m1 * x4 -
    3 * m2 * x2;
  let denominator = 4 * (x1 * x2 + x3 * x4 - x1 * x4) - Math.pow(x2 + x3, 2);
  let result = 6 * (numerator / denominator);
  return result;
};

//spline 2nd derivative at x3
const calculateZ3 = (m1, m2, m3, x1, x2, x3, x4) => {
  let numerator =
    m2 * x2 +
    m1 * x3 -
    m1 * x2 +
    2 * m2 * x1 +
    2 * m3 * x3 -
    2 * m3 * x1 -
    3 * m2 * x3;
  let denominator = 4 * (x1 * x2 + x3 * x4 - x1 * x4) - Math.pow(x2 + x3, 2);
  let result = 6 * (numerator / denominator);
  return result;
};

export function calculateProjectionValues(
  y1, //Growth differentials for ΔRRN/ΔPRN/ΔARN of selected performance points
  y2,
  y3,
  y4, //Value always equal to 0
  x1, //Daycounts associated with selected performance points
  x2,
  x3,
  x4 //Projection termination point, so x4 = x3 + 31
) {
  let m1 = (y2 - y1) / (x2 - x1); //piecewise linear slopes
  let m2 = (y3 - y2) / (x3 - x2);
  let m3 = (y4 - y3) / (x4 - x3);
  let z2 = calculateZ2(m1, m2, m3, x1, x2, x3, x4); //spline 2nd derivative at x2
  let z3 = calculateZ3(m1, m2, m3, x1, x2, x3, x4); //spline 2nd derivative at x3
  let a1 = z2 / (6 * (x1 - x2)); //cubic coefficients
  let a2 = (2 * z2 + z3) / (6 * (x2 - x3));
  let a3 = z3 / (3 * (x3 - x4));
  let b1 = (2 * z2) / (6 * (x2 - x1));
  let b2 = (2 * z3 + z2) / (6 * (x3 - x2));
  let b3 = z3 / (6 * (x4 - x3));

  let curves = [];

  // s is the overshoot value for ΔRRN/ΔPRN/ΔARN
  // l is the undershoot value for ΔRRN/ΔPRN/ΔARN
  // c is the correction factor

  // Curves for Segment #1

  //l1 ,l2,l3 means blue lines
  //s1,s2,s3 means red lines

  for (let i = x1; i <= x2 + 0.1; i = i + 0.1) {
    let l1 = m1 * (i - x1) + y1;
    let c1 =
      a1 * Math.pow(i - x2, 2) * (i - x1) + b1 * (i - x2) * Math.pow(i - x1, 2);
    let s1 = l1 + c1;


    // blue.push({ l1 });
    // red.push({ s1 });
 
    curves.push({ l1, s1, i });
   
  }

  // Curves for Segment #2

  for (let j = x2; j <= x3 + 0.1; j = j + 0.1) {
    let l2 = m2 * (j - x2) + y2;
    let c2 =
      a2 * Math.pow(j - x3, 2) * (j - x2) + b2 * (j - x3) * Math.pow(j - x2, 2);
    let s2 = l2 + c2;

    /// blue.push({ l2 });
    /// red.push({ s2 });

 
    curves.push({ l2, s2, j });

  }

  // Curves for Segment #3

  for (let k = x3; k <= x4 + 0.1; k = k + 0.1) {
    let l3 = m3 * (k - x4) + y4;
    let c3 =
      a3 * Math.pow(k - x4, 2) * (k - x3) + b3 * (k - x4) * Math.pow(k - x3, 2);
    let s3 = l3 + c3;

    // blue.push({ l3 });
    // red.push({ s3 });


    curves.push({ l3, s3, k });

  }

  // Vertical line for the 15-day projection (i = x3 + 15) and the 30-day projection (i = x3 + 30)
  // curves.push({ blue, red });

  return curves;
}


export default function PlotSelections({ selectedSort, unitId, candidateId, filters, onResetFilters }) {
  const [curves, setCurves] = useState([{ id: 1, name: 'curve1' }, { id: 2, name: 'curve2' }, { id: 3, name: 'curve3' }, { id: 4, name: 'curve4' }, { id: 5, name: 'curve5' }, { id: 6, name: 'curve6' }, { id: 7, name: 'curve7' }, { id: 8, name: 'curve8' }, { id: 9, name: 'curve9' }, { id: 10, name: 'curve10' }, { id: 11, name: 'curve11' }, { id: 12, name: 'curve12' },]);
  const [selectedCurveId, setSelectedCurveId] = useState(1);
  const [showCreateMaterial, setShowCreateMaterial] = useState(false);

  const [ScoreAdd, setScoreAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tableData, setTableData] = useState([]);

  const [growthMetric, setGrowthMetric] = useState([]);


  const [chartProperties, setChartProperties] = useState({
    // Standard
    visibility: true,
    layer: 1,
    reference: false,
  
    // Curve Label
    showLabel: true,
    labelType: "X Type",
    
  
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
    Array.from({ length: 10 }, () => ({ x: '', y: '' }))
  );
  const [visible, setVisible] = useState(true);
  const [activeAdjustPropertieTab, setActiveAdjustPropertieTab] = useState('Table');

  const [showProjectionTable, setShowProjectionTable] = useState(false);
  const [stabilitySummary, setStabilitySummary] = useState({ stable: 0, unstable: 0 });
  const [thresholdValue, setThresholdValue] = useState(null);
  const canvasRef = useRef(null);

  // Example line chart data
  const data = [
    { name: 'A', uv: 400, pv: 240 },
    { name: 'B', uv: 300, pv: 139 },
    { name: 'C', uv: 200, pv: 980 },
  ];

  const activateCandidateLevel = [
    { id: "acl-1", name: "Equivalent Growth Differentials (ΔGEQ)", icon: "📈", type: "line" },
    { id: "acl-2", name: "Receptive Growth Differentials (ΔRR)", icon: "📈", type: "line" },
    { id: "acl-3", name: "Productive Growth Differentials (ΔPR)", icon: "📈", type: "line" },
    { id: "acl-4", name: "Acuity Growth Differentials (ΔAR)", icon: "📈", type: "line" },
    { id: "acl-5", name: "Performance Ratio (RR)", icon: "📊", type: "line" },
    { id: "acl-6", name: "Performance Ratios (PR)", icon: "📊", type: "line" },
    { id: "acl-7", name: "Performance Ratios (AR)", icon: "📊", type: "line" },
    { id: "acl-8", name: "Stability in Growth (STAG)", icon: "🧭", type: "pie" },
    { id: "acl-9", name: "Projected Receptive Ratio Component for Growth Target 1 (RRGT1)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Productive Ratio Component for Growth Target 1 (PRGT1)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Acuity Ratio Component for Growth Target 1 (ARGT1)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Receptive Ratio Component for Growth Target 2 (RRGT2)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Productive Ratio Component for Growth Target 2 (PRGT2)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Acuity Ratio Component for Growth Target 2 (ARGT2)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Receptive Ratio Component for Growth Target 3 (RRGT3)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Productive Ratio Component for Growth Target 3 (PRGT3)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Acuity Ratio Component for Growth Target 3 (ARGT3)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Receptive Ratio Component for Growth Target 4 (RRGT4)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Productive Ratio Component for Growth Target 4 (PRGT4)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Acuity Ratio Component for Growth Target 4 (ARGT4)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Receptive Ratio Component for Growth Target 5 (RRGT5)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Productive Ratio Component for Growth Target 5 (PRGT5)", icon: "🧪", type: "line" },
    { id: "acl-9", name: "Projected Acuity Ratio Component for Growth Target 5 (ARGT5)", icon: "🧪", type: "line" },
    // { id: "acl-10", name: "GT 2 Component", icon: "🧪", type: "line" },
    // { id: "acl-11", name: "GT 3 Component", icon: "🧪", type: "line" },
    // { id: "acl-12", name: "GT 4 Component", icon: "🧪", type: "line" },
    // { id: "acl-13", name: "GT 5 Component", icon: "🧪", type: "line" },
    { id: "acl-14", name: "∆RR Growth Projections", icon: "📉", type: "line" },
    { id: "acl-15", name: "∆PR Growth Projections", icon: "📉", type: "line" },
    { id: "acl-16", name: "∆AR Growth Projections", icon: "📉", type: "line" },
  ];

  const activateUnitLevel = [
      { id: "aul-1", name: "Equivalent Growth Differentials (ΔGEQ)", icon: "📊", type: "scatter" },
      { id: "aul-2", name: "Receptive Growth Differentials (∆RR)", icon: "📊", type: "scatter" },
      { id: "aul-3", name: "Productive Growth Differentials (∆PR)", icon: "📊", type: "scatter" },
      { id: "aul-4", name: "Acuity Growth Differentials (∆AR)", icon: "📊", type: "scatter" },
      { id: "aul-5", name: "Performance Ratio (RR)", icon: "📈", type: "scatter" },
      { id: "aul-6", name: "Performance Ratios (PR)", icon: "📈", type: "scatter" },
      { id: "aul-7", name: "Performance Ratios (AR)", icon: "📈", type: "scatter" },
      { id: "aul-8", name: "Stability in Growth (STA-G)", icon: "🧭", type: "pie" },
  ];

  useEffect(() => {
    const fetchProjectionData = async () => {
      try {
        setLoading(true);
        const response = await getProjection(unitId, candidateId);
  
         // Extract PP IDs from the response
         if (response && response.length > 0) {
          const latestSession = response[0];
          if (latestSession.points) {
            extractPPIds(latestSession.points);
          }
        }
        
      } catch (error) {
        console.error("❌ Failed to fetch projection:", error);
      } finally {
        setLoading(false);
      }
    };
  
    if (unitId && candidateId) {
      fetchProjectionData();
    }
  }, [unitId, candidateId]);


  const extractPPIds = (points) => {
    const growthMetricData = [];

    points.forEach(point => {
      if (point.callout === "First PP Selection" || 
          point.callout === "Second PP Selection" || 
          point.callout === "Third PP Selection") {
            growthMetricData.push({
              ppId: point.ppId,
              dayCount: point.dayCount,
              deltaRRN: point.deltaRRN,
              deltaPRN: point.deltaPRN,
              deltaARN: point.deltaARN,
              callout: point.callout
            });
      }
    });

    growthMetricData.sort((a, b) => {
      const order = { "First PP Selection": 1, "Second PP Selection": 2, "Third PP Selection": 3 };
      return order[a.callout] - order[b.callout];
    });

    setGrowthMetric(growthMetricData);
    console.log("📊 Extracted growth metrics data:", growthMetricData);
  };

  console.log("pp id extract : ", growthMetric);


  // Update the useEffect that calculates projections
useEffect(() => {
  if (growthMetric.length === 3) {
    // Extract dayCounts
    const [x1, x2, x3] = growthMetric.map(m => m.dayCount);
    const x4 = x3 + 31; // Projection termination (31 days later)

    // ∆RR Growth Projections
    const [y1_RR, y2_RR, y3_RR] = growthMetric.map(m => parseFloat(m.deltaRRN));
    const rrCurves = calculateProjectionValues(y1_RR, y2_RR, y3_RR, 0, x1, x2, x3, x4);

    // ∆PR Growth Projections
    const [y1_PR, y2_PR, y3_PR] = growthMetric.map(m => parseFloat(m.deltaPRN));
    const prCurves = calculateProjectionValues(y1_PR, y2_PR, y3_PR, 0, x1, x2, x3, x4);

    // ∆AR Growth Projections
    const [y1_AR, y2_AR, y3_AR] = growthMetric.map(m => parseFloat(m.deltaARN));
    const arCurves = calculateProjectionValues(y1_AR, y2_AR, y3_AR, 0, x1, x2, x3, x4);

    // Normalize the data to sequential day counts starting from 1
    const normalizeCurves = (curves) => {
      return curves.map((item, index) => {
        // Get the x value from whichever segment property exists
        const xValue = item.i || item.j || item.k;
        // Get the linear and spline values from whichever segment property exists
        const linearValue = item.l1 || item.l2 || item.l3 || 0;
        const splineValue = item.s1 || item.s2 || item.s3 || 0;
        
        return {
          dayCount: index + 1, // Sequential day count starting from 1
          originalX: xValue,   // Keep original x for reference
          l: linearValue,
          s: splineValue
        };
      });
    };

    setCurves({
      rr: normalizeCurves(rrCurves),
      pr: normalizeCurves(prCurves),
      ar: normalizeCurves(arCurves),
    });

    console.log("📈 Normalized ∆RR Projections:", normalizeCurves(rrCurves));
    console.log("📈 Normalized ∆PR Projections:", normalizeCurves(prCurves).slice(0, 10));
    console.log("📈 Normalized ∆AR Projections:", normalizeCurves(arCurves).slice(0, 10));
    console.log("📈 Normalized ∆RR Projections curves->:", curves);
  }
}, [growthMetric]);
  

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
  
        const { results, cumulativeSums, average, stdDev, stdErr } = data;  
  
        const formattedData = results.map(row => ({
          ppId: row.ppId,
          dayCount: row.cumulativeDuration,
          ΔGEQ: row.GEQ || 0,
          ΔRR: row.deltaRRN || 0,
          ΔPR: row.deltaPRN || 0,
          ΔAR: row.deltaARN || 0,
          RR: row.RRN || 0,
          PR: row.PRN || 0,
          AR: row.ARN || 0,
          STAG: row.STAG || 0,
          IC: row.IC || 0,
          RRGT1: row.RRGT1 || 0, 
          PRGT1: row.PRGT1 || 0,
          ARGT1: row.ARGT1 || 0, 
          RRGT2: row.RRGT2 || 0, 
          PRGT2: row.PRGT2 || 0,
          ARGT2: row.ARGT2 || 0, 
          RRGT3: row.RRGT3 || 0, 
          PRGT3: row.PRGT3 || 0,
          ARGT3: row.ARGT3 || 0, 
          RRGT4: row.RRGT4 || 0, 
          PRGT4: row.PRGT4 || 0,
          ARGT4: row.ARGT4 || 0, 
          RRGT5: row.RRGT5 || 0, 
          PRGT5: row.PRGT5 || 0,
          ARGT5: row.ARGT5 || 0,
        }));
        
        setTableData(formattedData);
  
        // ✅ Calculate stability counts
        const stableCount = results.filter(r => r.STAG === "STABLE").length;
        const unstableCount = results.filter(r => r.STAG === "UNSTABLE").length;
  
        setStabilitySummary({ stable: stableCount, unstable: unstableCount });
  
        // console.log("✅ Stability Summary:", { stable: stableCount, unstable: unstableCount });
        
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

  console.log("values: ", tableData);
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
          
          ΔGEQ: parseFloat(data?.ΔGEQ) ?? null,
          ΔRR: parseFloat(data?.ΔRRN) ?? null,
          ΔPR: parseFloat(data?.ΔRRN) ?? null,
          ΔAR: parseFloat(data?.ΔARN) ?? null,
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

  const [selectedChart, setSelectedChart] = useState(null);
  console.log("filter data:", filters);

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
        <div className='w-6/12 lg:w-4/12 flex flex-col border-2 h-full border-gray-200  p-1'>
            <div className="flex items-center justify-between px-1 mx-1 text-gray-700">
              <h2 className="text-sm font-semibold">Plots</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => {}} title="Create Material" className='text-blue-600 hover:text-blue-800 cursor-pointer'>
                <RefreshCw className="w-4 h-4 hover:text-green-600" 
                  onClick={() => {
                    if (typeof onResetFilters === "function") {
                      onResetFilters(); // ✅ reset filters in parent
                    }
                  }} />
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
                  <div className="col-span-9 pl-2 py-1 text-left">Entities</div>
                  <div className="col-span-3 pl-1  py-1 text-left">ID</div>
                </div>
                
                {/* Scrollable Content */}
                <div className="overflow-y-auto max-h-[calc(100%-40px)]">
                  {selectedSort === 'activateCandidateLevel' && (
                    activateCandidateLevel.map((chart, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-12 items-center gap-2 px-2 py-1 cursor-pointer  ${selectedChart?.name === chart.name ? "bg-gray-100" : "hover:bg-gray-200"} `}
                        onClick={() => {
                          setSelectedChart(chart);
                        }}
                      > 
                        <div className="col-span-9 text-xs text-gray-700 truncate">📉{chart.name}</div>
                        <div className="col-span-3 pl-3 text-xs text-gray-400">{index +1}</div>
                      </div>
                    ))
                  )}
                  {selectedSort === 'activateUnitLevel' && (
                    activateUnitLevel.map((chart, index) => (
                      <div
                        key={index}
                        className={`grid grid-cols-12 items-center gap-2 px-2 py-1  cursor-pointer ${selectedChart?.name === chart.name ? "bg-gray-100" : "hover:bg-gray-200"} `}
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

            <div className="h-1/2 flex flex-col border border-gray-200 ">
              {/* Tab Buttons */}
              <div className="flex space-x-2 border-b p-2">
                <button
                  className={`px-3 py-1 text-sm whitespace-nowrap cursor-pointer ${activeAdjustPropertieTab === 'Property editor'
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

                <button
                  className={`px-3 py-1 text-sm  cursor-pointer ${activeAdjustPropertieTab === 'projections'
                    ? "text-black bg-white  border-t-2 border-blue-400 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 border-t border border-b-transparent border-gray-300 hover:bg-white"
                    }`}
                    onClick={() => {
                      setActiveAdjustPropertieTab('projections');
                      setShowProjectionTable(true); // ✅ Show modal
                    }}
                >
                  Projections
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

                  <div className="text-sm text-gray-600 mt-2 w-full overflow-auto mb-16">
                    <table className="table-auto w-full text-sm border-collapse">
                      <thead className="bg-gray-100">
                        <tr>
                        <th className="border border-gray-300 px-3 py-2 text-center">PP ID</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">X Value (Day Count)</th>
                          <th className="border border-gray-300 px-3 py-2 text-center">Y Value</th>
                        </tr>
                      </thead>
                      <tbody>
                      {selectedChart && tableData.length > 0 ? (
                        (() => {
                          // Extract key name inside parentheses — e.g., "ΔRR (deltaRRN)" → "deltaRRN"
                          const keyName = selectedChart.name.match(/\((.*?)\)/)?.[1] ?? null;
                          if (!keyName) {
                            return (
                              <tr>
                                <td colSpan="3" className="text-center text-gray-400 py-4 italic">
                                  Invalid chart selection
                                </td>
                              </tr>
                            );
                          }

                          // Create a dynamic list using the key name
                          const combinedData = tableData
                            .filter(row => row[keyName] !== undefined && !isNaN(row[keyName]) && row.ppId > 0)
                            .map(row => ({
                              ppId: row.ppId,
                              dayCount: row.dayCount,
                              value: row[keyName],
                            }));

                          return combinedData.length > 0 ? (
                            combinedData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-blue-50">
                                <td className="border border-gray-300 px-3 py-2 text-center">{row.ppId}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center">{row.dayCount}</td>
                                <td className="border border-gray-300 px-3 py-2 text-center">{row.value}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="text-center text-gray-400 py-4 italic">
                                No data available for {selectedChart.name}
                              </td>
                            </tr>
                          );
                        })()
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-gray-400 py-4 italic">
                            {selectedChart ? "No data available" : "Select a chart to display data"}
                          </td>
                        </tr>
                      )}
                      </tbody>
                    </table>
                  </div>
                )}
  
              </div>
            </div>
          </div>
        </div>

        <div className="w-6/12 lg:w-9/12 flex flex-col border-2 h-full border-gray-200  bg-gray-100 ml-1">

          <div className="h-full overflow-auto m-5">
            <div className="space-y-8">
              {selectedChart ? (
                (() => {
                  const projectionCharts = [
                    "∆RR Growth Projections",
                    "∆PR Growth Projections",
                    "∆AR Growth Projections",
                  ];

                  const isProjectionChart = projectionCharts.includes(selectedChart.name);

                  // 🆕 SEPARATE HANDLING FOR GROWTH PROJECTION CHARTS
                  if (isProjectionChart) {
                    let curveData = [];
                    let chartTitle = selectedChart.name;

                    if (selectedChart.name === "∆RR Growth Projections") {
                      curveData = curves.rr || [];
                    } else if (selectedChart.name === "∆PR Growth Projections") {
                      curveData = curves.pr || [];
                    } else if (selectedChart.name === "∆AR Growth Projections") {
                      curveData = curves.ar || [];
                    }

                    return (
                      <GrowthProjectionChart
                        data={curveData}
                        title={chartTitle}
                      />
                    );
                  }

                  // ✅ Existing chart handling for non-projection charts
                  const keyName = selectedChart.name.match(/\((.*?)\)/)?.[1];
                  if (!keyName) return <div className="text-gray-500">Invalid chart selection</div>;

                  const positiveData = [{ dayCount: 0, value: 0 }, ...tableData]
                    .filter(row => row.ppId > 0 && !isNaN(row[keyName]))
                    .map(row => ({ dayCount: row.dayCount, value: row[keyName] }));

                  if (selectedChart.type === "line") {
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
                          <LineChart 
                            data={positiveData}
                            margin={{ top: 20, right: 30, left: 0, bottom: 40 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis
                              type="number"
                              dataKey="dayCount"
                              domain={[0, "auto"]}
                              allowDataOverflow={true}
                            >
                              {(chartProperties.showLabel || chartProperties.labelType !== "X Type") && (
                                <Label value="Day Count" offset={-10} position="insideBottom" />
                              )}
                            </XAxis>

                            <YAxis
                              domain={[0, "auto"]}
                              allowDataOverflow={true}
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
                                stroke="#000000"
                                strokeWidth={2}
                                strokeDasharray="7 4 1 4"
                                label={{
                                  position: "right",
                                  fill: "#f59e0b",
                                  fontSize: 12,
                                }}
                              />
                            )}

                            {/* 🔵 Positive PP IDs */}
                            {chartProperties.visibility && (
                              <Line
                                type="linear"
                                dataKey="value"
                                stroke={chartProperties.positiveLineColor}
                                strokeWidth={chartProperties.lineThickness}
                                strokeDasharray={strokeDasharray}
                                dot={(props) => {
                                  const { index } = props;
                                  if (index % chartProperties.symbolFrequency !== 0) return null;
                                  return renderCustomDot(props, chartProperties.symbolColor);
                                }}
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
                            <XAxis type="number" dataKey="dayCount" name="PP ID" >
                              {(chartProperties.showLabel || chartProperties.labelType !== "X Type") && (
                                <Label value={`Day Count`} offset={-10} position="insideBottom" />
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
                            {chartProperties.visibility && (
                              <Scatter
                                name="Positive PP IDs"
                                data={positiveData}
                                fill={chartProperties.positiveLineColor}
                                shape={(props) => renderCustomDot(props, chartProperties.positiveLineColor)}
                              />
                            )}
                          </ScatterChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  }

                  if (selectedChart.type === "pie" && selectedChart.name.includes("Stability")) {
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
                              <Cell key="stable" fill="#10b981" />
                              <Cell key="unstable" fill="#ef4444" />
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

      <ProjectionTable
        visible={showProjectionTable}
        unitId= {unitId}
        candidateId= {candidateId}
        projectionData={tableData}
        onClose={() => {
          setShowProjectionTable(false) 
          setActiveAdjustPropertieTab('Table') }}
      />

    </>
  );
}
