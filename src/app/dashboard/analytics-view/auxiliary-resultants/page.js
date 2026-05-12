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
import SecondaryArea from "./components/SecondaryArea";
import PlotSelections from "./components/PlotSelections";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuxiliaryResultants() {
  const tabs = [
    { label: "Session", path: "/dashboard/analytics-view/scoring-trends" },
  ];

  const pathname = usePathname();
  const currentTab =
    tabs.find((tab) => pathname?.startsWith(tab.path))?.label || "Session";

  const [selectedSort, setSelectedSort] = useState("activateCandidateLevel");

  
  const [activeTab, setActiveTab] = useState(currentTab);
  const [showEdit, setShowEdit] = useState(true);
  const [showSecondary, setShowSecondary] = useState(true);

  const [selectedEntity, setSelectedEntity] = useState(null);
  const [open, setOpen] = useState(false);
  const [ScoresOpen, setScoresOpen] = useState(false);
  const [sortKey, setSortKey] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  // const [activeCandidateId, setActiveCandidateId] = useState(null);

  const data = [
    { id: 1, firstName: "John", lastName: "Doe" },
    { id: 2, firstName: "Jane", lastName: "Smith" },
    { id: 3, firstName: "Bob", lastName: "Johnson" },
    { id: 4, firstName: "Alice", lastName: "Williams" },
    { id: 5, firstName: "Charlie", lastName: "Brown" },
    { id: 6, firstName: "David", lastName: "Jones" },
    { id: 7, firstName: "Eva", lastName: "Miller" },
    { id: 8, firstName: "Frank", lastName: "Davis" },
    { id: 9, firstName: "Grace", lastName: "Wilson" },
    { id: 10, firstName: "Henry", lastName: "Moore" },
  ];

  const [activeCandidateId, setActiveCandidateId] = useState(
    data.length > 0 ? data[0].id : null
  );

  useEffect(() => {
    if (activeCandidateId) {
      setScoresOpen(true);
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
      <div className="h-full flex flex-col overflow-hidden  p-1 ">
        
        {/* Active tab content */}
        <div className="flex-1 overflow-auto bg-white  border-gray-300 p-1">
          <div className="flex flex-col h-full">
            {/* Main Content */}
            <div className="flex h-full overflow-hidden w-full">
              {/* Sidebar */}
              <div className="w-6/12 lg:w-3/12 flex flex-col border-1 h-full border-gray-200">
                <div className="flex-grow  flex flex-col h-1/2">
                  {/* Header */}
                  <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 grid grid-cols-3 text-gray-800 font-semibold text-sm">
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
                          Sessions
                        </span>
                      </div>

                      {openMenu && (
                        <>
                          <div className=" items-center justify-center  px-4 ">
                            <div className="border border-blue-200 p-1 rounded-lg">
                              <span className="text-sm text-gray-400">
                                Unit Name: Unit 1
                              </span>
                              <br />
                              <span className="text-sm text-gray-400">
                                Unit ID: UA123
                              </span>
                              <br />
                              <span className="text-sm text-gray-400">
                                Unit Type: Group
                              </span>
                              <br />
                              <span className="text-sm text-gray-400">
                                Signature Profile: Signature 1
                              </span>
                            </div>
                          </div>
                          {/* Candidate Data */}
                          <div className="flex-1 overflow-auto px-4 py-2 space-y-1">
                            {sortedData.map((item) => (
                              <div
                                key={item.id}
                                className={`grid grid-cols-3 gap-2 items-center text-sm  px-2 py-1 cursor-pointer
                                ${activeCandidateId === item.id ? "bg-blue-100 border-l-4 border-blue-400"
                                    : "hover:bg-gray-100"}`}
                                onClick={() => {
                                  setShowEdit(true);
                                  setShowSecondary(true);
                                }}
                                onDoubleClick={() => {
                                  setScoresOpen(true);
                                  setActiveCandidateId(item.id);
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

                {/* Secondary Input Area */}
                {showSecondary && (
                  <div className="h-1/2 overflow-auto ">
                    <SecondaryArea 
                      onClose={() => setShowSecondary(false)} 
                      selectedSort={selectedSort}
                    />

                  </div>
                )}
              </div>

              {/* Right Panel */}
              <div className="w-6/12 lg:w-9/12 bg-white  flex flex-col border-1 h-full border-gray-200  p-1 ml-1">

                {/* Tab buttons */}
                <div className="flex space-x-0  bg-gray-50 ">
                  
                  <div className="w-6/12 lg:w-9/12 flex flex-col h-full border-gray-200 p-1">
                    <div className="flex justify-start items-center space-x-2 ">
                      {activeCandidateId && (
                        <select
                          id="sorter"
                          name="sorter"
                          value={selectedSort}
                          onChange={(e) => setSelectedSort(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                          <option value="activateCandidateLevel">
                            Activate Candidate Level
                          </option>
                          <option value="activateUnitLevel">Activate Unit Level</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
                {ScoresOpen && <PlotSelections selectedSort={selectedSort} />}
              </div>
            </div>
            {/* ------- */}
          </div>
        </div>
      </div>
    </div>
  );
}
