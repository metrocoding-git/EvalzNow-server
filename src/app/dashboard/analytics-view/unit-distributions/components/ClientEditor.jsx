"use client";
import { Edit } from "lucide-react";
import React, { useEffect, useState } from "react";

export default function ClientEditor({ showForm, onClose, selectedCandidates }) {
  const ppIdOptions = ["1", "2", "3", "4", "5", "6"];

  const [candidateData, setCandidateData] = useState([]);

  useEffect(() => {
    if (selectedCandidates?.length) {
      // Initialize with incoming candidates
      setCandidateData(
        selectedCandidates.map((c) => ({
          ...c,
          valueOption: c.value || "Omit Candidate",
          ppListingsValue: c.ppListings || "",
        }))
      );
    }
  }, [selectedCandidates]);

  const handleValueChange = (index, newValue) => {
    setCandidateData((prev) =>
      prev.map((c, i) =>
        i === index
          ? { ...c, valueOption: newValue, ppListingsValue: "" }
          : c
      )
    );
  };

  const handlePpListingsChange = (index, newValue) => {
    setCandidateData((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ppListingsValue: newValue } : c))
    );
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center bg-gray-100 px-4 py-1.5 border-b border-gray-300">
        <div className="flex items-center gap-2 text-black font-semibold text-sm">
          <Edit className="w-4 h-4" />
          Entity Editor
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 text-sm">
        {candidateData.map((candidate, index) => (
          <div key={candidate.id} className="mb-4 border-b pb-2">
            {/* Read-only candidate info */}
            <div className="flex flex-col gap-1 text-xs p-2">
              <p>Last Name: {candidate.lastName}</p>
              <p>First Name: {candidate.firstName}</p>
              <p>Candidate ID: {candidate.candidateId}</p>
            </div>

            {/* Value selection */}
            <div className="gap-1 text-xs p-2">
              <label className="block font-medium text-gray-700 mb-1">Value</label>
              <select
                value={candidate.valueOption}
                onChange={(e) => handleValueChange(index, e.target.value)}
                className="border px-2 py-1 w-full"
              >
                <option value="Omit Candidate">Omit Candidate</option>
                <option value="Candidate Average">Candidate Average</option>
                <option value="Available + PP ID Listings">Available + PP ID Listings</option>
              </select>
            </div>

            {/* Conditional field */}
            {candidate.valueOption === "Candidate Average" && (
              <div className="gap-1 text-xs p-2">
                <label className="block font-medium text-gray-700 mb-1">Average Value</label>
                <input
                  type="text"
                  value={candidate.ppListingsValue}
                  onChange={(e) => handlePpListingsChange(index, e.target.value)}
                  className="border px-2 py-1 w-full"
                />
              </div>
            )}

            {candidate.valueOption === "Available + PP ID Listings" && (
              <div className="gap-1 text-xs p-2">
                <label className="block font-medium text-gray-700 mb-1">Select PP ID</label>
                <select
                  value={candidate.ppListingsValue}
                  onChange={(e) => handlePpListingsChange(index, e.target.value)}
                  className="border px-2 py-1 w-full"
                >
                  <option value="">-- Select PP ID --</option>
                  {ppIdOptions.map((id) => (
                    <option key={id} value={id}>
                      {id}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        ))}

        {/* Buttons */}
        <div className="col-span-2 pt-4 flex justify-end gap-2">
          <button
            type="button"
            className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-xs transition-colors"
            onClick={() => console.log("Form data:", candidateData)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
