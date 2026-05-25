"use client";
import {
  ChevronDown,
  ChevronRight,
  Edit,
  Edit3,
  Play,
  Plus,
  Settings,
  ShieldUser,
  Trash,
  Trash2,
  UsersRound,
  X,
  Search,
  Copy,
  Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import UnitEditor from "./components/UnitEditor";
import CreateUnitForm from "./components/CreateUnitForm";
import UnitRoster from "./components/UnitRoster";
import CreateBlockManagerForm from "./components/CreateBlockManagerForm";
import { createUnit, deleteUnit, getAllUnits, updateUnit } from "@/services/unitService";
import { getAllCandidates } from "@/services/candidateService";
import { createUnitRoster, getAllUnitRoster, getUniRostertByUnitId } from "@/services/unitRosterService";
import { useFormStatus } from "@/context/FormStatusContext";
import { useUnit } from "@/context/UnitContext";
import { createAssessmentBlock, createDuplicateAssessmentBlock, getAssessmentBlockByUnitAndCandidate, getAssessmentBlockByUnitId } from "@/services/assessmentBlockManagerService";
import { createScoringCriteria, getScoringCriteriaByUnitId } from "@/services/scoringCriteriaService";
import { createInsertScore, getInsertScoreByUnitAndCandidate } from "@/services/insertScoreService";
import { createBenchmark } from "@/services/benchmarkService";
import toast, { Toaster } from "react-hot-toast";
import { useClient } from "@/context/ClientContext";
import { getStaffById } from "@/services/staffService";

export default function UnitControl() {
  const router = useRouter();
  const contextRef = useRef(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showAddBlockManager, setShowAddBlockManager] = useState(false);
  const [unitToDuplicate, setUnitToDuplicate] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [showEditBlockManager, setShowEditBlockManager] = useState(false);

  const [showList, setShowList] = useState(true);
  const [sortField, setSortField] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const formRef = useRef(null);
  const createFormRef = useRef(null);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [showUnitRoster, setUnitRoster] = useState(false);
  const [displayRosterData, setDisplayRosterData] = useState([]);

  const [assessmentBlocks, setAssessmentBlocks] = useState([]);
  // unit tabs
  const [activeTab, setActiveTab] = useState("Indirect");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dataList, setDataList] = useState([
    // { id: "u001", environment:'classroom', name: "Unit1", type:'communicative' },
    // { id: "u002", environment:'workspace', name: "Unit2", type:'theory practical' },
    // { id: "u003", environment:'classroom', name: "Unit3", type:'third parameter' },
    // { id: "u004", environment:'workspace', name: "Unit4", type:'communicative' },
  ]);
  const [unitRosterData, setUnitRosterData] = useState([]);
  const [candidateList, setCandidateList] = useState([]);
  const [sortBy, setSortBy] = useState("id");
  const [candidateSortOrder, setCandidateSortOrder] = useState("asc");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [isSelected, setIsSelected] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [customCriteria, setCustomCriteria] = useState([]);

  const [classroomData, setClassroomData] = useState([]);
  const [workforceData, setWorkforceData] = useState([]);
  const [insertScores, setInsertScores] = useState([]);

  // const [formStatus, setFormStatus] = useState("Ready");
  const { setFormStatus } = useFormStatus();
  // const { activeClientId, setActiveClientId } = useClient();
  const controlsRef = useRef(null);
  const { selectedUnitId, setSelectedUnitId } = useUnit(); 
  // const loggedInUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  // const activeClientId = sessionStorage.getItem('activeClientId');
  const [staff, setStaff] = useState();
  const [activeClientId, setActiveClientId] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
  
    if (!token || !user) {
      router.replace("/login");
    }

    setLoggedInUser(JSON.parse(user));
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedClientId = sessionStorage.getItem("activeClientId");
      setActiveClientId(storedClientId);
    }
  }, []);

  // Fetch all units on mount
  useEffect(() => {
    if (!activeClientId) return;

    const fetchUnits = async () => {
      try {
        setLoading(true);
        
        const units = await getAllUnits(activeClientId);
        setDataList(Array.isArray(units) ? units : []);
        console.log("units in control: " , units, " using data list: ", dataList);
        if (units.length > 0) {
          setSelectedUnit(units[0]);
          setShowEdit(true);
        }
      } catch (err) {
        console.error("Failed to fetch units:", err);
        setError("Failed to load units. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnits();
  }, [activeClientId]);

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

  useEffect(() => {
    const fetchCriteria = async () => {
      if (!selectedUnit?.id) return;
  
      try {
        const data = await getScoringCriteriaByUnitId(selectedUnit?.id);
        if (!Array.isArray(data)) throw new Error("Invalid scoring criteria response");
  
        // Sort by criteriaId to keep correct order
        const sorted = [...data].sort((a, b) => a.criteriaId - b.criteriaId);
  
        setCustomCriteria(data);
      } catch (err) {
        console.error("Failed to fetch scoring criteria:", err);
      }
    };
  
    fetchCriteria();
  }, [selectedUnit?.id]);

  // Fetch all candidates on mount
  useEffect(() => {
    if (!activeClientId) return;

    const fetchCandidates = async () => {
      try {
        setLoading(true);
        
        const data = await getAllCandidates(activeClientId);
        setCandidateList(Array.isArray(data) ? data : []);
        console.log(data);
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
        setError("Failed to load candidates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchCandidates();
  }, [activeClientId]);

  // Fetch all candidates on mount
  useEffect(() => {
    const fetchUnitRoster  = async () => {
      try {
        setLoading(true);
        const data = await getAllUnitRoster();
        setUnitRosterData(Array.isArray(data) ? data : []);
        // Extract unique candidates from roster data
        const uniqueCandidates = data.reduce((acc, rosterItem) => {
          if (rosterItem.candidate && !acc.some(c => c.id === rosterItem.candidate.id)) {
            acc.push(rosterItem.candidate);
          }
          return acc;
        }, []);
        
        setCandidateList(uniqueCandidates);
        // console.log(uniqueCandidates);
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
        setError("Failed to load candidates. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnitRoster();
  }, []);

  const handleRosterUpdate = (updatedRoster) => {
    setUnitRosterData(prev => {
      // Remove old roster item if exists
      const filtered = prev.filter(r => r.id !== updatedRoster.id);
      const newRosterData = [...filtered, updatedRoster];
  
      // Rebuild candidate list from updated roster
      const uniqueCandidates = newRosterData.reduce((acc, rosterItem) => {
        const candidate = rosterItem.candidate;
        if (candidate && !acc.some(c => c.id === candidate.id)) {
          acc.push(candidate);
        }
        return acc;
      }, []);
      setCandidateList(uniqueCandidates);
  
      return newRosterData;
    });
  };


  // Filtered candidate list based on searchTerm
const filteredCandidates = unitRosterData
.filter(roster => roster.unitId === selectedUnit?.id) // only current unit
.filter(roster => {
  const candidate = roster.candidate;
  if (!candidate) return false;
  const term = searchTerm.toLowerCase();
  return (
    (candidate.lastName || "").toLowerCase().includes(term) ||
    (candidate.firstName || "").toLowerCase().includes(term) ||
    (candidate.candidateId || "").toLowerCase().includes(term)
  );
});


  // Add this function to refresh candidate data
  const refreshCandidateData = async () => {
    try {
      setLoading(true);
      const data = await getAllUnitRoster();
      setUnitRosterData(Array.isArray(data) ? data : []);
      
      // Extract unique candidates from roster data
      const uniqueCandidates = data.reduce((acc, rosterItem) => {
        if (rosterItem.candidate && !acc.some(c => c.id === rosterItem.candidate.id)) {
          acc.push(rosterItem.candidate);
        }
        return acc;
      }, []);
      
      setCandidateList(uniqueCandidates);
    } catch (err) {
      console.error("Failed to fetch candidates:", err);
      setError("Failed to load candidates. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  // Fetch all candidates on mount
  // Fetch unit roster by unit ID when selectedUnit changes
  useEffect(() => {
    const fetchUnitRosterByUnitId = async () => {
      if (!selectedUnit?.id) return;
      
      try {
        setLoading(true);
        const data = await getUniRostertByUnitId(selectedUnit.id) || [];
        if (data.length > 0) {
          setUnitRosterData(Array.isArray(data) ? data : []);
          console.log("Unit Roster Data:", data);
        }
        
      } catch (err) {
        console.error("Failed to fetch unit roster:", err);
        setError("Failed to load unit roster. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnitRosterByUnitId();
  }, [selectedUnit?.id]);

   // Fetch staff data only if logged-in user is staff
   useEffect(() => {

    if (!loggedInUser?.staffId) {
      return;
    }

    const fetchStaffById = async () => {
      try {
        setLoading(true);
        const data = await getStaffById(loggedInUser?.staffId);
        setStaff(data);
        console.log("Staff data:", data);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setError("Failed to load staff data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffById();
  }, [loggedInUser?.staffId]);
  
  // ✅ Add handleCreate
  const handleCreate = async (newUnit) => {
    try {
      const duplicate = dataList.some(
        (u) => u.unitId?.toLowerCase() === newUnit.unitId?.toLowerCase()
      );
  
      if (duplicate) {
        toast.error(`A unit with ID "${newUnit.unitId}" already exists.`);
        setShowAdd(true);
        return false;  // Stop submission
      }

      const unitWithAccount = {
        ...newUnit,
        accountId: loggedInUser?.id, // ✅ assign accountId
        clientId: activeClientId, 
      };

      const data = await createUnit(unitWithAccount);
       
      setDataList((prev) => [...prev, data]); // update datalist
      setSelectedUnit(data); 

      setShowAdd(false); // ✅ only closes after successful creation
      return true;// close form after success
    } catch (err) {
      console.error("Error updating unit list:", err);
      toast.error("Failed to create unit. Please try again.");
      return false;
    }
  };


  


  const sortedDataList = [...dataList].sort((a, b) => {
    const getValue = (item) => {
      const value = sortField === "name" ? item.unitName : item[sortField];
      return sortField === "id" ? String(value) : String(value || "").toLowerCase();
    };
  
    const valA = getValue(a);
    const valB = getValue(b);
  
    if (sortField === "id") {
      return sortOrder === "asc" 
        ? valA.localeCompare(valB, undefined, { numeric: true })
        : valB.localeCompare(valA, undefined, { numeric: true });
    }
  
    return sortOrder === "asc" 
      ? valA.localeCompare(valB)
      : valB.localeCompare(valA);
  });

  const filteredUnits = sortedDataList.filter(unit =>
    (unit.unitName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (unit.unitId || "").toLowerCase().includes(searchTerm.toLowerCase()) // <-- added unitId
  );

  // Handle sorting
  const getSortedData = () => {
    return [...candidateList].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "id") {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return candidateSortOrder === "asc" ? -1 : 1;
      if (valA > valB) return candidateSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // This used to manage right-click context menu
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedUnit: null,
  });

  // Delete unit
  const handleDelete = async (id) => {
    try {
      setFormStatus('processing...')
      await deleteUnit(id);
      const updated = dataList.filter(item => item.id !== id);
      setDataList(updated);
      setFormStatus('Unit Deleted')
      if (selectedUnit?.id === id) {
        setSelectedUnit(updated[0] || null);
        setShowEdit(updated.length > 0);
      }
      
      setContextMenu(prev => ({ ...prev, visible: false }));
    } catch (err) {
      console.error("Failed to delete unit:", err);
      setError("Failed to delete unit.");
    }
  };

  // Select candidate from roster
  const handleCandidateSelect = (candidate) => {
    setSelectedCandidate(prev =>
      prev?.id === candidate?.id ? null : candidate
    );
  };  


  // Add this near your other state
  const fetchBlocksByUnitAndCandidate = async () => {
    if (!selectedUnit?.id || !selectedCandidate?.id) return;
    try {
      setLoading(true);
      const blocks = await getAssessmentBlockByUnitId(selectedUnit.id);
      
      // Handle the response properly - it could be a single object or an array
      if (Array.isArray(blocks)) {
        setAssessmentBlocks(blocks);
      } else if (blocks && typeof blocks === 'object') {
        // If it's a single object, wrap it in an array
        setAssessmentBlocks([blocks]);
      } else {
        setAssessmentBlocks([]);
      }
      
      console.log("blocks", blocks);
    } catch (err) {
      console.error("Failed to fetch blocks:", err);
      setError("Failed to load blocks. Please try again.");
      setAssessmentBlocks([]);
    } finally {
      setLoading(false);
    }
  };

  // console.log("selected candidate in roster", assessmentBlocks );
  // call it when unit changes
  useEffect(() => {
    fetchBlocksByUnitAndCandidate();
  }, [selectedUnit?.id, selectedCandidate?.id]);
  


  useEffect(() => {
    const handleClickOutside = (e) => {
      const isContextMenuClick =
        contextRef.current && contextRef.current.contains(e.target);
      const isUnitClick = e.target.closest(".unit-item");
      const isFormClick = formRef.current && formRef.current.contains(e.target);
      const isCreateFormClick = createFormRef.current && createFormRef.current.contains(e.target);
      const isControlClick = controlsRef.current && controlsRef.current.contains(e.target);

      // If clicked outside both context menu and unit item will deselect
      if (!isContextMenuClick && !isUnitClick && !isFormClick & !isControlClick & !isCreateFormClick) {
        setContextMenu({ visible: false, x: 0, y: 0, selectedUnit: null });
        setSelectedUnit(null);
        setShowEdit(false);
        setFormStatus("Ready...");
      }
    };

    if (showUnitRoster) return;

    if (dataList.length > 0) {
      setSelectedUnit(dataList[0]);
      setShowEdit(true);
      setShowAdd(false);
    } else {
      setSelectedUnit(null);
      setShowEdit(false);
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [dataList, showUnitRoster]);


  // Remove or simplify the handleBlockUpdate function since UnitRoster handles it
  const handleBlockUpdate = (updatedBlock) => {
    // console.log("Block updated:", updatedBlock);
    // UnitRoster will handle the refresh internally
  };

  // Modify the handleUnitSave function in UnitControl
  const handleUnitSave = async (updatedUnit) => {
    try {
      setLoading(true);
      setFormStatus("Processing...");
      // Call the update API
      const result = await updateUnit(updatedUnit.id, updatedUnit);
      
      // console.log(result);
      // Update the local state
      setDataList(prev =>
        prev.map(unit => unit.id === updatedUnit.id ? result : unit)
      );
      setSelectedUnit(result);
      setShowEdit(false);
      
      setFormStatus("Unit Updated");
      

      return result;
    } catch (err) {
      console.error("Failed to update unit:", err);
      setError("Failed to update unit. Please try again.");
      setFormStatus("Ready...");
      throw err;
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    const fetchAndSeparateScores = async () => {
    if (!selectedUnit?.id || !selectedCandidate?.id) return;
  
      // Reset previous data
      setClassroomData([]);
      setWorkforceData([]);
      setInsertScores([]);
      setLoading(true);
      setError(null);
  
      try {
        const data = await getInsertScoreByUnitAndCandidate(selectedUnit?.id, selectedCandidate?.id);
        if (!Array.isArray(data)) throw new Error("Invalid insert score response");
        // console.log("Fetched insert scores:", data);
  
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


        // ✅ sort by ppId ascending before setting state
        classroomRows.sort((a, b) => parseInt(a.ppId, 10) - parseInt(b.ppId, 10));
        workforceRows.sort((a, b) => parseInt(a.ppId, 10) - parseInt(b.ppId, 10));
  
        setClassroomData(classroomRows);
        setWorkforceData(workforceRows);
        setInsertScores(data);
  
      } catch (err) {
        console.error("Error fetching insert scores:", err);
        setError("Failed to load insert scores.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchAndSeparateScores();
  }, [selectedUnit?.id, selectedCandidate?.id]);


  const refreshAssessmentBlocks = async () => {
    // This would need to be implemented to fetch blocks from UnitRoster
    // But this approach is more complex since UnitRoster manages the blocks state
    console.log("Refresh assessment blocks");
  };

  // Add this computed value to get filtered roster data
  const filteredUnitRosterData = unitRosterData.filter(roster => 
    (roster.unitId === selectedUnit?.id || roster.unit?.id === selectedUnit?.id) &&
    (!selectedCandidate || roster.candidate?.id === selectedCandidate.id)
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedUnit) return; // ✅ require a selected unit
  
      // Ctrl + E → Duplicate
      if (e.ctrlKey && e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleDuplicate(selectedUnit);
      }
  
      // Ctrl + C → Unit Config
      if (e.ctrlKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        setSelectedUnit(selectedUnit);
        setSelectedUnitId(selectedUnit.id);
        setUnitRoster(true);
        setShowAdd(false);
        setShowEdit(false);
  
        const rosterForUnit = unitRosterData.filter(
          (r) => r.unitId === selectedUnit.id || r.unit?.id === selectedUnit.id
        );
        if (rosterForUnit.length > 0) {
          setSelectedCandidate(rosterForUnit[0].candidate);
        } else {
          setSelectedCandidate(null);
        }
      }
  
      // Delete → Delete unit
      if (e.key === "Delete") {
        e.preventDefault();
        handleDelete(selectedUnit.id);
      }
  
      // Ctrl + 2 → Activate Setup View
      if (e.ctrlKey && e.key === "2") {
        e.preventDefault();
        setSelectedUnitId(selectedUnit.id);
        router.push(
          `/dashboard/setup-view/insert-scores?unitId=${encodeURIComponent(selectedUnit.id)}&environment=${encodeURIComponent(selectedUnit.environment)}&type=${encodeURIComponent(selectedUnit.unitType)}`
        );
      }
  
      // Ctrl + 3 → Activate Analytics View
      if (e.ctrlKey && e.key === "3") {
        e.preventDefault();
        setSelectedUnitId(selectedUnit.id);
        router.push(
          `/dashboard/analytics-view/scoring-trends?unitId=${encodeURIComponent(selectedUnit.id)}&environment=${encodeURIComponent(selectedUnit.environment)}&type=${encodeURIComponent(selectedUnit.unitType)}`
        );
      }
    };
  
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUnit, unitRosterData, router, setSelectedUnitId]);
  

  const handleDuplicate = (unit) => {
    if (!unit) return;

      // ✅ Clean up any IDs or timestamps to avoid conflicts
  const unitToCopy = {
    ...unit,
    staffAssignments: unit.staffAssignments
      ? unit.staffAssignments.map(sa => ({
          roleType: sa.roleType,
          staff: { ...sa.staff } // Copy staff details
        }))
      : [],
  };
  
    // Pass the unit to duplicate form
  

    
  
    // Close context menu if visible
    setContextMenu(prev => ({ ...prev, visible: false }));
    setUnitToDuplicate(unitToCopy);
    console.log("staff data check:: -->", unitToCopy);
    // Show the Add/Duplicate form
    setShowAdd(true);
    setFormStatus("Creating...");
  };


  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-1/2 lg:w-3/12 bg-white shadow-sm border-r border-gray-200 flex flex-col">
      <div className="flex flex-col border-1 border-gray-200 overflow-hidden h-1/2 ">
          {/* Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-1.5">
          
            {/* Control buttons */}
            <div className="flex flex-col mb-3">
              <div className="flex justify-end gap-1">
                {!showAdd && showUnitRoster ? (
                  <button
                    className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium text-white bg-gray-200 hover:bg-gray-400 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedUnit(null);
                      setShowEdit(false);
                      setShowAdd(false);
                      setShowAddBlockManager(false);
                      setShowEditBlockManager(false);
                      setUnitRoster(false);
                    }}
                  >
                    <Undo2 className="w-3.5 h-3.5 text-black"/>
                  </button>
                ) : (
                  <>
                    	{!(loggedInUser?.role === "staff" && staff?.accessLevel === "Leaders Access") && (
                      <button ref={controlsRef}
                        className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium text-white bg-gray-200 hover:bg-gray-400 transition-colors cursor-pointer"
                        onClick={() => {
                          if (showUnitRoster) {
                            setShowAddBlockManager(true);
                          } else {
                            setSelectedUnit(null);
                            setShowAdd(true);
                            setShowEdit(false);
                            setFormStatus("Creating...");
                          }
                        }}
                      >
                        <Plus className="w-3.5 h-3.5 text-black" />
                      </button>
                      )}

                    {selectedUnit && (
                      <div className="flex gap-1 unit-item">
                        <button
                          className="p-1.5 text-gray-600 bg-gray-200 hover:bg-gray-400 hover:text-white transition-colors"
                          onClick={() => handleDelete(selectedUnit.id)}
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="relative w-full mt-1">
                <input
                  type="text"
                  className="border w-full pl-2 pr-8 py-1 text-sm bg-white"
                  placeholder="Search"
                  value={searchTerm}                 // ✅ Controlled input
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
              </div>
            </div>

            {/* Conditional Column Headers */}
            {showUnitRoster ? (
              <div className="grid grid-cols-3 gap-1 text-xs font-semibold text-black">
                <div className="cursor-pointer select-none">Last Name</div>
                <div className="cursor-pointer select-none">First Name</div>
                <div className="cursor-pointer select-none">Candidate ID</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1 text-xs font-semibold text-black">
                <div
                  className="flex items-center cursor-pointer select-none"
                  onClick={() => {
                    if (sortField === "unitName") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("unitName");
                      setSortOrder("asc");
                    }
                  }}
                >
                  Name
                </div>
                <div
                  className="flex items-center cursor-pointer select-none"
                  onClick={() => {
                    if (sortField === "id") {
                      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                    } else {
                      setSortField("id");
                      setSortOrder("asc");
                    }
                  }}
                >
                  Unit ID
                </div>
              </div>
            )}
        
          </div>

          {/* <div className=""> */}
          {!showAdd && showUnitRoster && (
            <div className=" pb-1 flex-1 overflow-auto">
              

              {/* Unit Details (smaller and less prominent) */}
              <div className="items-center justify-center px-4 py-2 mt-1 mb-2 ">
                <div className="border border-gray-200 p-2">
                  <span className="text-sm text-gray-600">
                    Unit Name: {selectedUnit?.unitName || "N/A"}
                  </span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Unit ID: {selectedUnit?.unitId || "N/A"}
                  </span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Unit Type: {selectedUnit?.unitType || "N/A"}
                  </span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Signature Profile: {selectedUnit?.signatureProfile || "N/A"}
                  </span>
                </div>
              </div>

              {/* Candidate List */}
              <div className="max-h-40 overflow-y-auto">
                {filteredCandidates.map((rosterItem, index) => (
                    <div 
                    key={index}
                    className={`grid grid-cols-3 gap-1 px-4 py-1 border-b border-gray-200 cursor-pointer 
                      ${selectedCandidate?.id === rosterItem.candidate?.id ? "bg-blue-100 border-l-4 border-l-blue-400 text-black"
                        : "hover:bg-gray-50"}`}
                    onClick={() => handleCandidateSelect(rosterItem.candidate)}
                    >
                      <div className="text-sm">{rosterItem.candidate?.lastName || 'N/A'}</div>
                      <div className="text-sm">{rosterItem.candidate?.firstName || 'N/A'}</div>
                      <div className="text-sm">{rosterItem.candidate?.candidateId || 'N/A'}</div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}
          {/* </div> */}

          {/* List Toggle */}
          {!showUnitRoster && (
            <div className="flex-[1.1] min-h-0 overflow-auto">
              <div
                className="flex items-center px-4 py-2 cursor-pointer select-none hover:text-gray-700 transition-colors"
                onClick={() => setShowList((prev) => !prev)}
              >
                {showList ? (
                  <ChevronDown className="w-4 h-4 text-gray-700 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-700 mr-1" />
                )}
                <p className="text-sm font-medium text-gray-900">
                  Units ({dataList.length})
                </p>
              </div>
              {/* <div className="items-center justify-center px-4">
                <div className="border border-gray-200 p-1">
                  <span className="text-sm text-gray-600">
                    Unit Name: {selectedUnit?.unitName || "N/A"}
                  </span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Unit ID: {selectedUnit?.unitId || "N/A"}
                  </span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Unit Type: {selectedUnit?.unitType || "N/A"}
                  </span>
                  <br />
                  <span className="text-sm text-gray-600">
                    Signature Profile: {selectedUnit?.signatureProfile || "N/A"}
                  </span>
                </div>
              </div> */}

              {showList &&
                filteredUnits.map((item, index) => {
                  const isSelected = selectedUnit && selectedUnit.id === item.id;
                  return (
                    <div
                      key={item.id}
                      className={`unit-item grid grid-cols-2 gap-2 items-center cursor-pointer px-4 py-2 border-b border-gray-50 transition-all ${isSelected
                        ? "bg-blue-100 border-l-4 border-l-blue-400 text-black"
                        : "hover:bg-gray-50"
                        }`}
                      onClick={() => {
                        setSelectedUnit(item);
                        setShowEdit(true);
                        setShowAdd(false);
                        // setFormStatus("Editing...");
                      }}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedUnit(item);
                        setContextMenu({
                          visible: true,
                          x: e.pageX,
                          y: e.pageY,
                          selectedUnit: item,
                        });
                      }}
                    >
                      <p
                        className={`text-sm font-medium truncate ${isSelected ? "text-black" : "text-gray-800"
                          }`}
                      >
                        {item.unitName}
                      </p>
                      <p
                        className={`text-sm font-medium truncate ${isSelected ? "text-black" : "text-gray-800"
                          }`}
                      >
                        {item.unitId}
                      </p>

                    </div>
                  );
                })}

                {/* Header */}
          

            {/* List Toggle */}
            <div className="flex-[1.1] min-h-0 overflow-auto">
            

            {/* {showList &&
              getSortedData().map((item, index) => {
                const isSelected = selectedCandidate?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`candidate-item grid grid-cols-3 gap-4 items-center cursor-pointer px-4 py-2 border-b border-gray-50 transition-all ${
                      isSelected
                        ? "bg-blue-100 border-l-4 border-l-blue-400 text-black"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      
                      setShowEdit(true);
                      setShowAdd(false);
                      setShowReview(false);
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      
                      setContextMenu({
                        visible: true,
                        x: e.pageX,
                        y: e.pageY,
                        selectedCandidate: item,
                      });
                    }}
                  >
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-black" : "text-gray-800"
                      }`}
                    >
                      {item.lastName}
                    </p>
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-black" : "text-gray-800"
                      }`}
                    >
                      {item.firstName}
                    </p>
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? "text-black" : "text-gray-800"
                      }`}
                    >
                      {item.id}
                    </p>
                  </div>
                );
              })} */}

            </div>
                
          </div>
          )}
        </div>


        {/* <div className="flex flex-col border-1 border-gray-200  overflow-hidden h-1/3">
          
        </div>  */}

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            ref={contextRef}
            className="unit-item absolute bg-gray-200 border font-semibold border-gray-300 shadow-md z-50 w-70"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="flex justify-between items-center px-4 py-2 text-xs text-gray-800 hover:bg-gray-300 w-full text-left"
              onClick={async (e) => {
                
                e.stopPropagation();
                if (contextMenu.selectedUnit) {
                  handleDuplicate(contextMenu.selectedUnit);// ✅ pass selected unit
                }
                setShowAdd(true);
              }}
            >
              <span className="flex items-center gap-2">
                <Copy className="w-4 h-4" /> Duplicate
              </span>
              <span className="text-gray-400 text-xs ml-4">Ctrl + E</span>
            </button>


            <button
              className="flex justify-between items-center px-4 py-2 text-xs text-gray-800 hover:bg-gray-300 w-full text-left border-t border-gray-200"
              onClick={() => {
                const unit = contextMenu.selectedUnit;
                setSelectedUnit(unit);
                setSelectedUnitId(unit.id);
                setUnitRoster(true);
                setShowAdd(false);
                setShowEdit(false);
                console.log("Global Unit Id: ", unit.id);
                // auto-select first candidate in roster
                const rosterForUnit = unitRosterData.filter(
                  r => r.unitId === unit.id || r.unit?.id === unit.id
                );
                if (rosterForUnit.length > 0) {
                  setSelectedCandidate(rosterForUnit[0].candidate);
                } else {
                  setSelectedCandidate(null);
                }

                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span className="flex items-center gap-2">
                <Settings className="w-4 h-4" /> Unit Config
              </span>
              <span className="text-gray-400 text-xs ml-4">Ctrl + C</span>
            </button>


            <button
              className="flex justify-between items-center px-4 py-2 text-xs text-gray-800 hover:bg-red-200 w-full text-left border-t border-gray-200"
              onClick={() => {
                handleDelete(contextMenu.selectedUnit.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </span>
              <span className="text-gray-400 text-xs ml-4">Del</span>
            </button>

            <button
              className="flex justify-between items-center px-4 py-2 text-xs text-gray-800 hover:bg-gray-300 w-full text-left border-t border-gray-200"
              onClick={() => {
                const unit = contextMenu.selectedUnit;
                setSelectedUnit(unit);
                setSelectedUnitId(unit.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
                router.push(`/dashboard/setup-view/insert-scores`);
              }}
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Activate Setup View
              </span>
              <span className="text-gray-400 text-xs ml-4">CTRL + 2</span>
            </button>


            <button
              className="flex justify-between items-center px-4 py-2 text-xs text-gray-800 hover:bg-gray-300 w-full text-left border-t border-gray-200"
              onClick={() => {
                if (contextMenu.selectedUnit) {
                  setSelectedUnitId(contextMenu.selectedUnit.id);
                  console.log("Global Unit Id: ", contextMenu.selectedUnit.id);
                }
                setContextMenu((prev) => ({ ...prev, visible: false }));
                router.push(`/dashboard/analytics-view/scoring-trends?unitId=${encodeURIComponent(contextMenu.selectedUnit.id)}&environment=${encodeURIComponent(contextMenu.selectedUnit.environment)}&type=${encodeURIComponent(contextMenu.selectedUnit.unitType)}`);
              }}
            >
              <span className="flex items-center gap-2">
                <Play className="w-4 h-4" />
                Activate Analytics View
              </span>
              <span className="text-gray-400 text-xs ml-4">CTRL + 3</span>
            </button>
          </div>
        )}

        {/* Unit editor Section */}
        <div className="h-1/2 my-0.5" ref={formRef}>
          <UnitEditor
            unitId={selectedUnit?.id}
            candidateId={selectedCandidate?.id}
            selectedBlock={selectedBlock}
            onClose={() => {
              setShowEdit(false);
              setShowEditBlockManager(false);
            }}
            showUnitForm={selectedUnit && showEdit}
            showEditBlockManager={selectedUnit && showEditBlockManager}
            activeTab={activeTab}
            onSave={handleUnitSave} 
            updateUnit={updateUnit} 
            onBlockUpdate={handleBlockUpdate}
            refreshAssessmentBlocks={refreshAssessmentBlocks} 
          />

        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 lg:w-9/12 bg-white">
        {showAdd && (
          <div className="h-full flex flex-col w-96" ref={createFormRef}>
            <CreateUnitForm onClose={() => {
               setShowAdd(false)
               setUnitToDuplicate([])}} onSubmit={handleCreate} unitData={unitToDuplicate}  />
          </div>
        )}

        {showAddBlockManager && (
          <div className="h-full flex flex-col w-96">
            <CreateBlockManagerForm onClose={() => setShowAddBlockManager(false)} activeTab={activeTab} />
          </div>
        )}

        {!showAdd && showUnitRoster && (
          <div className="h-full overflow-auto">
            <UnitRoster activeTab={activeTab}  setActiveTab={setActiveTab} setShowEditBlockManager={setShowEditBlockManager} setShowEdit={setShowEdit}
            unitRosterData={filteredUnitRosterData} // Pass filtered data
            selectedUnit={selectedUnit}
            selectedCandidate={selectedCandidate}
            onBlockSelect={setSelectedBlock}
            onRosterUpdate={handleRosterUpdate}
            refreshCandidateData={refreshCandidateData} 
            showEditBlockManager={showEditBlockManager}
               />
          </div>
        )}
      </div>
      {/* <Toaster position="top-right" reverseOrder={false} /> */}
    </div>
  );
}
