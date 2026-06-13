"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import SearchLookup from "./LookUpTable";
import CreateBlockManagerForm from "./CreateBlockManagerForm";
import { deleteAssessmentBlock, getAssessmentBlockByUnitAndCandidate, getAssessmentBlockByUnitId, updateAssessmentBlock } from "@/services/assessmentBlockManagerService";
import { deleteUnitRoster, getUniRostertByUnitId, updateUnitRoster } from "@/services/unitRosterService";
import toast, { Toaster } from "react-hot-toast";
import { useFormStatus } from "@/context/FormStatusContext";


export default function UnitRoster({ activeTab, setActiveTab, setShowEditBlockManager, setShowEdit, unitRosterData = [],
  selectedUnit, onBlockSelect, selectedCandidate, onRosterUpdate, onBlockUpdate, refreshCandidateData, refreshAssessmentBlocks, showEditBlockManager  }) {
  const [selectedRow, setSelectedRow] = useState(null);
  const [showSearchLookup, setShowSearchLookup] = useState(false);
  const [selectedEntitiyRows, setSelectedEntityRows] = useState([]);

  const [showCreateBlockForm, setShowCreateBlockForm] = useState(false);
  const [displayRosterData, setDisplayRosterData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [assessmentBlocks, setAssessmentBlocks] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);

  const { setFormStatus } = useFormStatus();

  const [points, setPoints] = useState(
    Array.from({ length: 20 }, () => ({ x: "", y: "" }))
  );
  const [visible, setVisible] = useState(true);

  const handlePointChange = (index, field, value) => {
    setDisplayRosterData(prev => {
      const updated = [...prev];
      if (updated[index]) {
        const item = { ...updated[index] };
  
        switch(field) {
          case "present": item.presentCount = value; break;
          case "excusedAbs": item.excusedAbsences = value; break;
          case "unexcusedAbs": item.unexcusedAbsences = value; break;
          case "excusedTardy": item.excusedTardies = value; break;
          case "unexcusedTardy": item.unexcusedTardies = value; break;
          case "unitOutcome": item.unitOutcome = value; break;
          default: item[field] = value;
        }
  
        updated[index] = item;
      }
      return updated;
    });
  };

// Refresh blocks when edit panel closes
useEffect(() => {
  if (!showCreateBlockForm && !setShowEditBlockManager) return;

  if (!showEditBlockManager) {
    fetchBlocksByUnitAndCandidate();
  }
}, [showEditBlockManager]);


  
  

  
  const toggleRowSelection = (index) => {
    // setSelectedRow((prev) =>
    //   prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    // );
    setSelectedRow(index)
  };

  const handleUnitRosterDeleteCurve = async () => {
    if (selectedEntitiyRows.length === 0) return;
  
    try {
      // Get the selected roster items to delete
      const itemsToDelete = selectedEntitiyRows.map(index => displayRosterData[index]);
      setFormStatus("Processing");
      // Delete each item from the backend
      for (const item of itemsToDelete) {
        if (item.id) { // Make sure it has an ID
          await deleteUnitRoster(item.id);
          setFormStatus("Unit Roster Deleted");
        }
      }
  
      // Refresh roster table after deletion
      await fetchRosterData();

       // Remove deleted candidates from refreshCandidateData
      if (refreshCandidateData) {
        refreshCandidateData(prevCandidates => 
          prevCandidates.filter(candidate => 
            !itemsToDelete.some(item => item.candidate_id === candidate.id)
          )
        );
      }
  
      // Clear selection
      setSelectedEntityRows([]);
  
      console.log("✅ Selected roster items deleted successfully");
    } catch (err) {
      console.error("❌ Failed to delete selected roster items:", err);
      alert("Failed to delete selected roster items. Please try again.");
    }
  };
  

  // Add this near your other state
  // const fetchBlocks = async () => {
  //   if (!selectedUnit?.id) return;
  //   try {
  //     setLoading(true);
  //     const blocks = await getAssessmentBlockByUnitId(selectedUnit.id);
  //     setAssessmentBlocks(Array.isArray(blocks) ? blocks : []);
  //   } catch (err) {
  //     console.error("Failed to fetch blocks:", err);
  //     setError("Failed to load blocks. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // // call it when unit changes
  // useEffect(() => {
  //   fetchBlocks();
  // }, [selectedUnit?.id]);
  const sortBlocksByPPId = (blocks, tab) => {
    if (!blocks || blocks.length === 0) return [];
    
    return blocks.sort((a, b) => {
      if (tab === "Direct") {
        return a.ppId - b.ppId;       // 1,2,3,4...
      } else if (tab === "Indirect") {
        return b.ppId - a.ppId;       // -1,-2,-3,-4
      }
      return 0;
    });
  };

  

  const fetchBlocksByUnitAndCandidate = async () => {
    if (!selectedUnit?.id || !selectedCandidate?.id) return;
    try {
      setLoading(true);
      const blocks = await getAssessmentBlockByUnitAndCandidate(selectedUnit.id, selectedCandidate.id);
  
      let blockArray = [];
      if (Array.isArray(blocks)) blockArray = blocks;
      else if (blocks && typeof blocks === 'object') blockArray = [blocks];
  
      // Sort blocks by ppId based on activeTab
      const sortedBlocks = sortBlocksByPPId(blockArray, activeTab);
  
      setAssessmentBlocks(sortedBlocks);
      console.log("blocks", sortedBlocks);
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
      setError("Failed to load blocks. Please try again.");
      setAssessmentBlocks([]);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchBlocksByUnitAndCandidate();
  }, [selectedUnit?.id, selectedCandidate?.id, activeTab]);

  useEffect(() => {
    const fetchAndSelectFirstBlock = async () => {
      if (!selectedUnit?.id || !selectedCandidate?.id) return;
      try {
        setLoading(true);
        const blocks = await getAssessmentBlockByUnitAndCandidate(selectedUnit.id, selectedCandidate.id);
        
        let blockArray = [];
        if (Array.isArray(blocks)) {
          blockArray = blocks;
        } else if (blocks && typeof blocks === "object") {
          blockArray = [blocks];
        }
        
        setAssessmentBlocks(blockArray);
  
        // Automatically select the first block if available
        if (blockArray.length > 0) {
          setSelectedBlock(blockArray[0]);
          setSelectedRow(0);
          setShowEditBlockManager(true); // optionally open edit panel
          if (onBlockSelect) {
            onBlockSelect(blockArray[0]);
          }
        } else {
          setSelectedBlock(null);
          setSelectedRow(null);
        }
  
      } catch (err) {
        console.error("Failed to fetch blocks:", err);
        setError("Failed to load blocks. Please try again.");
        setAssessmentBlocks([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchAndSelectFirstBlock();
  }, [selectedUnit?.id, selectedCandidate?.id]); 
  
  console.log("selected candidate in roster", assessmentBlocks );
  // call it when unit changes
  useEffect(() => {
    fetchBlocksByUnitAndCandidate();
  }, [selectedUnit?.id, selectedCandidate?.id]);

  // useEffect(() => {
  //   if (!showEditBlockManager) {
  //     refreshAssessmentBlocks();
  //   }
  // }, [showEditBlockManager, refreshAssessmentBlocks]);


  const handleBlockManagerDeleteCurve = () => {
    // const updated = points.filter((_, index) => !selectedRow.includes(index));
    // setPoints(updated);
    setSelectedRow(null); // reset selection
    setShowEditBlockManager(false);
  };

  // Function to swap and update ppId values
const swapAssessmentBlocks = async (index1, index2) => {
  if (
    index1 < 0 ||
    index2 < 0 ||
    index1 >= filteredAssessmentBlocks.length ||
    index2 >= filteredAssessmentBlocks.length
  ) {
    return;
  }

  try {
    const updatedBlocks = [...assessmentBlocks];

    const block1 = filteredAssessmentBlocks[index1];
    const block2 = filteredAssessmentBlocks[index2];

    const mainIndex1 = updatedBlocks.findIndex((b) => b.id === block1.id);
    const mainIndex2 = updatedBlocks.findIndex((b) => b.id === block2.id);

    if (mainIndex1 === -1 || mainIndex2 === -1) return;

    // --- Adjust ppId values depending on tab & direction ---
    let newBlock1 = { ...block1 };
    let newBlock2 = { ...block2 };

    if (activeTab === "Direct") {
      // Direct performance
      if (index2 < index1) {
        // Move Up
        newBlock1.ppId = block1.ppId - 1;
        newBlock2.ppId = block2.ppId + 1;
      } else {
        // Move Down
        newBlock1.ppId = block1.ppId + 1;
        newBlock2.ppId = block2.ppId - 1;
      }
    } else if (activeTab === "Indirect") {
      // Indirect performance (reverse logic)
      if (index2 < index1) {
        // Move Up
        newBlock1.ppId = block1.ppId + 1;
        newBlock2.ppId = block2.ppId - 1;
      } else {
        // Move Down
        newBlock1.ppId = block1.ppId - 1;
        newBlock2.ppId = block2.ppId + 1;
      }
    }

    // Swap their order in UI
    [updatedBlocks[mainIndex1], updatedBlocks[mainIndex2]] = [
      newBlock2,
      newBlock1,
    ];

    setAssessmentBlocks(updatedBlocks);

    // Update selection
    setSelectedRow(index2);
    setSelectedBlock(newBlock1);

    // --- Persist to backend ---
    await Promise.all([
      updateAssessmentBlock(newBlock1.id, { ...newBlock1 }),
      updateAssessmentBlock(newBlock2.id, { ...newBlock2 }),
    ]);

    // Notify parent if needed
    if (onBlockUpdate) {
      onBlockUpdate(updatedBlocks);
    }
  } catch (err) {
    console.error("Failed to swap/update blocks:", err);
  }
};


const moveRowUp = () => {
  if (selectedRow === null || selectedRow === 0) return;
  swapAssessmentBlocks(selectedRow, selectedRow - 1);
};

const moveRowDown = () => {
  if (selectedRow === null || selectedRow === filteredAssessmentBlocks.length - 1) return;
  swapAssessmentBlocks(selectedRow, selectedRow + 1);
};

  
  const handleSaveBlock = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    try {
      if (!blockData || !selectedBlock) return;
  
      // Call API to update the block
      const savedBlock = await updateAssessmentBlock(selectedBlock.id, blockData);
  
      // Notify parent about the updated block
      if (onBlockUpdate) {
        onBlockUpdate(savedBlock);
      }
  
      if (onBlockSubmitStatus) {
        onBlockSubmitStatus(true);
      }
  
      onClose();
    } catch (err) {
      console.error("Failed to update unit:", err);
  
      const message =
        err.response?.data?.message ||
        err.data?.message ||
        err.message ||
        "Failed to update unit";
  
      setError(message);
  
      if (onBlockSubmitStatus) {
        onBlockSubmitStatus(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  

  // const handleCandidateSelect = (newUnitRosterEntries) => {
  //   console.log("Selected candidate in roster:", newUnitRosterEntries);
  //   // Here, handle the selected candidate:
  //   // - Add them to the roster
  //   // - Fill in the form fields
  //   // - Store the selection for further processing
  //   setDisplayRosterData(newUnitRosterEntries);
  //   setShowSearchLookup(false);
  // };



  const fetchRosterData = async () => {
    if (!selectedUnit?.id) return;
    try {
      setLoading(true);
      const roster = await getUniRostertByUnitId(selectedUnit.id);
      setDisplayRosterData(Array.isArray(roster) ? roster : []);
    } catch (err) {
      console.error("❌ Failed to fetch roster:", err);
      setError("Failed to load roster");
    } finally {
      setLoading(false);
    }
  };
  
  // call on mount or when unit changes
  useEffect(() => {
    fetchRosterData();
  }, [selectedUnit?.id]);
  


  const toggleRowSelectionMulti = (index) => {
    setSelectedEntityRows((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };
  


  const handleRowClick = (block, index) => {
    setSelectedRow(index);
    setSelectedBlock(block);   
    setShowEditBlockManager(true);
    setShowEdit(false);

    if (onBlockSelect) {
      onBlockSelect(block);
    }
  };

  // Extract candidate data from unit roster
  const existingCandidates = unitRosterData
  .filter(rosterItem => rosterItem.candidate)
  .map(rosterItem => rosterItem.candidate);

  const filteredAssessmentBlocks = assessmentBlocks.filter(block => 
    block.manageType === activeTab
  );

  const handleDeleteBlock = async () => {
    if (selectedRow === null) return; // no row selected
  
    try {
      const blockToDelete = filteredAssessmentBlocks[selectedRow];
      if (!blockToDelete) return;

      setFormStatus("Processing");
  
      // Call API to delete
      await deleteAssessmentBlock(blockToDelete.id);
  
      // Remove from local state
      // setAssessmentBlocks(prev => prev.filter(b => b.id !== blockToDelete.id));
      await fetchBlocksByUnitAndCandidate();
  
      setFormStatus("Assessment Block Deleted");
      // Reset selection
      setSelectedRow(null);
      setShowEditBlockManager(false);
  
      console.log("Deleted block:", blockToDelete.id);
    } catch (err) {
      console.error("Failed to delete block:", err);
      alert("Failed to delete block. Please try again.");
    }
  };
  

    // Debounce helper
  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  // Auto-save changes to backend
  const saveRosterUpdate = useCallback(
    debounce(async (id, updatedData) => {
      try {
        await updateUnitRoster(id, updatedData);
        console.log(`✅ Auto-saved roster ID ${id}`);
      } catch (err) {
        console.error("❌ Failed to auto-save:", err);
      }
    }, 500),
    []
  );

  console.log("activeTab:", activeTab);
  console.log("assessmentBlocks:", assessmentBlocks);
  console.log("filteredAssessmentBlocks:", filteredAssessmentBlocks);

  // Handle changes in table inputs/dropdowns
  const handleChange = (index, field, value) => {
    setDisplayRosterData(prev => {
      const updated = [...prev];
      const item = { ...updated[index] };

      switch (field) {
        case "present": item.presentCount = parseInt(value) || 0; break;
        case "excusedAbs": item.excusedAbsences = parseInt(value) || 0; break;
        case "unexcusedAbs": item.unexcusedAbsences = parseInt(value) || 0; break;
        case "excusedTardy": item.excusedTardies = parseInt(value) || 0; break;
        case "unexcusedTardy": item.unexcusedTardies = parseInt(value) || 0; break;
        case "unitOutcome": item.unitOutcome = value; break;
        default: item[field] = value;
      }

      updated[index] = item;

      // Auto-save if the item has an ID
      if (item.id) saveRosterUpdate(item.id, item);

      return updated;
    });
  };
   
  

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full ">
     
      <h2 className="text-md font-bold bg-gray-100 p-0.5  flex items-center border-b border-gray-200 relative">
        <span className="pl-2 text-md text-gray-800">Unit Config</span>
        <span className="flex-grow border-dotted border-t border-gray-400 mx-2"></span>
        
        {showCreateBlockForm && (
          <div className="absolute top-0 left-0  z-50 h-[250px] bg-white shadow-2xl border border-gray-200 rounded-md">
            <CreateBlockManagerForm
              onClose={() => setShowCreateBlockForm(false)}
              unitId={selectedUnit.id}
              candidate={selectedCandidate.id}
              activeTab={activeTab}
              refreshBlocks={fetchBlocksByUnitAndCandidate}
            />
          </div>
        )}
          
      </h2>

       {/* Unit Roster */}
      <div className="h-1/2 border border-gray-300 flex flex-col m-1">

        <div className="flex items-center justify-between border-b-1 border-gray-400 mb-1 px-1 mx-1 mt-1 text-gray-700 ">
          <h2 className="text-sm font-semibold mx-1">Unit Roster</h2>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSearchLookup(true)}
              title="Search Candidates"
              className="text-gray-600 hover:text-black cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>

            {selectedEntitiyRows.length > 0 && (
              <button
                onClick={handleUnitRosterDeleteCurve}
                title="Delete Selected Row(s)"
                className="text-gray-600 hover:text-red-600 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}



          </div>
        </div>

        <div className="flex-1 overflow-auto px-3 ">
          <div className="flex-1 border border-gray-300 overflow-auto">
            <table className="w-full border text-left text-xs">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-1 w-8 text-center">#</th>
                  <th className="border p-1 w-[90px] text-center">Last <br/> Name</th>
                  <th className="border p-1 w-[90px] text-center">First <br/> Name</th>
                  <th className="border p-1 w-[90px] text-center">Candidate <br/> ID</th>
                  <th className="border p-1 w-[90px] text-center">Unit <br/> Outcome</th>
                  <th className="border p-1 w-[90px] text-center">Present <br/> Count</th>
                  <th className="border p-1 w-24 text-center">Excused <br/> Absences</th>
                  <th className="border p-1 w-24 text-center">Unexcused <br/> Absences</th>
                  <th className="border p-1 w-24 text-center">Excused <br/> Tardies</th>
                  <th className="border p-1 w-24 text-center">Unexcused <br/> Tardies</th>
                  <th className="border p-1 w-16 text-center">Total <br/> Tally</th>
                </tr>
              </thead>
              <tbody>
                {displayRosterData.map((rosterItem, index) => {
                  const candidate = rosterItem.candidate || {};
                  const total = (rosterItem.presentCount || 0) +
                    (rosterItem.excusedAbsences || 0) +
                    (rosterItem.unexcusedAbsences || 0) +
                    (rosterItem.excusedTardies || 0) +
                    (rosterItem.unexcusedTardies || 0);

                  const isSelected = selectedEntitiyRows.includes(index);

                  return (
                    <tr
                      key={index}
                      className={`cursor-pointer ${selectedEntitiyRows.includes(index) ? "bg-gray-200" : "hover:bg-gray-50"}`}
                      onClick={() => toggleRowSelectionMulti(index)}
                    >
                      <td className="border text-center">{index + 1}</td>
                      <td className="border text-center px-1">{candidate.lastName || "-"}</td>
                      <td className="border text-center px-1">{candidate.firstName || "-"}</td>
                      <td className="border text-center px-1">{candidate.candidateId || "-"}</td>
                      <td className="border text-center px-1">
                        <select
                          className="w-full border px-1 py-0.5 text-xs text-center"
                          value={rosterItem.unitOutcome || "Ongoing"}
                          onChange={(e) => handleChange(index, "unitOutcome", e.target.value)}
                          onFocus={() => setFormStatus("Editing...")}
                          onBlur={() => setFormStatus("Ready...")}
                        >
                          <option>Ongoing</option>
                          <option>Pass</option>
                          <option>Fail</option>
                        </select>
                      </td>
                      <td className="border px-1">
                        <input
                          type="number"
                          min="0"
                          value={rosterItem.presentCount || 0}
                          onChange={(e) => handleChange(index, "present", e.target.value)}
                          onFocus={() => setFormStatus("Editing...")}
                          onBlur={() => setFormStatus("Ready...")}
                          className="w-full text-center border px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border px-1">
                        <input
                          type="number"
                          min="0"
                          value={rosterItem.excusedAbsences || 0}
                          onChange={(e) => handleChange(index, "excusedAbs", e.target.value)}
                          onFocus={() => setFormStatus("Editing...")}
                          onBlur={() => setFormStatus("Ready...")}
                          className="w-full text-center border px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border px-1">
                        <input
                          type="number"
                          min="0"
                          value={rosterItem.unexcusedAbsences || 0}
                          onChange={(e) => handleChange(index, "unexcusedAbs", e.target.value)}
                          onFocus={() => setFormStatus("Editing...")}
                          onBlur={() => setFormStatus("Ready...")}
                          className="w-full text-center border px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border px-1">
                        <input
                          type="number"
                          min="0"
                          value={rosterItem.excusedTardies || 0}
                          onChange={(e) => handleChange(index, "excusedTardy", e.target.value)}
                          onFocus={() => setFormStatus("Editing...")}
                          onBlur={() => setFormStatus("Ready...")}
                          className="w-full text-center border px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border px-1">
                        <input
                          type="number"
                          min="0"
                          value={rosterItem.unexcusedTardies || 0}
                          onChange={(e) => handleChange(index, "unexcusedTardy", e.target.value)}
                          onFocus={() => setFormStatus("Editing...")}
                          onBlur={() => setFormStatus("Ready...")}
                          className="w-full text-center border px-1 py-0.5 text-xs"
                        />
                      </td>
                      <td className="border text-center px-1 text-center font-semibold">{total}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Assessment Block Manager */}
      <div className="h-1/2 flex flex-col m-1 ">
        <div className="border border-gray-300 flex flex-col">
          <div className="flex flex-col">
            <div className="flex items-center justify-between border-b-1 border-gray-400 mb-1 px-1 mx-1 mt-1 text-gray-700 ">
              <h2 className="text-sm font-semibold mx-1">Assessment Block Manager</h2>

              <div className="flex items-center gap-1">
                {selectedCandidate && (
                  <button
                    onClick={() => { 
                      if (!selectedCandidate) {
                        toast.error("Please select the candidate");
                      }
                      else {
                        setShowCreateBlockForm(true);
                        setFormStatus("Creating...");
                      }
                      
                    }
                    }
                    title="Add new"
                    className="p-1.5 text-gray-600 hover:text-black transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 " />
                  </button>
                )}

                {selectedRow !== null && (
                  <button
                    className="p-1.5 text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                    onClick={handleDeleteBlock}
                  >
                    <span className="flex items-center gap-2 ">
                      <Trash2 className="w-3.5 h-3.5 " />
                    </span>
                  </button>
                )}


                {/* Move Up / Move Down buttons – only visible if that tab has data */}
                {activeTab === "Direct" && assessmentBlocks.filter(b => b.ppId > 0).length > 0 && (
                  <>
                    <button
                      onClick={moveRowUp}
                      title="Move Up"
                      className="text-gray-600 hover:text-black cursor-pointer p-1.5"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={moveRowDown}
                      title="Move Down"
                      className="text-gray-600 hover:text-black cursor-pointer p-1.5"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

                {activeTab === "Indirect" && assessmentBlocks.filter(b => b.ppId < 0).length > 0 && (
                  <>
                    <button
                      onClick={moveRowUp}
                      title="Move Up"
                      className="text-gray-600 hover:text-black cursor-pointer p-1.5"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={moveRowDown}
                      title="Move Down"
                      className="text-gray-600 hover:text-black cursor-pointer p-1.5"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}

              </div>
            </div>
            
            <div className="flex items-center justify-between border-b p-1 bg-gray-100 mx-2">
              {/* Tab Buttons */}
              <div className="flex space-x-2">
                <button
                  className={`px-3 py-1 text-sm cursor-pointer ${activeTab === "Indirect"
                    ? "bg-white border-t-2 border-blue-400 text-gray-800 font-semibold "
                    : "hover:bg-gray-100"
                    }`}
                  onClick={() => { setActiveTab("Indirect"); setSelectedRow(null); setShowEditBlockManager(false) }}
                >
                  Indirect Performance Points (Master)
                </button>
                <button
                  className={`px-3 py-1 text-sm cursor-pointer ${activeTab === "Direct"
                    ? "bg-white border-t-2 border-blue-400 text-gray-800 font-semibold "
                    : "hover:bg-gray-100"
                    }`}
                  onClick={() => { setActiveTab("Direct"); setSelectedRow(null); setShowEditBlockManager(false) }}
                >
                  <p>Direct Performance Points (Master)</p>
                </button>

              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 p-2">
            {activeTab === "Direct" && (
              <div className=" flex-1 overflow-y-auto h-full border border-gray-200">
                <table className="w-full text-left text-xs border-collapse h-full">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="whitespace-nowrap border p-1 w-10 text-center">PP ID</th>
                      <th className="whitespace-nowrap border p-1 text-center">Period Type</th>
                      <th className="whitespace-nowrap border p-1 text-center">Short Description</th>
                      <th className="whitespace-nowrap border p-1 text-center">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessmentBlocks.map((block, index) => (
                      <tr className={`hover:bg-gray-50 overflow-auto cursor-pointer ${selectedRow === index ? "bg-gray-200" : ""} `} key={`direct-${block.id}`}
                        onClick={() => handleRowClick(block, index)}>
                        {/* <td className="border flex justify-between p-1 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRow.includes(index)}
                            onChange={() =>{toggleRowSelection(index); setShowEditBlockManager(true); setShowEdit(false)} }
                            className="mr-1"
                          />
                          +{index + 1}
                        </td> */}
                        <td className="whitespace-nowrap border p-1 text-center">{block.ppId}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{block.periodType}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{block.shortDescription}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{block.delivery}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "Indirect" && (
              <div className="flex-1 overflow-auto h-full border border-gray-200">
                <table className="w-full text-left text-xs border-collapse ">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="whitespace-nowrap border p-1 w-10 text-center">PP ID</th>
                      <th className="whitespace-nowrap border p-1 text-center">Period Type</th>
                      <th className="whitespace-nowrap border p-1 text-center">Short Description</th>
                      <th className="whitespace-nowrap border p-1 text-center">Delivery</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssessmentBlocks.map((block, index) => (

                      <tr className={`hover:bg-gray-50  cursor-pointer ${selectedRow === index ? "bg-gray-200" : ""} `}  key={`indirect-${block.id}`} 
                        onClick={() => handleRowClick(block, index)}>

                        <td className="whitespace-nowrap border p-1 text-center">{block.ppId}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{block.periodType}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{block.shortDescription}</td>
                        <td className="whitespace-nowrap border p-1 text-center">{block.delivery}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Lookup Modal */}
      {showSearchLookup && (
        <SearchLookup
          onClose={() => setShowSearchLookup(false)}
          refreshRoster={fetchRosterData}
          existingCandidates={existingCandidates}
          selectedUnit={selectedUnit}
          unitRosterData={unitRosterData}
          refreshCandidateData={refreshCandidateData} 
        />
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  );
}