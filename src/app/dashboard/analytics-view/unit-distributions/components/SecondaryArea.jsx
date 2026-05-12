"use client";
import { Edit, X } from "lucide-react";
import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const SecondaryInputForm = ({ onClose }) => {
  const [ppIdFrom, setPpIdFrom] = useState(-3);
  const [ppIdTo, setPpIdTo] = useState(3);
  const [criticalDate, setCriticalDate] = useState("");
  const [thresholdEnabled, setThresholdEnabled] = useState(false);

  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const [valueOption, setValueOption] = useState("Omit Candidate");
  const [selectedPpId, setSelectedPpId] = useState("");

  // Example list of PP IDs (you can fetch these dynamically later)
  const availablePpIds = ["PP101", "PP102", "PP103", "PP104"];
  const candidate = {
    firstName: "John",
    lastName: "Doe",
    id: "001",
  };

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
        {/* Candidate Info */}
        <div className="gap-1 text-xs p-2">
 
          <p>First Name: {candidate.firstName}</p>
          <p>Last Name: {candidate.lastName}</p>
          <p>Candidate ID: {candidate.id}</p>
        </div>

        {/* Value Selection */}
        <div className="gap-1 text-xs p-2">
          <label className="block font-medium text-gray-700 mb-1">Value</label>
          <select
            value={valueOption}
            onChange={(e) => setValueOption(e.target.value)}
            className="border px-2 py-1 w-full"
          >
            <option>Omit Candidate</option>
            <option>Candidate Average</option>
            <option>Available +PP ID Listings</option>
          </select>
        </div>

        {/* Conditionally render PP ID selector */}
        {valueOption === "Available +PP ID Listings" && (
          <div className="gap-1 text-xs p-2">
            <label className="block font-medium text-gray-700 mb-1">
              Select PP ID
            </label>
            <select
              value={selectedPpId}
              onChange={(e) => setSelectedPpId(e.target.value)}
              className="border px-2 py-1 w-full"
            >
              <option value="">-- Select PP ID --</option>
              {availablePpIds.map((id) => (
                <option key={id} value={id}>
                  {id}
                </option>
              ))}
            </select>
          </div>
        )}
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
