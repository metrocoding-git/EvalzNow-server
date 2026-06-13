"use client";
import { useState } from "react";
import {
  Plus,
  X,
  ShieldUser,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function DataExtractions() {
  const tabs = [
    { label: "Session", path: "/dashboard/analytics-view/unit-distributions" },
  ];

  const pathname = usePathname();
  const currentTab =
    tabs.find((tab) => pathname?.startsWith(tab.path))?.label || "Session";

  const [activeTab, setActiveTab] = useState(currentTab);
  const [showEdit, setShowEdit] = useState(false);
  const [showSecondary, setShowSecondary] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [RightPanelOpen, setRightPanelOpen] = useState(false);
  const [activeCandidateId, setActiveCandidateId] = useState(null);

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
  const [openMenu, setopenMenu] = useState(true);
  const [sortKey, setSortKey] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");

  const sortedData = [...data].sort((a, b) => {
    if (sortKey === "id") {
      // Numeric sort for id
      return sortOrder === "asc" ? a.id - b.id : b.id - a.id;
    } else {
      // Case-insensitive string sort for names
      const valA = a[sortKey].toLowerCase();
      const valB = b[sortKey].toLowerCase();
      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    }
  });

  useEffect(() => {
    if (data.length > 0 && activeCandidateId === null) {
      setActiveCandidateId(data[0].id);
      setRightPanelOpen(true);
      setShowEdit(true);
      setShowSecondary(true);
    }
  }, []);

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };

  return (
    <div className="w-full flex flex-col">
      <div className="h-full flex flex-col overflow-hidden ">
        {/* Tab buttons */}
        {/* <div className="flex space-x-0 px-0 pt-2 border-b border-gray-200 bg-gray-50 ">
          <div className="w-6/12 lg:w-3/12 flex flex-col border-r-2 h-full border-gray-200  p-1">
            {tabs.map((tab, index) => (
              <Link href={tab.path} key={index}>
                <span
                  onClick={() => setActiveTab(tab.label)}
                  className={
                    `relative px-5 py-2 text-sm font-medium transition-all duration-200 ease-in-out cursor-pointer ` +
                    (activeTab === tab.label
                      ? "text-gray-600 bg-white border border-b-transparent border-gray-300 shadow-sm"
                      : "text-gray-500 hover:text-gray-600 border-t border-r border-b-transparent border-gray-300 hover:bg-white")
                  }
                >
                  {tab.label}
                </span>
              </Link>
            ))}
          </div>
        </div> */}
        {/* Active tab content */}
        <div className="flex-1 overflow-auto bg-white ">
          <div className="flex flex-col h-full m-1">
            {/* Main Content */}
            <div className="flex h-full overflow-hidden w-full">
              {/* Sidebar */}
              <div className="w-6/12 lg:w-3/12 flex flex-col border-2 h-full border-gray-200">
                <div className="flex-grow  flex flex-col h-2/4">
                  {/* Header */}
                  <div className="flex flex-col bg-gray-100 px-4 py-1.5 gap-2 border-b border-gray-300">
                    <div className="relative w-full">
                      <input
                        type="text"
                        className="border w-full pl-2 pr-8 py-1 text-sm bg-white"
                        placeholder="Search"
                      />
                      <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                    </div>
                    {/* Table Header with sorting */}
                    <div className="grid grid-cols-3 text-gray-800 font-semibold text-sm w-full">
                      <div
                        className="flex items-center gap-1 cursor-pointer select-none"
                        onClick={() => handleSort("lastName")}
                      >
                        Last Name
                      </div>

                      <div
                        className="flex items-center gap-1 cursor-pointer select-none"
                        onClick={() => handleSort("firstName")}
                      >
                        First Name
                      </div>

                      <div
                        className="flex items-center gap-1 cursor-pointer select-none"
                        onClick={() => handleSort("id")}
                      >
                        Candidate ID
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto">
                    <div className="px-4 py-2">
                      <div
                        className="flex items-center cursor-pointer select-none hover:bg-gray-50 px-2 py-1"
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
                          <div className="items-center justify-center px-4 mb-2">
                            <div className="border border-gray-200 p-1">
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

                          {/* Candidate List */}
                          <div className="space-y-1 px-4">
                            {sortedData.map((item) => (
                              <div
                                key={item.id}
                                className={`grid grid-cols-3 gap-2 items-center text-sm px-2 py-1 cursor-pointer
      ${activeCandidateId === item.id ? "bg-blue-100 border-l-4 border-blue-400" : "hover:bg-gray-100"}`}
                                onClick={() => {
                                  setShowEdit(true);
                                  setShowSecondary(true);
                                }}
                                onDoubleClick={() => {
                                  setRightPanelOpen(true);
                                  setActiveCandidateId(item.id);
                                }}
                              >
                                <span className="text-gray-800">
                                  {item.lastName}
                                </span>
                                <span className="text-gray-800">
                                  {item.firstName}
                                </span>
                                <span>{item.id}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              {RightPanelOpen && (
                <div className="w-6/12 lg:w-9/12 bg-white flex flex-col border-2 h-full border-gray-200 p-1 ml-1">
                  <div className="flex-1 flex flex-col items-center  h-full bg-white shadow-md p-6 overflow-y-auto space-y-4">
                    

                      <div className="flex flex-col justify-center items-center text-base font-semibold text-gray-800 my-8 leading-relaxed">
                        <p>EvalzNow – Human Capital & Education </p>
                        <p> Quantitative and Qualitative Assessment </p>
                        <p> Hybrid Proficiency & Growth Monitoring </p>
                        <p>  Candidate-Level Database Pull</p>
                      </div>

                      <div className="flex flex-col justify-center space-y-3 text-sm">
                        {[
                          {
                            id: "active-unit-candidates",
                            label: "Extract Candidate Data for the Active Unit",
                          },
                          {
                            id: "all-units-candidates",
                            label:
                              "Extract Candidate Data for All Units in Database",
                          },
                          {
                            id: "all-candidates-database",
                            label: "Extract All Candidate Data from Database",
                          },
                        ].map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2"
                          >
                            <input
                              id={item.id}
                              type="radio"
                              name="candidateOption" // same name for grouping
                              className="w-4 h-4 text-gray-600 accent-black border-gray-300 focus:ring-black"
                            />
                            <label htmlFor={item.id} className="text-gray-800">
                              {item.label}
                            </label>
                          </div>
                        ))}
                      </div>
                        <div className="">
                      <button
                        type="submit"
                        className="w-32 mt-4 bg-gray-200 hover:bg-gray-300 font-medium px-5 py-2 transition"
                      >
                        Extract
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* ------- */}
          </div>
        </div>
      </div>
    </div>
  );
}
