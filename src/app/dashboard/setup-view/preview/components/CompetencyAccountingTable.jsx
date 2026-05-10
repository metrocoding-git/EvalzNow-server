import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Search,
  X,
  FolderSync,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { getPpIdSummary } from "@/services/insertScoreService";
import { useSearchParams } from "next/navigation";
import { useUnit } from "@/context/UnitContext";

const CompetencyAccountingTable = ({ data, candidateId }) => {
  const [selectedRow, setSelectedRow] = useState(null);
  const [activeTab, setActiveTab] = useState("Indirect");
  const [filteredData, setFilteredData] = useState([]);
  const [ppSummary, setPpSummary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // const searchParams = useSearchParams();
  const { selectedUnitId, setSelectedUnitId } = useUnit();
  const unitId = selectedUnitId;


  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveRowUp();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        moveRowDown();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedRow, filteredData]);

  useEffect(() => {
    const fetchPpIdSummary = async () => {
      if (!unitId || !candidateId) return; // only fetch if both exist
      try {
        setLoading(true);
        const summary = await getPpIdSummary(unitId, candidateId);
        setPpSummary(Array.isArray(summary) ? summary : [summary]);
        console.log("pp id summary: ->", summary);
      } catch (err) {
        console.error("Failed to fetch PP summary:", err);
        setError("Failed to load PP summary");
        setPpSummary([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPpIdSummary();
  }, [unitId, candidateId]); // ✅ re-fetch every time candidateId changes
  
  
    // Filter data based on active tab
    useEffect(() => {
      const filtered = ppSummary
        .filter((row) => {
          const ppId = String(row.ppId || "");
          return activeTab === "Indirect"
            ? ppId.startsWith("-")
            : !ppId.startsWith("-");
        })
        .sort((a, b) => {
          const numA = Number(a.ppId);
          const numB = Number(b.ppId);
    
          if (activeTab === "Indirect") {
            return Math.abs(numA) - Math.abs(numB); // ✅ -1, -2, -3
          } else {
            return numA - numB; // ✅ 1, 2, 3
          }
        });
    
      setFilteredData(filtered);
      setSelectedRow(null);
    }, [ppSummary, activeTab]);
    

    useEffect(() => {
      console.log("ppSummary from backend:", ppSummary);
    }, [ppSummary]);
    

  const moveRowUp = () => {
    if (selectedRow === null) {
      // If nothing selected, select the last row
      setSelectedRow(filteredData.length - 1);
    } else if (selectedRow > 0) {
      setSelectedRow(selectedRow - 1);
    }
  };

  const moveRowDown = () => {
    if (selectedRow === null) {
      // If nothing selected, select the first row
      setSelectedRow(0);
    } else if (selectedRow < filteredData.length - 1) {
      setSelectedRow(selectedRow + 1);
    }
  };

  const handleRowClick = (index) => {
    setSelectedRow(index === selectedRow ? null : index);
  };

  const handleDelete = () => {
    if (selectedRow !== null) {
      // Here you would typically update your data state
      // For now, we'll just deselect
      setSelectedRow(null);
    }
  };

  return (
    <div className=" border border-gray-300 flex flex-col m-1">
      {/* Tab Buttons */}
      <div className="flex flex-col">
      
        <div className="flex items-center justify-between border-b p-1 bg-gray-100">
          {/* Tab Buttons */}
          <div className="flex space-x-2">
            <button
              className={`px-3 py-1 text-sm cursor-pointer ${
                activeTab === "Indirect"
                  ? "bg-white border-t-2 border-blue-400 text-gray-800 font-semibold"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("Indirect")}
            >
             Indirect Performance Point (Master)

            </button>
            <button
              className={`px-3 py-1 text-sm cursor-pointer ${
                activeTab === "Direct"
                  ? "bg-white border-t-2 border-blue-400 text-gray-800 font-semibold"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => setActiveTab("Direct")}
            >
              Direct Performance Point (Master)
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
      <table className="min-w-full table-auto text-sm text-left border-collapse">
        <thead className="bg-gray-100 text-gray-900">
          <tr className="border-b border-gray-200">
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Master PP ID Callout</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Short Description</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Duration</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Critical Reference Date</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Missing Competencies</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Error</th>
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {filteredData.length > 0 ? (
            filteredData.map((row, index) => (
              <tr
                key={row.ppId}
                className={`border-t border-gray-100 hover:bg-gray-50 transition ${
                  index === selectedRow ? "bg-gray-100" : ""
                }`}
                onClick={() => handleRowClick(index)}
              >
                <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.ppId}</td>
                <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.shortDescription || "N/A"}</td>
                <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.totalDuration !== null && row.totalDuration !== undefined ? Number(row.totalDuration).toFixed(2) : "N/A"}</td>
                <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.latestCriticalRefDate
                  ? new Date(row.latestCriticalRefDate).toLocaleDateString()
                  : "-"}
                </td>
                <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.missingCompetency || "None"}</td>
                <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">  {row.error}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                No data available for {activeTab === "Indirect" ? "Indirect" : "Direct"} Performance Points
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
};

export default CompetencyAccountingTable;