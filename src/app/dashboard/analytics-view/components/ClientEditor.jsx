"use client";
import React, { useState, useEffect } from "react";
import { Edit, ListFilterPlus } from "lucide-react";

const generateExecutiveId = () => {
  return Math.random().toString(36).substring(2, 12).toUpperCase();
};

const companySizes = [
  "Tier 1 - Micro-Size: 1-4 Candidates",
  "Tier 2 - Small-Size : 5-19 Candidates",
  "Tier 3 - Medium-Size : 20-99 Candidates",
  "Tier 4 - Large-Size : 100-249 Candidates",
  "Tier 5 - Low Enterprise : 250-999 Candidates",
  "Tier 6 - High Enterprise : 1000-2499 Candidates",
  "Tier 7 - Small Campus : 2500-4999 Candidates",
  "Tier 8 - Medium Campus : 5000-14999 Candidates",
  "Tier 9 - Large Campus : 15000-50000 Candidates",
  "Tier 10 - Mass Network : > 50000 Candidates",
];

export default function ClientEditor({ client, onClose }) {
  const [form, setForm] = useState({});
  const [executiveId, setExecutiveId] = useState("");

  useEffect(() => {
    setExecutiveId(generateExecutiveId());
  }, []);

  const handleChange = (label, value) => {
    setForm((prev) => ({ ...prev, [label]: value }));
  };

   return (
    <div className="h-full flex flex-col">
      <div className="flex items-center bg-gray-100 px-4 py-1.5 border-1 border-gray-200">
        <div className="flex items-center gap-2 text-black font-semibold text-sm">
          <Edit className="w-4 h-4" />
          Entity Editor
        </div>
      </div>

      {!client ? (
        <div className="flex-1 p-4 text-gray-500 text-sm flex items-center justify-center">
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-1 text-xs p-2 h-full">
            {[
              "Executive Last Name",
              "Executive First Name", 
              "Executive Job Title",
              "Executive E-mail Address",
              "Company Name",
              "Company Contact Number",
              "Institutional Type",
              "Business Registration No.",
              "Country",
            ].map((label, idx) => (
              <React.Fragment key={idx}>
                <label className="col-span-1 flex items-center text-gray-700">{label}:</label>
                <input
                  type="text"
                  defaultValue={label === "Executive Last Name" ? client.lastName : 
                              label === "Executive First Name" ? client.firstName : ""}
                  className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
                  onChange={(e) => handleChange(label, e.target.value)}
                />
              </React.Fragment>
            ))}

            {/* Executive ID - generated, non-editable */}
            <label className="col-span-1 flex items-center text-gray-700">Executive ID:</label>
            <input
              type="text"
              value={client.id}
              disabled
              className="col-span-1 border border-gray-300 px-2 py-1 bg-gray-100 text-xs"
            />

            {/* Company Size Dropdown */}
            <label className="col-span-1 flex items-center text-gray-700">Company Size:</label>
            <select
              className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              onChange={(e) => handleChange("Company Size", e.target.value)}
            >
              <option value="">Select Size</option>
              {companySizes.map((size, i) => (
                <option key={i} value={size}>
                  {size}
                </option>
              ))}
            </select>

            {/* Status Toggle */}
            <label className="col-span-1 flex items-center text-gray-700">Status:</label>
            <select
              className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-gray-400"
              onChange={(e) => handleChange("Status", e.target.value)}
            >
              <option value="Activate">Activate</option>
              <option value="Deactivate">Deactivate</option>
            </select>

            {/* Buttons */}
            <div className="col-span-2 pt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  // Save form data here if needed
                  console.log("Saving client data:", form);
                }}
                className="px-4 py-1 bg-gray-200 hover:bg-gray-300 text-xs transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
