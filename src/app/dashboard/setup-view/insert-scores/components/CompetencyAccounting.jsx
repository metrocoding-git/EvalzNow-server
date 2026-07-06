"use client";

import React, { useEffect, useState } from "react";
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
import ScoringCriteria from "./ScoringCriteria";
import { useSearchParams } from 'next/navigation';
import { deleteInsertScore, getInsertScoreByUnitAndCandidate, getInsertScoresByUnitId, updateInsertScore } from "@/services/insertScoreService";
import { createScoringCriteria, deleteScoringCriteria, getScoringCriteriaByUnitId, updateScoringCriteria } from "@/services/scoringCriteriaService";
import { useFormStatus } from "@/context/FormStatusContext";
import { useUnit } from "@/context/UnitContext";
import { Toaster } from "react-hot-toast";

const MAIN_CRITERIA = [
  "Communication",
  "Intelligence",
  "Responsiveness",
  "Efficiency",
  "Adaptation",
  "Accuracy",
  "Verbal Reasoning",
  "Spatial Reasoning",
  "Numerical Reasoning",
  "Problem Solving",
  "Memory",
  "Data Checking",
  "Work Sampling",
  "Quality of Work",
  "Resourcefulness",
  "Following Instructions",
  "Working in Teams",
  "Working Alone",
  "Initiative",
  "Sick/Injury Avoidance",
];

export default function CompetencyAccounting({ selectedRow, setSelectedRow, activeTab, setActiveTab, scoreAdd, setScoreAdd, candidateId, refreshTrigger, unit }) {

  const [scores, setScores] = useState([]);

  const handleAddScore = (newScore) => {
    setScores((prev) => [...prev, newScore]);
    setScoreAdd(false);
  };

  const { selectedUnitId, setSelectedUnitId } = useUnit(); 
  // const searchParams = useSearchParams();
  const environment = unit.environment;

  const unitId = selectedUnitId;
  const [classroomData, setClassroomData] = useState([]);
  const [workforceData, setWorkforceData] = useState([]);
  const { setFormStatus } = useFormStatus();
  const [tableData, setTableData] = useState([
    {
      firstName: "John",
      lastName: "Doe",
      cid: "CID001",
      ppId: "1",
      duration: "14",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      AttainedScore: "20",
      MaximumScore: "10"
    },
    {
      firstName: "2John",
      lastName: "2Doe22",
      cid: "CID002",
      ppId: "2",
      duration: "3",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      AttainedScore: "30",
      MaximumScore: "50"
    },

    {
      firstName: "5Jane",
      lastName: "3Smith",
      cid: "CID005",
      ppId: "3",
      duration: "6",
      criticalDate: "2025-10-20",
      taskDeclaration: "Task B",
      workflowStage: "Completed",
      assessmentType: "Type 2",
      scheduleImpact: "Medium",
      engageLevel: "Moderate",
      competency: "Intermediate",
      AttainedScore: "20",
      MaximumScore: "10"
    },
    {
      firstName: "John",
      lastName: "Doe",
      cid: "CID001",
      ppId: "-1",
      duration: "3",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      AttainedScore: "20",
      MaximumScore: "10"
    },
    {
      firstName: "John",
      lastName: "Doe",
      cid: "CID001",
      ppId: "-2",
      duration: "12",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      AttainedScore: "200",
      MaximumScore: "500"
    },
  ]);

  const [workspaceTableData, setWorkspaceTableData] = useState([
    {
      firstName: "John",
      lastName: "Doe",
      cid: "CID001",
      ppId: "1",
      duration: "3",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      mc: Array.from({ length: 20 }, (_, i) => (i + 1) * 2), // Example MC1-MC20 scores
      cc: Array.from({ length: 20 }, (_, i) => (i + 1) * 3), // Example CC21-CC40 scores
    },
    {
      firstName: "2John",
      lastName: "2Doe22",
      cid: "CID002",
      ppId: "2",
      duration: "3",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      mc: Array.from({ length: 20 }, (_, i) => (i + 1) * 2), // Example MC1-MC20 scores
      cc: Array.from({ length: 20 }, (_, i) => (i + 1) * 3), // Example CC21-CC40 scores
    },

    {
      firstName: "5Jane",
      lastName: "3Smith",
      cid: "CID005",
      ppId: "3",
      duration: "6",
      criticalDate: "2025-10-20",
      taskDeclaration: "Task B",
      workflowStage: "Completed",
      assessmentType: "Type 2",
      scheduleImpact: "Medium",
      engageLevel: "Moderate",
      competency: "Intermediate",
      mc: Array.from({ length: 20 }, (_, i) => (i + 1) * 5), // Example MC1-MC20 scores
      cc: Array.from({ length: 20 }, (_, i) => (i + 1) * 2), // Example CC21-CC40 scores
    },
    {
      firstName: "John",
      lastName: "Doe",
      cid: "CID001",
      ppId: "-1",
      duration: "15",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      mc: Array.from({ length: 20 }, (_, i) => (i + 1) * 3), // Example MC1-MC20 scores
      cc: Array.from({ length: 20 }, (_, i) => (i + 1) * 1), // Example CC21-CC40 scores
    },
    {
      firstName: "John",
      lastName: "Doe",
      cid: "CID001",
      ppId: "-2",
      duration: "14",
      criticalDate: "2025-09-15",
      taskDeclaration: "Task A",
      workflowStage: "In Progress",
      assessmentType: "Type 1",
      scheduleImpact: "Low",
      engageLevel: "High",
      competency: "Advanced",
      mc: Array.from({ length: 20 }, (_, i) => (i + 1) * 2), // Example MC1-MC20 scores
      cc: Array.from({ length: 20 }, (_, i) => (i + 1) * 3), // Example CC21-CC40 scores
    },
  ]);

  const [insertScores, setInsertScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteSelectedRow, setDeleteSelectedRow] = useState(null);

  const [customCriteria, setCustomCriteria] = useState([]);

  const [points, setPoints] = useState(
    Array.from({ length: 2 }, () => ({ x: "", y: "" }))
  );
  const [visible, setVisible] = useState(true);


  const handlePointChange = (index, field, value) => {
    const updated = [...points];
    updated[index][field] = value;
    setPoints(updated);
  };

  const refreshData = () => {
    if (onRefresh) onRefresh();
  };

  useEffect(() => {
    const fetchAndSeparateScores = async () => {
      if (!unitId || !candidateId) return;
  
      // Reset previous data
      setClassroomData([]);
      setWorkforceData([]);
      setInsertScores([]);
      setLoading(true);
      setError(null);
  
      try {
        const data = await getInsertScoreByUnitAndCandidate(unitId, candidateId);
        if (!Array.isArray(data)) throw new Error("Invalid insert score response");
        console.log("Fetched insert scores:", data);
  
        const classroomRows = [];
        const workforceRows = [];
  
        data.forEach((row) => {
          const env = row.unit?.environment || "Workforce"; // default Workforce
          const ppId = row.ppId;
          const ppNumber = parseInt(ppId, 10);

          if (isNaN(ppId)) return;


          const matchesTab = activeTab === "Indirect" ? ppNumber < 0 : ppNumber > 0;

          if (!matchesTab) return;

          const mc = Array.from({ length: 20 }, (_, i) => row[`mc${i + 1}`] ?? "");  // MC1–MC20
          const cc = Array.from({ length: 20 }, (_, i) => row[`cc${i + 1}`] ?? "");  // CC1–CC20
          const normalizedRow = { ...row, mc, cc };




          if (env === "Classroom") classroomRows.push(normalizedRow);
          else workforceRows.push(normalizedRow);
        });


        if (activeTab === "Indirect") {
          // Negative ppIds → sort descending
          classroomRows.sort((a, b) => {
            const pa = parseInt(a.ppId, 10);
            const pb = parseInt(b.ppId, 10);
        
            if (pa !== pb) return pb - pa; // higher negative closer to zero comes first
            // same ppId → sort by criticalRefDate ASC
            return new Date(a.criticalRefDate) - new Date(b.criticalRefDate);
          });
        
          workforceRows.sort((a, b) => {
            const pa = parseInt(a.ppId, 10);
            const pb = parseInt(b.ppId, 10);
        
            if (pa !== pb) return pb - pa;
            return new Date(a.criticalRefDate) - new Date(b.criticalRefDate);
          });
        } else {
          // Positive ppIds → sort ascending
          classroomRows.sort((a, b) => {
            const pa = parseInt(a.ppId, 10);
            const pb = parseInt(b.ppId, 10);
        
            if (pa !== pb) return pa - pb; 
            return new Date(a.criticalRefDate) - new Date(b.criticalRefDate);
          });
        
          workforceRows.sort((a, b) => {
            const pa = parseInt(a.ppId, 10);
            const pb = parseInt(b.ppId, 10);
        
            if (pa !== pb) return pa - pb;
            return new Date(a.criticalRefDate) - new Date(b.criticalRefDate);
          });
        }
        
        
  
        setClassroomData(classroomRows);
        setWorkforceData(workforceRows);
        setInsertScores(data);
  
      } catch (err) {
        console.error("Error fetching insert scores:", err);
        setError("Failed to load insert scores.");
      } finally {
        setLoading(false);
        setSelectedRow(null);
      }
    };
  
    fetchAndSeparateScores();
  }, [unitId, candidateId, activeTab, environment, refreshTrigger]);
  
  
  useEffect(() => {
    setSelectedRow(null);
  }, [candidateId, activeTab]);

  console.log("insert score: ", insertScores);

  const handleDeleteCurve = () => {
    if (scores.length > 0) {
      setScores([]);
    } else {
      alert("No scores to delete.");
    }
  };

  useEffect(() => {
    const fetchCriteria = async () => {
      if (!unitId) return;
  
      try {
        const data = await getScoringCriteriaByUnitId(unitId);
        if (!Array.isArray(data)) throw new Error("Invalid scoring criteria response");
  
        // Sort by criteriaId to keep correct order
        const sorted = [...data].sort((a, b) => a.criteriaId - b.criteriaId);
  
        // Reassign them continuously starting from 1
        const compressed = sorted.map((item, index) => ({
          id: item.id,
          criteriaId: index + 1, // <-- shift to continuous
          name: item.criteria,
          unitId: item.unitId,
        }));
  
        // Fill into full table length
        const mappedCriteria = Array.from({ length: MAIN_CRITERIA.length }, (_, i) => {
          return compressed[i] || { id: null, criteriaId: i + 1, name: "", unitId };
        });
  
        setCustomCriteria(mappedCriteria);
      } catch (err) {
        console.error("Failed to fetch scoring criteria:", err);
      }
    };
  
    fetchCriteria();
  }, [unitId]);
  
  
  
  if (!visible) return null;

  const moveRowUp = async () => {
    if (deleteSelectedRow === null || deleteSelectedRow <= 0) return;
  
    const dataArray = environment === "Classroom" ? [...classroomData] : [...workforceData];
    const newIndex = deleteSelectedRow - 1;
  
    const selectedItem = { ...dataArray[deleteSelectedRow] };
    const targetItem = { ...dataArray[newIndex] };
  
    // ✅ If ppIds are different, update ppId + criticalReferenceDate
    // if (selectedItem.ppId !== targetItem.ppId) {
      selectedItem.ppId = targetItem.ppId;
      selectedItem.criticalRefDate = targetItem.criticalRefDate;
      selectedItem.assessmentBlockId = targetItem.assessmentBlockId;
    // } else {
      // ✅ If ppIds are same, update only ppId
    //   selectedItem.ppId = targetItem.ppId;
    // }
  
    // ✅ Swap visually
    dataArray[deleteSelectedRow] = targetItem;
    dataArray[newIndex] = selectedItem;
  
    // ✅ Update selectedRow state
    setDeleteSelectedRow(newIndex);
    setSelectedRow(selectedItem);
  
    // ✅ Update state array
    if (environment === "Classroom") {
      setClassroomData(dataArray);
    } else {
      setWorkforceData(dataArray);
    }
  
    // ✅ Update backend (only selected row)
    try {
      await updateInsertScore(selectedItem.id, selectedItem);
      console.log(`Updated row ${selectedItem.id} with ppId ${selectedItem.ppId} and criticalReferenceDate ${selectedItem.criticalRefDate}`);
    } catch (err) {
      console.error("Failed to update row after moving up:", err);
    }
  };
  
  const moveRowDown = async () => {
    const dataArray = environment === "Classroom" ? [...classroomData] : [...workforceData];
    if (deleteSelectedRow === null || deleteSelectedRow >= dataArray.length - 1) return;
  
    const newIndex = deleteSelectedRow + 1;
  
    const selectedItem = { ...dataArray[deleteSelectedRow] };
    const targetItem = { ...dataArray[newIndex] };
  
    // ✅ If ppIds are different, update ppId + criticalReferenceDate
    // if (selectedItem.ppId !== targetItem.ppId) {
      selectedItem.ppId = targetItem.ppId;
      selectedItem.criticalRefDate = targetItem.criticalRefDate;
      selectedItem.assessmentBlockId = targetItem.assessmentBlockId;
    // } else {
      // ✅ If ppIds are same, update only ppId
      // selectedItem.ppId = targetItem.ppId;
    // }
  
    // ✅ Swap visually
    dataArray[deleteSelectedRow] = targetItem;
    dataArray[newIndex] = selectedItem;
  
    // ✅ Update selectedRow state
    setDeleteSelectedRow(newIndex);
    setSelectedRow(selectedItem);
  
    // ✅ Update state array
    if (environment === "Classroom") {
      setClassroomData(dataArray);
    } else {
      setWorkforceData(dataArray);
    }
  
    // ✅ Update backend (only selected row)
    try {
      await updateInsertScore(selectedItem.id, selectedItem);
      console.log(`Updated row ${selectedItem.id} with ppId ${selectedItem.ppId} and criticalReferenceDate ${selectedItem.criticalRefDate}`);
    } catch (err) {
      console.error("Failed to update row after moving down:", err);
    }
  };
  
  
  
  



  const handleDeleteSelectedScore = async () => {
    if (deleteSelectedRow === null) {
      alert("Please select a row to delete.");
      return;
    }
  
    // Determine which dataset we are working with
    const dataArray = environment === "Classroom" ? classroomData : workforceData;
    const selectedItem = dataArray[deleteSelectedRow];
  
    if (!selectedItem || !selectedItem.id) {
      alert("Cannot delete: invalid item selected.");
      return;
    }
  
    try {
      // Delete from backend if id exists
      if (selectedItem.id) {
        await deleteInsertScore(selectedItem.id);
      }
  
      // Remove from state array
      const updatedArray = dataArray.filter((_, idx) => idx !== deleteSelectedRow);
      if (environment === "Classroom") setClassroomData(updatedArray);
      else setWorkforceData(updatedArray);
  
      // Remove from insertScores as well
      setInsertScores(prev => prev.filter(score => score.id !== selectedItem.id));
  
      // Reset selection
      setSelectedRow(null);
      setDeleteSelectedRow(null);
  
      // Optional success message
      // alert("Row deleted successfully.");
    } catch (err) {
      console.error("Error deleting insert score:", err);
      alert("Failed to delete insert score.");
    }
  };


  const handleSubmit = async () => {
    if (!formData.assessmentBlockId || !formData.unitId) {
      setError("Missing unitId or assessmentBlockId.");
      return;
    }
  
    // Validate against critical date range
    if (criticalRange && formData.criticalRefDate) {
      const inputDate = new Date(formData.criticalRefDate);
      if (inputDate < criticalRange.start || inputDate > criticalRange.end) {
        toast.error(
          `Critical Ref. Date must be between ${criticalRange.start.toLocaleDateString()} and ${criticalRange.end.toLocaleDateString()}`
        );
        return; // ⛔ Stop submission
      }
    }

    try {
      setLoading(true);
      setFormStatus("Processing...");
    
      const response = await updateInsertScore(details.id, payload); 
      setFormStatus("Insert Score Updated");

      
      console.log("Successfully updated insert score.");
  
      if (onUpdate) onUpdate(response);
      onClose?.(); // Close the form if callback provided
    } catch (err) {
      console.error("Failed to update insert score:", err);
      setError("Failed to save insert score.");
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <>
      <h2 className="text-md font-bold bg-gray-100 p-0.5  flex items-center border-b border-gray-200">
        <span className="pl-2 text-md text-gray-800">Insert Scores for Competency Accounting</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
      </h2>

      {/* Scoring Criteria is only applicable to the 'Workforce' Environment otherwise disable it. */}
      {environment !== 'Classroom' && (
        <div className="h-1/2 overflow-hidden border border-gray-300 m-1 flex flex-col">
          {/* Only hide the scoring criteria section when environment is classroom */}
          <div className="flex items-center justify-between border-b-1 border-gray-400 mb-1 px-1 mx-1 mt-1 text-gray-700">

            <h2 className="text-sm font-semibold mx-1">Scoring Criteria</h2>

          </div>

          <div className="flex-1 overflow-auto px-3 ">
            <div className="flex-1  overflow-auto">
              {/* Scoring Criteria Table */}

              <table className="w-full mx-auto my-1 text-left text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border-1 border-gray-400 px-2 py-1 text-center font-semibold">
                      MC
                    </th>
                    <th className="border-1 border-gray-400 px-2 py-1 text-center font-semibold">
                      Main Criteria
                    </th>
                    <th className="border-1 border-gray-400 px-2 py-1 text-center font-semibold">
                      CC
                    </th>
                    <th className="border-1 border-gray-400 px-2 py-1 text-center font-semibold">
                      Custom Criteria
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MAIN_CRITERIA.map((criterion, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="border-1 text-center border-gray-400 px-2 py-1">
                        {index + 1}
                      </td>
                      <td className="border-1 text-center border-gray-400 px-2 py-1">
                        {criterion}
                      </td>
                      <td className="border-1 text-center border-gray-400 px-2 py-1">
                        {index + 21}
                      </td>
                      <td className="border-1 text-center border-gray-400 px-2 py-1">
                        <input
                          type="text"
                          className="w-full border border-gray-200 text-center focus:outline-gray-200 px-1 py-0.5 text-sm"
                          placeholder="Enter custom criteria"
                          value={customCriteria[index]?.name || ""}
                          onChange={(e) => {
                            const value = e.target.value;
                            const updated = [...customCriteria];
                            updated[index] = { ...updated[index], name: value };
                            setCustomCriteria(updated);
                          }}
                          onBlur={async () => {
                            const criteriaItem = customCriteria[index];
                            const value = criteriaItem.name?.trim() || "";
                            try {
                              if (value === "" && criteriaItem.id) {
                                await deleteScoringCriteria(criteriaItem.id);
                                const updated = [...customCriteria];
                                updated[index] = { ...updated[index], id: null, criteriaId: null };
                                setCustomCriteria(updated);
                              } else if (criteriaItem.id && value !== "") {
                                await updateScoringCriteria(criteriaItem.id, { criteria: value, unitId: criteriaItem.unitId });
                              } else if (!criteriaItem.id && value !== "") {
                                const created = await createScoringCriteria({ criteria: value, unitId: criteriaItem.unitId });
                                const updated = [...customCriteria];
                                updated[index] = {
                                  ...updated[index],
                                  id: created.id,
                                  criteriaId: created.criteriaId,
                                  name: created.criteria,
                                };
                                setCustomCriteria(updated);
                              }
                            } catch (err) {
                              console.error("Error saving scoring criteria:", err);
                            }
                          }}
                        />

                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className={` ${environment === 'Classroom' ? 'h-full' : 'h-1/2'} border border-gray-300 flex flex-col m-1`}>
        <div className="flex flex-col flex-1 p-1 overflow-hidden">
          {/* Tab Buttons */}
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b-1 border-gray-400 mb-1 px-1 mx-1  text-gray-700">
              <h2 className="text-sm font-semibold mx-1">Competency Accounting</h2>
            </div>

            <div className="flex items-center justify-between border-b p-1 bg-gray-100">
              
              {/* Tab Buttons */}
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 text-sm cursor-pointer ${activeTab === "Indirect"
                    ? "bg-white border-t-2 border-blue-400 text-gray-800 font-semibold "
                    : "hover:bg-gray-100"
                    }`}
                  onClick={() => { setActiveTab("Indirect"); setSelectedRow(null); }}
                >
                  Indirect Performance Point (Sub)

                </button>
                <button
                  className={`px-3 py-1 text-sm cursor-pointer ${activeTab === "Direct"
                    ? "bg-white border-t-2 border-blue-400 text-gray-800 font-semibold "
                    : "hover:bg-gray-100"
                    }`}
                  onClick={() => { setActiveTab("Direct"); setSelectedRow(null); }}
                >
                  Direct Performance Point (Sub)
                </button>

              </div>

              {/* Right side: Plus button */}
              <div className="mr-1">
                <button
                  onClick={() => {
                    setScoreAdd(true) 
                    setFormStatus("Creating...")
                  }}
                  title="Create Material"
                  className="p-1 text-gray-600 hover:text-black transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>


                {selectedRow && (
                  <button
                    className="p-1 text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                    onClick={handleDeleteSelectedScore}
                  >
                    <span className="flex items-center gap-2 ">
                      <Trash2 className="w-3.5 h-3.5 " />
                    </span>

                  </button>
                )}

                {insertScores.length > 0 && selectedRow !== null && (
                  <> 
                    <button
                      onClick={moveRowUp}
                      title="Move Up"
                      className="text-gray-600 hover:text-black cursor-pointer p-1"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={moveRowDown}
                      title="Move Down"
                      className="text-gray-600 hover:text-black cursor-pointer p-1"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>

            </div>
          </div>

          <div className="flex-1 p-2  overflow-auto h-full">
            <div className="min-w-full overflow-auto h-full">
              <table className="w-full text-left text-xs mb-7"> 
                <thead className="bg-gray-100">
                  <tr> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">First Name</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Last Name</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">CID</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">PP ID</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Duration</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Critical Reference Date</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Task Declaration</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Workflow Stage</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Assessment Type</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Schedule Impact</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Engage Level</th> 
                    <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Competency</th> 

                    {environment === "Classroom" ? (
                      <>
                        <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Attained Score</th>
                        <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Maximum Score</th>
                      </>
                    ) : (
                      <>
                        {/* MC1 - MC20 */}
                        {Array.from({ length: 20 }, (_, i) => (
                          <th key={`mc-${i}`} className="border-1 border-gray-400 px-2 py-1">{`MC${i + 1}`}</th>
                        ))}
                        {/* CC21 - CC40 */}
                        {Array.from({ length: 20 }, (_, i) => (
                          <th key={`cc-${i + 21}`} className="border-1 border-gray-400 px-2 py-1">{`CC${i + 21}`}</th>
                        ))}
                      </>
                    )}
                  </tr> 
                  
                </thead>
                <tbody>
                  {(environment === "Classroom" ? classroomData : workforceData).map(
                    (row, idx) => (
                      <tr key={idx} className={`hover:bg-gray-50 cursor-pointer ${
                        selectedRow?.id === row.id ? "bg-gray-200" : ""
                      }`}  onClick={() => {
                        setSelectedRow(row);
                        setDeleteSelectedRow(idx);
                      }}>
                        <td className="whitespace-nowrap border p-1 text-center">{row.candidate?.firstName}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.candidate?.lastName}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.candidate?.candidateId}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.ppId}</td>
                        <td className="whitespace-nowrap border p-1 text-center"> {row.durationHrs !== null && row.durationHrs !== undefined ? Number(row.durationHrs).toFixed(2) : "-"}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.criticalRefDate?.slice(0, 10)}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.remarks}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.workflowStage}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.assessmentType}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.scheduleImpact}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.engageLevel}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{row.competency}</td>

                        {environment === "Classroom" ? (
                          <>
                            <td className="whitespace-nowrap border p-1 text-center">{row.attainedScore || 0}</td>
                            <td className="whitespace-nowrap border p-1 text-center">{row.maxScore || 0}</td>
                          </>
                        ) : (
                          <>
                            {row.mc?.map((val, i) => (
                              <td className="whitespace-nowrap border p-1 text-center" key={`mc-${i}`}>{val ? val : "-"}</td>
                            ))}
                            {row.cc?.map((val, i) => (
                              <td className="whitespace-nowrap border p-1 text-center" key={`cc-${i}`}>{val ? val : "-"}</td>
                            ))}

                          </>
                        )}
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>



        </div>
        
      </div>

      {/* {scoreAdd && (
        <div className="overflow-auto my-2">
          <ScoringCriteria onClose={() => setScoreAdd(false)} />
        </div>
      )} */}
    </>
    
  );
}
