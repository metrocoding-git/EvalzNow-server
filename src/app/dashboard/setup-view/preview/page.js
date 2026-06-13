"use client";

import { useState, useEffect } from "react";
import { ChevronRight, Plus, Search } from "lucide-react";
import CompetencyAccountingTable from "./components/CompetencyAccountingTable";
import MasterPpIdBinTable from "./components/MasterPpIdBinTable";
import ClientEditor from "../../analytics-view/components/ClientEditor";
import { useSearchParams } from "next/navigation";
import { getUniRostertByUnitId } from "@/services/unitRosterService";
import { useUnit } from "@/context/UnitContext";

const masterPPIDData = [
  {
    ppId: -2,
    unitName: "Unit A",
    unitId: "UA123",
    unitType: "Communicative I/O",
    attainedListeningScore: 85,
    maxListeningScore: 100,
    attainedReadingScore: 78,
    maxReadingScore: 100,
    attainedSpeakingScore: 92,
    maxSpeakingScore: 100,
    attainedWritingScore: 88,
    maxWritingScore: 100,
  },
  {
    ppId: 1,
    unitName: "Unit B",
    unitId: "UB456",
    unitType: "Communicative I/O",
    attainedListeningScore: 85,
    maxListeningScore: 88,
    attainedReadingScore: 78,
    maxReadingScore: 100,
    attainedSpeakingScore: 81,
    maxSpeakingScore: 79,
    attainedWritingScore: 92,
    maxWritingScore: 90,
  },
  {
    ppId: 1,
    unitName: "Unit C",
    unitId: "UC789",
    unitType: "Communicative I/O",
    attainedListeningScore: 95,
    maxListeningScore: 100,
    attainedReadingScore: 78,
    maxReadingScore: 73,
    attainedSpeakingScore: 92,
    maxSpeakingScore: 80,
    attainedWritingScore: 59,
    maxWritingScore: 70,
  },
];


const competencyData = [
  {
    ppId: -2,
    shortDescription: "Short desc 1",
    duration: 3,
    criticalRefDate: "2025-07-01",
    missingCompetencies: "Writing",
    error: "Yes",
  },
  {
    ppId: 1,
    shortDescription: "Short desc 2",
    duration: 5,
    criticalRefDate: "2025-07-22",
    missingCompetencies: "None",
    error: "No",
  },

];

const activatedCandidates = [
  {
    lastName: "John",
    firstName: "Doe",
    ppId: 1,
    status: "Activated",
  },
  {
    lastName: "Jane",
    firstName: "Smith",
    ppId: 2,
    status: "Activated",
  },
];

export default function PreviewPage() {
  const [open, setOpen] = useState(true);
  const [sortKey, setSortKey] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [candidateList, setCandidateList] = useState([]);
  const [unitData, setUnitData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { selectedUnitId, setSelectedUnitId } = useUnit();
  // const searchParams = useSearchParams();
  const unitQuery = selectedUnitId;
  const [searchTerm, setSearchTerm] = useState("");

  const sortedCandidates = [...candidateList].sort((a, b) => {
    const valA = a[sortKey];
    const valB = b[sortKey];
    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  useEffect(() => {
    const fetchCandidateByUnitId = async () => {
      if (!unitQuery) return;
  
      try {
        setLoading(true);
        const data = await getUniRostertByUnitId(unitQuery) || [];
  
        if (!Array.isArray(data) || data.length === 0) {
          setUnitData(null);
          setCandidateList([]);
          return;
        }
  
        // Extract unit data from the first row
        setUnitData(data[0].unit || null);
  
        // Extract candidate data
        const candidates = data.map(item => item.candidate);
  
        // Remove duplicates by candidate id
        const uniqueCandidates = Array.from(
          new Map(candidates.map(c => [c.id, c])).values()
        );
  
        setCandidateList(uniqueCandidates);
  
        console.log("Unit Data:", data[0].unit);
        console.log("Candidate List:", uniqueCandidates);
      } catch (err) {
        console.error("Failed to fetch unit roster:", err);
        setError("Failed to load unit roster. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchCandidateByUnitId();
  }, [unitQuery]);




  // Select first candidate on page load
  useEffect(() => {
    if (sortedCandidates.length > 0 && !selectedCandidate) {
      setSelectedCandidate(sortedCandidates[0]);
    }
  }, [sortedCandidates, selectedCandidate]);

  const filteredData = sortedCandidates.filter((item) => {
    const term = searchTerm.toLowerCase();
    return (
      item.firstName?.toLowerCase().includes(term) ||
      item.lastName?.toLowerCase().includes(term) ||
      String(item.id).includes(term) // ✅ match numeric ID
    );
  });

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-6/12 lg:w-3/12 flex flex-col border-2 h-full border-gray-200">
        <div className="flex-grow flex flex-col">
          {/* Header */}
          <div className="flex flex-col justify-between items-center bg-gray-100 px-4 py-2 border-b border-gray-300">
            <div className="relative w-full mb-2">
              <input
                type="text"
                className="border w-full pl-2 pr-8 py-1 text-sm bg-white"
                placeholder="Search"
                value={searchTerm}                 // ✅ Controlled input
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            </div>
            <div className="grid grid-cols-3 gap-1 text-gray-800 font-semibold text-sm w-full">
              {["firstName", "lastName", "id"].map((col) => (
                <button
                  key={col}
                  onClick={() => handleSort(col)}
                  className="flex items-center space-x-1 hover:underline"
                >
                  <span className="capitalize">
                    {col === "id" ? "Candidate ID" : col.replace(/([A-Z])/g, " $1")}
                  </span>
                </button>
              ))}
            </div>

            {/* <button
              onClick={() => console.log("Add")}
              className="hover:bg-gray-300 text-gray-950 text-sm p-1 ml-2"
            >
              <Plus className="w-4 h-4" />
            </button> */}
          </div>

          {/* Dropdown toggle */}
          <div
            className="flex items-center cursor-pointer select-none hover:bg-gray-50 px-4 py-2"
            onClick={() => setOpen(!open)}
          >
            <span
              className={`transition-transform duration-200 text-gray-600 mr-1 ${open ? "rotate-90" : "rotate-0"
                }`}
            >
              <ChevronRight />
            </span>
            <span
              className={`text-md text-gray-800 ml-2 ${open ? "font-bold text-black" : ""
                }`}
            >
              Details
            </span>
          </div>

          {/* Candidate List */}
          {open && (
            <div className="p-2 space-y-1">
              {/* Session Info */}
              <div className="px-4 ">
                {unitData?.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500">
                      No Unit Selected.
                    </div>
                    ) : (
                  <div className="border border-gray-200 p-2 ">
                  <p className="text-sm text-gray-600">
                        Unit Name: {unitData?.unitName || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit ID: {unitData?.unitId || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit Type: {unitData?.unitType || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Signature Profile: {unitData?.signatureProfile || "N/A"} 
                      </p>
                  </div>
                )}
              </div>

              {filteredData.length === 0 ? (
                <div className="px-4 py-3 text-center text-gray-500">
                No candidates found for this unit.
              </div>
              ) : (
                filteredData.map((candidate) => (
                  <div
                    key={candidate.id} // use unique ppId
                    onClick={() => setSelectedCandidate(candidate)}
                    className={`grid grid-cols-3 text-sm gap-2 px-3 py-1 cursor-pointer transition-colors duration-150 ${
                      selectedCandidate?.id === candidate.id
                        ? "bg-blue-100 border-l-4 border-blue-400 font-semibold"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <div>{candidate.lastName}</div>
                    <div>{candidate.firstName}</div>
                    <div>{candidate.id}</div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Editor Panel */}
          {/* <div className="h-2/5 overflow-auto my-2">
            <ClientEditor
              onClose={() => setShowEdit(false)}
              entity={selectedCandidate}
              showForm={showEdit}
            />
          </div> */}
        </div>



      </div>

      {/* Right Panel */}
      <div className="flex-1 bg-white flex flex-col border-l border-gray-200 ml-1 overflow-y-auto">
        <h2 className="text-md font-bold bg-gray-100 p-0.5  flex items-center border-b border-gray-200">
          <span className="pl-2 text-md text-gray-800">Preliminary Checkpoints</span>
          <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
        </h2>

        {selectedCandidate && (
          <>
            {/* Master PP ID Bin Totals */}
            <div className="h-1/2 overflow-hidden border border-gray-300 m-1 flex flex-col">

              <div className="flex items-center justify-between border-b-1 border-gray-400 mb-1 px-1 mx-1 mt-1 text-gray-700">
                <h2 className="text-sm font-semibold mx-1"> Master PP ID Bin Totals</h2>
              </div>

              <MasterPpIdBinTable data={masterPPIDData} />
            </div>

            {/* Competency Accounting Table */}
            <div className="h-1/2 overflow-hidden border border-gray-300 m-1 flex flex-col"> 
              <CompetencyAccountingTable data={competencyData} candidateId={selectedCandidate?.id} />
            </div>
          </>
        )}

      </div>
    </div>
  );
}
