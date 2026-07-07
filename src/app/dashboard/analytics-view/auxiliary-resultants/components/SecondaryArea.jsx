"use client";
import { Edit, X } from "lucide-react";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SecondaryInputForm = ({ onClose, selectedSort }) => {
  const [ppIdFrom, setPpIdFrom] = useState(-3);
  const [ppIdTo, setPpIdTo] = useState(3);
  const [criticalDate, setCriticalDate] = useState("");
  const [thresholdEnabled, setThresholdEnabled] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Sample effort values
  const csdEffort = "1.234";
  const usdEffort = "5.678";

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted:", { ppIdFrom, ppIdTo, criticalDate });
    // You can add fetch or state update logic here
  };

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
                onChange={(e) => setPpIdFrom(parseInt(e.target.value))}
                className="border px-2 py-1 w-full"
                placeholder="From (e.g., -3)"
              />
            </div>
            
            <div className="flex items-center ">
              <label htmlFor="" className="w-1/2">To:</label>
              <input
                type="number"
                value={ppIdTo}
                onChange={(e) => setPpIdTo(parseInt(e.target.value))}
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
                value={criticalDate}
                onChange={(e) => setCriticalDate(e.target.value)}
                className="border px-2 py-1 w-full" />
            </div>

            <div className="flex items-center ">
              <label htmlFor="" className="w-1/2">From:</label>
              <input
                type="date"
                value={criticalDate}
                onChange={(e) => setCriticalDate(e.target.value)}
                className="border px-2 py-1 w-full" />
            </div>
          </div>
        </div>

        {/* Effort Fields – only show if candidate level */}
        {selectedSort === "activateCandidateLevel" && (
          <>


            <div className="gap-1 text-xs p-2 w-full">
              <label className="block font-medium text-gray-700 mb-1">
                Effort - CSD
              </label>
              <input
                type="text"
                value={csdEffort}
                disabled
                className="border px-2 py-1 w-full text-gray-600"
              />
            </div>





            <div className="gap-1 text-xs p-2 w-full">
              <label className="block font-medium text-gray-700 mb-1">
                Effort - USD
              </label>
              <input
                type="text"
                value={usdEffort}
                disabled
                className="border px-2 py-1 w-full text-gray-600"
              />
            </div>



          </>
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
