"use client";
import { getUnitAndMultipleCandidateSummary } from "@/services/tabulationTableService";
import { Edit, X } from "lucide-react";
import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SecondaryInputForm = ({ onClose, selectedSort, onSubmit, resetSignal, unitId, candidateId }) => {
  const [ppIdFrom, setPpIdFrom] = useState(-3);
  const [ppIdTo, setPpIdTo] = useState(3);
  const [criticalDateFrom, setCriticalDateFrom] = useState("");
  const [criticalDateTo, setCriticalDateTo] = useState("");
  const [thresholdEnabled, setThresholdEnabled] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [secondaryValues, setSecondaryValues] = useState(null);
  const [growthMetrics, setGrowthMetrics] = useState({
    receptive: { cumulative: 0, average: 0 },
    productive: { cumulative: 0, average: 0 },
    acuity: { cumulative: 0, average: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPpIdFrom(-3);
    setPpIdTo(3);
    setCriticalDateFrom("");
    setCriticalDateTo("");
    setThresholdEnabled(false);
  }, [resetSignal]);
  

  const handleSubmit = (e) => {
    e.preventDefault();

    const values = {
      ppIdFrom,
      ppIdTo,
      criticalDateFrom,
      criticalDateTo,
      thresholdEnabled,
    };

    onSubmit(values);
    setSecondaryValues(values);
    // console.log("Submitted:", { ppIdFrom, ppIdTo, criticalDate });
    // You can add fetch or state update logic here
  };

  useEffect(() => {
    const fetchCumalativeData = async () => {
      if (!unitId || !candidateId) return;

      setLoading(true);
      setError(null);
  
      try {
        const data = await getUnitAndMultipleCandidateSummary({
          unitId,
          candidate_id: candidateId,
          ppIdFrom,
          ppIdTo,
          criticalRefDateFrom: criticalDateFrom || undefined,
          criticalRefDateTo: criticalDateTo || undefined,
        });
  
  
        const { cumulativeAverages, cumulativeSums } = data;
        
        
         // 🧠 Pick candidate-specific values (assuming one candidate at a time)
         const avg = cumulativeAverages?.find(a => a.candidateId == candidateId);
         const sum = cumulativeSums?.find(s => s.candidateId == candidateId);
 
         // ✅ Map to your local state structure
         setGrowthMetrics({
           receptive: {
             cumulative: sum?.deltaRRN ?? 0,
             average: avg?.deltaRRN ?? 0,
           },
           productive: {
             cumulative: sum?.deltaPRN ?? 0,
             average: avg?.deltaPRN ?? 0,
           },
           acuity: {
             cumulative: sum?.deltaARN ?? 0,
             average: avg?.deltaARN ?? 0,
           },
         });
  
  
        // console.log("✅ Stability Summary:", { stable: stableCount, unstable: unstableCount });
        
      } catch (err) {
        console.error("Failed to fetch tabulation data:", err);
        setError("Failed to load table data.");

        setTableData([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchCumalativeData();
  }, [unitId, candidateId, secondaryValues]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Section Header */}
      <div className="flex justify-between items-center bg-gray-100 px-4 py-1 border-b border-gray-300">
        <div className="flex items-center text-sm gap-2 text-gray-800 font-semibold">
          <Edit className="w-5 h-5" />
          Secondary Input Area
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-1 text-sm">
        {/* PP ID Range */}
        <div className="gap-1 text-xs p-2">
          <label className="block font-medium text-gray-700 mb-1">
            PP ID Range
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center ">
              <label htmlFor="" className="w-1/2">From:</label>
              <input
                type="number"
                value={ppIdFrom}
                onChange={(e) => {
                  const val = e.target.value;
                  setPpIdFrom(val === "" ? "" : parseInt(val));
                }}
                className="border px-2 py-1 w-full"
                placeholder="From (e.g., -3)"
              />
            </div>
            
            <div className="flex items-center ">
              <label htmlFor="" className="w-1/2">To:</label>
              <input
                type="number"
                value={ppIdTo}
                onChange={(e) => {
                  const val = e.target.value;
                  setPpIdTo(val === "" ? "" : parseInt(val));
                }} 
                className="border px-2 py-1 w-full"
                placeholder="To (e.g., 3)"
              />
            </div>
            
          </div>
        </div>


        {/* Critical Reference Date */}
        <div className="w-full gap-1 text-xs p-2">
          <label className="block font-medium text-gray-700 mb-1">
            Critical Reference Range
          </label>

          <div className="flex flex-col gap-2">
            <div className="flex items-center ">
              <label htmlFor="" className="w-1/2">From:</label>
              <input
                type="date"
                value={criticalDateFrom}
                onChange={(e) => setCriticalDateFrom(e.target.value)}
                className="border px-2 py-1 w-full" />
            </div>

            <div className="flex items-center ">
              <label htmlFor="" className="w-1/2">To:</label>
              <input
                type="date"
                value={criticalDateTo}
                onChange={(e) => setCriticalDateTo(e.target.value)}
                className="border px-2 py-1 w-full" />
            </div>
          </div>
        </div>


        {/* Threshold Toggle */}
        <div className="flex items-center justify-between p-2">
          <label className="font-medium text-gray-800">Enable Thresholds</label>

          {/* Toggle */}
          <div
            onClick={() => setThresholdEnabled(!thresholdEnabled)}
            className="relative w-12 h-6 cursor-pointer"
          >
            {/* Background track */}
            <div
              className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                thresholdEnabled ? "bg-gray-600" : "bg-gray-300"
              }`}
            />

            {/* Toggle knob */}
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                thresholdEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
        </div>


        {/* Candidate Level Section */}
        {selectedSort === "activateCandidateLevel" && (
          <div className="mt-2 flex flex-col gap-3">
            <div>
              <strong>Cumulative Growth For Receptive Ratio:</strong>
              <input
                readOnly
                value={growthMetrics.receptive.cumulative}
                className="border px-2 py-1 w-full"
              />
            </div>

            <div>
              <strong>Average Growth For Receptive Ratio:</strong>
              <input
                readOnly
                value={growthMetrics.receptive.average}
                className="border px-2 py-1 w-full"
              />
            </div>

            <div>
              <strong>Cumulative Growth For Productive Ratio:</strong>
              <input
                readOnly
                value={growthMetrics.productive.cumulative}
                className="border px-2 py-1 w-full"
              />
            </div>

            <div>
              <strong>Average Growth For Productive Ratio:</strong>
              <input
                readOnly
                value={growthMetrics.productive.average}
                className="border px-2 py-1 w-full"
              />
            </div>

            <div>
              <strong>Cumulative Growth For Acuity Ratio:</strong>
              <input
                readOnly
                value={growthMetrics.acuity.cumulative}
                className="border px-2 py-1 w-full"
              />
            </div>

            <div>
              <strong>Average Growth For Acuity Ratio:</strong>
              <input
                readOnly
                value={growthMetrics.acuity.average}
                className="border px-2 py-1 w-full"
              />
            </div>
          </div>
        )}

        

        {/* Threshold Toggle */}
        {/* <div className="flex items-center justify-between p-2">
          <label className="font-medium text-gray-800">Enable Thresholds</label>

          Toggle Wrapper
          <div
            onClick={() => setThresholdEnabled(!thresholdEnabled)}
            className="relative w-12 h-6 cursor-pointer"
          >
            Background track
            <div
              className={`absolute inset-0 rounded-full transition-colors duration-300 ${
                thresholdEnabled ? "bg-gray-600" : "bg-gray-300"
              }`}
            />

            Toggle knob
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                thresholdEnabled ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </div>
        </div> */}
      </div>
      {/* Submit Button */}
      <div className="border-t border-gray-200 p-2 bg-gray-50">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 text-sm transition-colors"
          >
            Submit
          </button>
        </div>
      </div>

    </div>
  );
};

export default SecondaryInputForm;
