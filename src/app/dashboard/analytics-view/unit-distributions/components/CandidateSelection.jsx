"use client";
import { useState } from "react";
import { X } from "lucide-react";

export default function CandidateSelectionTable({ onClose }) {
  const ppIdOptions = ["1", "2", "3", "4", "5"];

  const [rows, setRows] = useState([
    { id: 1, lastName: "Smith", firstName: "John", candidateId: "C001", value: "Omit", ppListings: "", isSelected: false },
    { id: 2, lastName: "Doe", firstName: "Jane", candidateId: "C002", value: "Omit", ppListings: "", isSelected: false },
    { id: 3, lastName: "Brown", firstName: "Alice", candidateId: "C003", value: "Omit", ppListings: "", isSelected: false },
    { id: 4, lastName: "Johnson", firstName: "Mike", candidateId: "C004", value: "Omit", ppListings: "", isSelected: false },
  ]);

  const handleValueChange = (id, newValue) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id === id) {
          if (newValue === "Candidate Average") {
            // Automatically populate sample numbers
            return { ...row, value: newValue, ppListings: "75" , isSelected: false};
          } else {
            return { ...row, value: newValue, ppListings: "", isSelected: false };
          }
        }
        return row;
      })
    );
  };

  const handlePPChange = (id, value) => {
    setRows((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ppListings: value } : row))
    );
  };

  const handleRowClick = (id) => {
    setRows((prev) =>
      prev.map((row) =>
        row.id === id && row.value !== "Omit"
          ? { ...row, isSelected: !row.isSelected }
          : row
      )
    );
  };

  const handleCloseClick = () => {
    const selectedRows = rows.filter((row) => row.isSelected);
    onClose(selectedRows); // pass selected rows to parent
  };

  const selectedCount = rows.filter(row => row.isSelected).length;
  const isSubmitEnabled = selectedCount >= 3;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white shadow-xl w-11/12 max-w-4xl max-h-[80vh] overflow-auto">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b bg-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Distribution Form</h2>
          <X className="w-5 h-5 text-gray-500 hover:bg-gray-400 cursor-pointer" onClick={handleCloseClick} />
        </div>

        {/* Table */}
        <div className="p-4">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">Last Name</th>
                <th className="px-4 py-2 border">First Name</th>
                <th className="px-4 py-2 border">Candidate ID</th>
                <th className="px-4 py-2 border">Selection</th>
                <th className="px-4 py-2 border">Value</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.id}
                  onClick={() => handleRowClick(row.id)}
                  className={`cursor-pointer ${row.isSelected ? "bg-gray-100 " : ""} ${row.value === "Omit" ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <td className="px-4 py-2 border text-center">{row.lastName}</td>
                  <td className="px-4 py-2 border text-center">{row.firstName}</td>
                  <td className="px-4 py-2 border text-center">{row.candidateId}</td>
                  <td className="px-4 py-2 border text-center">
                    <select
                      className="border rounded p-1"
                      value={row.value}
                      onChange={(e) => handleValueChange(row.id, e.target.value)}
                    >
                      <option value="Omit">Omit Candidate</option>
                      <option value="Candidate Average">Candidate Average</option>
                      <option value="Available + PP ID Listings">Available by PP ID</option>
                    </select>
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {row.value === "Available + PP ID Listings" && (
                      <select
                        className="border rounded p-1 w-full"
                        value={row.ppListings}
                        onChange={(e) => handlePPChange(row.id, e.target.value)}
                      >
                        <option value="">Select PP ID</option>
                        {ppIdOptions.map((pp) => (
                          <option key={pp} value={pp}>{pp}</option>
                        ))}
                      </select>
                    )}
                    {row.value === "Candidate Average" && (
                      <span className="block text-center">{row.ppListings}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t flex justify-end">
          <button
            onClick={handleCloseClick}
            disabled={!isSubmitEnabled}
            className={`px-2 py-2 text-white ${isSubmitEnabled ? "bg-gray-400 hover:bg-gray-500" : "bg-gray-300 cursor-not-allowed"}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
