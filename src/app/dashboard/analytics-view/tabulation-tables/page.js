"use client";
import { useEffect, useState } from "react";
import {
  Plus,
  X,
  ShieldUser,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import ViewerSelections from "./components/ViewerSelections";
import { useUnit } from "@/context/UnitContext";
import { getUniRostertByUnitId } from "@/services/unitRosterService";

export default function TabulationTables() {
  const tabs = [
    { label: "Session", path: "/dashboard/analytics-view/scoring-trends" },
  ];
  const pathname = usePathname();
  const currentTab =
    tabs.find((tab) => pathname?.startsWith(tab.path))?.label || "Session";
  const [activeTab, setActiveTab] = useState(currentTab);
  const [ViewerOpen, setViewerOpen] = useState(false);
  const [sortKey, setSortKey] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [data, setData] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const { selectedUnitId, setSelectedUnitId } = useUnit();

  // const data = [
  //   { id: 1, firstName: "John", lastName: "Doe", candidateStartDate: "2023-01-10", unitStartDate: "2023-01-15" },
  //   { id: 2, firstName: "Jane", lastName: "Smith", candidateStartDate: "2023-02-05", unitStartDate: "2023-02-10" },
  //   { id: 3, firstName: "Bob", lastName: "Johnson", candidateStartDate: "2023-03-12", unitStartDate: "2023-03-17" },
  //   { id: 4, firstName: "Alice", lastName: "Williams", candidateStartDate: "2023-04-01", unitStartDate: "2023-04-06" },
  //   { id: 5, firstName: "Charlie", lastName: "Brown", candidateStartDate: "2023-05-20", unitStartDate: "2023-05-25" },
  //   { id: 6, firstName: "David", lastName: "Jones", candidateStartDate: "2023-06-14", unitStartDate: "2023-06-19" },
  //   { id: 7, firstName: "Eva", lastName: "Miller", candidateStartDate: "2023-07-08", unitStartDate: "2023-07-13" },
  //   { id: 8, firstName: "Frank", lastName: "Davis", candidateStartDate: "2023-08-03", unitStartDate: "2023-08-08" },
  //   { id: 9, firstName: "Grace", lastName: "Wilson", candidateStartDate: "2023-09-11", unitStartDate: "2023-09-16" },
  //   { id: 10, firstName: "Henry", lastName: "Moore", candidateStartDate: "2023-10-27", unitStartDate: "2023-11-01" },
  // ];
  

  if(!selectedUnitId) {
    redirect('/dashboard/analytics-view'); 
  }


  const [unitData, setUnitData] = useState(null); 

  const [activeCandidateId, setActiveCandidateId] = useState(
    data.length > 0 ? data[0].id : null
  );

  useEffect(() => {
    if (activeCandidateId) {
      setViewerOpen(true); // ✅ show right panel
      const candidate = data.find((c) => c.id === activeCandidateId);
      setSelectedCandidate(candidate); // ✅ load candidate data
    }
  }, [activeCandidateId]);

  const [openMenu, setopenMenu] = useState(true);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };


  // Fetch candidates + unit details by selectedUnitId
  useEffect(() => {
    if (!selectedUnitId) return;

    const fetchRoster = async () => {
      try {
        setLoading(true);
        const roster = await getUniRostertByUnitId(selectedUnitId);

        if (!Array.isArray(roster) || roster.length === 0) {
          setUnitData(null);
          setData([]);
          // router.replace("/dashboard/control-view/unit");
          return;
        }

        // Extract unit (all rows share same unit)
        setUnitData(roster[0].unit);

        // Extract candidates
        const candidates = roster.map((r) => r.candidate);

        // Remove duplicates by candidate.id
        const uniqueCandidates = Array.from(
          new Map(candidates.map((c) => [c.id, c])).values()
        );

        // Sort by id ascending initially
        const sorted = [...uniqueCandidates].sort((a, b) => a.id - b.id);

        setData(sorted);
        setActiveCandidateId(sorted.length > 0 ? sorted[0].id : null);
      } catch (err) {
        console.error("Failed to fetch unit roster:", err);
        setError("Failed to load unit roster. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchRoster();
  }, [selectedUnitId]);

  const sortedData = [...data].sort((a, b) => {
    if (sortKey === "id") {
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    } else {
      const valA = a[sortKey].toLowerCase();
      const valB = b[sortKey].toLowerCase();
      return sortOrder === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }
  });

  

  return (
    <div className="w-full flex flex-col">
      <div className="h-full flex flex-col overflow-hidden mx-1 px-1 rounded-md">
        {/* Tab buttons
        <div className="flex space-x-0 px-0 pt-2 border-b border-gray-200 bg-gray-50 ">
          <div className="w-6/12 lg:w-3/12 flex flex-col border-r-2 h-full border-gray-200  p-1">
            {tabs.map((tab, index) => (
              <Link href={tab.path} key={index}>
                <span
                  onClick={() => setActiveTab(tab.label)}
                  className={
                    `relative px-5 py-2 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer ` +
                    (activeTab === tab.label
                      ? "text-blue-600 bg-white border border-b-transparent border-gray-300 rounded-t-lg shadow-sm"
                      : "text-gray-500 hover:text-blue-600 border-t border-r border-b-transparent border-gray-300 rounded-t-lg hover:bg-white")
                  }
                >
                  {tab.label}
                </span>
              </Link>
            ))}
          </div>
        </div> */}
        {/* Active tab content */}
        <div className="flex-1 overflow-auto bg-white  p-1">
          <div className="flex flex-col h-full">
            {/* Main Content */}
            <div className="flex h-full overflow-hidden w-full">
              {/* Sidebar */}
              <div className="w-6/12 lg:w-3/12 flex flex-col border-1 h-full border-gray-200  ">
                <div className="flex-grow border border-gray-200  flex flex-col h-full">
                  {/* Header */}
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 grid grid-cols-3 text-gray-600 font-semibold text-sm">
                    <div
                      onClick={() => handleSort("lastName")}
                      className="cursor-pointer flex items-center gap-1"
                    >
                      Last Name
                      {/* {" "}
                      {sortKey === "lastName" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )} */}
                    </div>
                    <div
                      onClick={() => handleSort("firstName")}
                      className="cursor-pointer flex items-center gap-1"
                    >
                      First Name
                      {/* {" "}
                      {sortKey === "firstName" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )} */}
                    </div>
                    <div
                      onClick={() => handleSort("id")}
                      className="cursor-pointer flex items-center gap-1"
                    >
                      Candidate ID
                      {/* {" "}
                      {sortKey === "id" ? (
                        sortOrder === "asc" ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )} */}
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto">
                    <div className=" px-3 py-1">
                      <div
                        className="flex items-center cursor-pointer select-none hover:bg-blue-50 rounded-md px-2 py-1"
                        onClick={() => setopenMenu(!openMenu)}
                      >
                        <span
                          className={`transition-transform duration-200 text-gray-600 mr-1 ${
                            openMenu ? "rotate-90" : "rotate-0"
                          }`}
                        >
                          ▶
                        </span>
                        <span
                          className={`text-md text-gray-600 ml-2 ${
                            openMenu ? "font-bold" : ""
                          }`}
                        >
                          Details
                        </span>
                      </div>

                      {openMenu && (
                        <>
                          <div className=" items-center justify-center  px-4 ">
                            <div className="border border-gray-200 p-1 ">
                              <span className="text-sm text-gray-400">
                                Unit Name: {unitData?.unitName}
                              </span>
                              <br />
                              <span className="text-sm text-gray-400">
                                Unit ID: {unitData?.unitId}
                              </span>
                              <br />
                              <span className="text-sm text-gray-400">
                                Unit Type: {unitData?.unitType}
                              </span>
                              <br />
                              <span className="text-sm text-gray-400">
                                Signature Profile: {unitData?.signatureProfile}
                              </span>
                            </div>
                          </div>
                          {/* Candidate Data */}
                          <div className="flex-1 overflow-auto px-4 py-2 space-y-1">
                            {sortedData.map((item) => (
                              <div
                                key={item.id}
                                className={`grid grid-cols-3 gap-2 items-center text-sm  px-2 py-1 cursor-pointer
                                ${activeCandidateId === item.id ?  "bg-blue-100 border-l-4 border-blue-400"
                                  : "hover:bg-gray-100"}`}
                                onDoubleClick={() => {
                                  setViewerOpen(true);
                                  setActiveCandidateId(item.id);
                                  const selectedCandidate = data.find(candidate => candidate.id === item.id);
                                    setSelectedCandidate(selectedCandidate);
                                  console.log(selectedCandidate);
                                }}
                              >
                                <span className="text-gray-800">
                                  {item.lastName}
                                </span>
                                <span className="text-gray-800">
                                  {item.firstName}
                                </span>
                                <span className="text-gray-600">{item.id}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Dropdown Content */}
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="w-6/12 lg:w-9/12 bg-white  flex flex-col border-1 h-full border-gray-200 ml-1 ">
                {ViewerOpen && <ViewerSelections candidate={selectedCandidate}  unitId={unitData?.id} />}
              </div>
            </div>
            {/* ------- */}
          </div>
        </div>
      </div>
    </div>
  );
}
