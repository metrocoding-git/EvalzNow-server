

"use client";
import { Edit, X } from "lucide-react";
import { useState } from "react";

const SecondaryInputForm = ({ onClose }) => {
  const [ppIdFrom, setPpIdFrom] = useState(-3);
  const [ppIdTo, setPpIdTo] = useState(3);
  const [criticalDate, setCriticalDate] = useState("");
  const [thresholdEnabled, setThresholdEnabled] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted:", { ppIdFrom, ppIdTo, criticalDate });
    // You can add fetch or state update logic here
  };

  return (
    <div className="border-2 border-blue-500 rounded-md flex flex-col">
      {/* Section Header */}
      <div className="flex justify-between items-center bg-blue-100 px-4 py-2 border-b border-blue-300">
        <div className="flex items-center gap-2 text-blue-800 font-semibold">
          <Edit className="w-5 h-5" />
          Secondary Input Area
        </div>
        <button onClick={onClose} className="text-red-500 hover:text-red-700 text-sm hover:bg-red-100 rounded-full p-1 cursor-pointer">
          <X className="w-4 h-4 " />
        </button>
      </div>

      {/* PP ID Range */}
      <div className=" gap-1 text-xs p-2">
        <label className="block font-medium text-gray-700 mb-1">
          PP ID Range
        </label>
        <label className="block text-red-600 font-sm mb-1">
          View the plot by continuous PP ID range, this includes negative and
          positive PP IDs.
        </label>


        <input
          type="number"
          value={ppIdFrom}
          onChange={(e) => setPpIdFrom(parseInt(e.target.value))}
          className=" border rounded px-2 py-1 w-1/2"
          placeholder="From (e.g., -3)"
        />
        <input
          type="number"
          value={ppIdTo}
          onChange={(e) => setPpIdTo(parseInt(e.target.value))}
          className="border rounded px-2 py-1 w-1/2"
          placeholder="To (e.g., 3)"
        />

      </div>

      {/* Critical Reference Date */}
      <div className="w-full gap-1 text-xs p-2">
          <label className="block font-medium text-gray-700 mb-1">
            Critical Reference Range
          </label>

          
          {/* <DatePicker className="border px-2 py-1 w-full"
            selectsRange
            startDate={startDate}
            endDate={endDate}
            onChange={(dates) => {
              const [start, end] = dates;
              setStartDate(start);
              setEndDate(end);
            }}
            isClearable
            placeholderText="MM/DD/YYYY - MM/DD/YYYY"
            /> */}
          
          <div className="flex gap-2 w-full">
            <div className=" w-1/2 ">
                <input
                type="date"
                value={criticalDate}
                onChange={(e) => setCriticalDate(e.target.value)}
                className="border px-2 py-1 w-full" />
            </div>
          
            <div className="w-1/2">
                <input
                type="date"
                value={criticalDate}
                onChange={(e) => setCriticalDate(e.target.value)}
                className="border px-2 py-1 w-full" />
            </div>
          </div>
        </div>

      {/* Threshold Toggle */}
      <div className="flex items-center justify-between  p-2 rounded">
        <label className="font-medium text-gray-800">Enable Thresholds</label>
        <div className="relative w-12 h-6">
          {/* Background track */}
          <div
            className={`absolute inset-0 rounded-full transition-colors duration-300 ${thresholdEnabled ? "bg-green-500" : "bg-gray-300"
              }`}
          ></div>

          {/* Toggle knob */}
          <div
            onClick={() => setThresholdEnabled(!thresholdEnabled)}
            className={`absolute top-0 w-6 h-6 bg-white border border-gray-300 rounded-full shadow transform transition-transform duration-300 cursor-pointer ${thresholdEnabled ? "translate-x-0" : "translate-x-6"
              }`}
          ></div>
        </div>
      </div>


      {/* Submit Button */}
      <div className="flex justify-end gap-2 p-2 pr-3 border-t bg-gray-100">
        <button
          onClick={handleSubmit}
          className="px-3 py-1 text-sm bg-blue-600 text-white border border-blue-700 rounded hover:bg-blue-700 w-full"
        >
          Submit
        </button>
      </div>


    </div>
  );
}



export default SecondaryInputForm;
