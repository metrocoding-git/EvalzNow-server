"use client";

import {
  Edit3,
  Eye,
  Trash2,
  CopyPlus,
  Plus,
  Trash,
  ChevronDown,
  ChevronRight,
  Search,
  List,
  View,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import CandidateEditor from "./components/CandidateEditor";
import CreateCandidateForm from "./components/CreateCandidateForm";
import ReviewCandidate from "./components/ReviewCandidate";
import { createCandidate, deleteCandidate, getAllCandidateEthinicities, getAllCandidateIncomes, getAllCandidates } from "@/services/candidateService";
import { createEthinicity, deleteEthinicity, getAllEthinicities, updateEthinicity } from "@/services/ethinictyService";
import { createIncome, deleteIncome, getAllIncomes, updateIncome } from "@/services/incomeService";
import { useFormStatus } from "@/context/FormStatusContext";
import toast, { Toaster } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useClient } from "@/context/ClientContext";
import useDebounce from "@/hooks/useDebounce";

export default function CandidateControl() {
  const contextRef = useRef(null);
  const formRef = useRef(null);
  const createFormRef = useRef(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showList, setShowList] = useState(true);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState("asc");
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [ethnicities, setEthnicities] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [showObjects, setShowObjects] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [dataList, setDataList] = useState([
    // { id: "001", firstName: "John", lastName: "Doe" },
    // { id: "002", firstName: "Jane", lastName: "Smith" },
    // { id: "003", firstName: "Alex", lastName: "Johnson" },
    // { id: "004", firstName: "Emily", lastName: "Davis" },
    // { id: "005", firstName: "Chris", lastName: "Brown" },
    // { id: "006", firstName: "Pat", lastName: "Miller" },
    // { id: "007", firstName: "Taylor", lastName: "Wilson" },
    // { id: "008", firstName: "Jordan", lastName: "Moore" },
    // { id: "009", firstName: "Morgan", lastName: "Taylor" },
    // { id: "010", firstName: "Casey", lastName: "Anderson" },
  ]);

   // const [formStatus, setFormStatus] = useState("Ready");

   const [candidateIncome, setCandidateIncome] = useState("");
   const [candidateEthnicity, setCandidateEthnicity] = useState("");
   const { setFormStatus } = useFormStatus();
   const controlsRef = useRef(null);
   const reviewRef = useRef(null);
   const router = useRouter();
  //  const loggedInUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  //  const { activeClientId, setActiveClientId } = useClient();
  //  const activeClientId = sessionStorage.getItem('activeClientId');
   const [activeClientId, setActiveClientId] = useState(null);
   const [loggedInUser, setLoggedInUser] = useState(null);


  const [loadingEthnicity, setLoadingEthnicity] = useState(false);
  const [loadingIncome, setLoadingIncome] = useState(false);

  const [editingEthnicity, setEditingEthnicity] = useState({ idx: null, value: "" });
  const debouncedEthnicity = useDebounce(editingEthnicity);

  const [editingIncome, setEditingIncome] = useState({ idx: null, value: "" });
  const debouncedIncome = useDebounce(editingIncome);

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

  // Fetch all candidates on mount
  useEffect(() => {
    if (!activeClientId) return;

    const fetchCandidates = async () => {
      try {
        setLoading(true);
        
        const data = await getAllCandidates(activeClientId);
        const sortedData = Array.isArray(data)
          ? [...data].sort((a, b) => Number(a.id) - Number(b.id))
          : [];
        setDataList(sortedData);

        if (sortedData.length > 0) {
          setSelectedCandidate(sortedData[0]);
          setShowEdit(true);
        }
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
    if (!activeClientId) return;

    const fetchEthnicity = async () => {
      try {
        setLoading(true);
        const data = await getAllEthinicities(activeClientId);
        // keep objects instead of just names
        setEthnicities(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch ethnicities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEthnicity();
  }, [activeClientId]);


  // Fetch all candidates on mount
  useEffect(() => {
    if (!activeClientId) return;

    const fetchIncome = async () => {
      try {
        setLoading(true);
        const data = await getAllIncomes(activeClientId);
        // keep objects instead of just names
        setIncomes(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch ethnicities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncome();
  }, [activeClientId]);


   // Fetch all candidates on mount
   useEffect(() => {
    if (!activeClientId) return;

    const fetchIncomeFromCandidate = async () => {
      try {
        setLoading(true);
        const data = await getAllCandidateIncomes(activeClientId);
        // keep objects instead of just names
        setCandidateIncome(Array.isArray(data) ? data : []);
        console.log("candidate income: -->", data);
      } catch (err) {
        console.error("Failed to fetch ethnicities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncomeFromCandidate();
  }, [activeClientId]);
  

   // Fetch all candidates on mount
   useEffect(() => {
    if (!activeClientId) return;

    const fetchEthnicitiesFromCandidate = async () => {
      try {
        setLoading(true);
        const data = await getAllCandidateEthinicities(activeClientId);
        // keep objects instead of just names
        setCandidateEthnicity(Array.isArray(data) ? data : []);
        console.log("candidate ethnicities", data);
      } catch (err) {
        console.error("Failed to fetch ethnicities:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchEthnicitiesFromCandidate();
  }, [activeClientId]);
  


  // Create candidate
  const handleCreate = async (newCandidate) => {
    try {

      const candidateWithAccount = {
        ...newCandidate,
        accountId: loggedInUser?.id, // ✅ assign accountId
        clientId: activeClientId
      };
      const created = await createCandidate(candidateWithAccount);
      setDataList(prev => [...prev, created]);
      setSelectedCandidate(created);
      setShowAdd(false);
      // setShowEdit(true);
      return created; 
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create candidate";
      toast.error(errorMessage); // ✅ show toast here
      throw new Error(errorMessage); // ✅ re-throw so form does not close
    }
  };


  const getFilteredData = () => {
    const sorted = [...dataList].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "id") {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    // ✅ Filter by search term
    if (!searchTerm.trim()) return sorted;

    return sorted.filter((item) => {
      const term = searchTerm.toLowerCase();
      return (
        item.firstName?.toLowerCase().includes(term) ||
        item.lastName?.toLowerCase().includes(term) ||
        String(item.candidateId || item.id).toLowerCase().includes(term)
      );
    });
  };

   // Handle sorting
   const getSortedData = () => {
    return [...dataList].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "id") {
        valA = Number(valA);
        valB = Number(valB);
      } else {
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedCandidate: null,
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isContextMenuClick =
        contextRef.current && contextRef.current.contains(e.target);
      const isCandidateClick = e.target.closest(".candidate-item");
      const isFormClick = formRef.current && formRef.current.contains(e.target);
      const isCreateFormClick = createFormRef.current && createFormRef.current.contains(e.target);
      const isReviewClick = reviewRef.current && reviewRef.current.contains(e.target);
      const isControlClick = controlsRef.current && controlsRef.current.contains(e.target);

      // Only deselect if click is outside candidate item, context menu, and form
      if (!isContextMenuClick && !isCandidateClick && !isFormClick && !isReviewClick && !isControlClick & !isCreateFormClick) {
        setContextMenu({ visible: false, x: 0, y: 0, selectedCandidate: null });
        setSelectedCandidate(null);
        setShowEdit(false);
        setFormStatus("Ready...");
      }
    };

    if(dataList.length>0){
      setSelectedCandidate(dataList[0]);
      setShowEdit(true);
      setShowAdd(false);
    }else {
      setSelectedCandidate(null);
      setShowEdit(false);
    }

    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [dataList]);

  

  const handleDelete = async (id) => {
    try {
      setFormStatus('Processing...')
      await deleteCandidate(id);
      const updated = dataList.filter(item => item.id !== id);
      setDataList(updated);
      setFormStatus('Candidate Deleted');
      if (selectedCandidate?.id === id) {
        setSelectedCandidate(updated[0] || null);
        setShowEdit(updated.length > 0);
      }
      setContextMenu(prev => ({ ...prev, visible: false }));
    } catch (err) {
      console.error("Failed to delete candidate:", err);
      setError("Failed to delete candidate.");
    }
  };

  

  const handleEthnicityChange = (idx, value) => {
    // Just update UI instantly
    setEthnicities(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], name: value };
      return updated;
    });
  };
  
  const handleEthnicityBlur = async (idx) => {
    const eth = ethnicities[idx];
    const value = eth.name.trim();
  
    try {
      // If empty, delete from both UI and DB
      if (!value) {
        if (eth.id) await deleteEthinicity(eth.id);
        setEthnicities(prev => prev.filter((_, i) => i !== idx));
        toast.error("Empty ethnicity removed");
        return;
      }
  
      // Update existing
      if (eth.id) {
        await updateEthinicity(eth.id, { name: value });
        toast.success("Ethnicity updated");
      } 
      // Create new
      else {
        const created = await createEthinicity({ name: value, clientId: activeClientId });
        setEthnicities(prev => {
          const updated = [...prev];
          updated[idx] = created;
          return updated;
        });
        toast.success("Ethnicity added");
      }
    } catch (err) {
      console.error("Failed to save ethnicity:", err);
      toast.error("Failed to save ethnicity");
    }
  };
  

  // Debounce save
  useEffect(() => {
    const { idx, value } = debouncedEthnicity;
    if (idx === null || !value?.trim()) return;

    const saveEthnicity = async () => {
      const current = ethnicities[idx];
      setLoadingEthnicity(true);

      try {
        if (current?.id) {
          await updateEthinicity(current.id, { name: value });
          toast.success("Ethnicity updated successfully!");
        } else {
          const created = await createEthinicity({
            name: value,
            clientId: activeClientId,
          });
          setEthnicities(prev => {
            const updated = [...prev];
            updated[idx] = created;
            return updated;
          });
          toast.success("Ethnicity added successfully!");
        }
      } catch (err) {
        console.error("Failed to save ethnicity:", err);
        toast.error("Failed to save ethnicity. Please try again.");
      } finally {
        setLoadingEthnicity(false);
      }
    };

    saveEthnicity();
  }, [debouncedEthnicity]);

  
  
  const handleEthnicityDelete = async (idx) => {
    const eth = ethnicities[idx];
  
    try {
      // Only delete from backend if it has an ID
      if (eth.id) {
        await deleteEthinicity(eth.id);
      }
  
      // Remove from state
      setEthnicities(ethnicities.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("Failed to delete ethnicity:", err);
    }
  };

  const handleAddEthnicity = () => {
    setEthnicities([...ethnicities, { name: "" }]); // no id yet
  };


  const handleIncomeChange = (idx, value) => {
    setIncomes(prev => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], name: value };
      return updated;
    });
  };
  
  const handleIncomeBlur = async (idx) => {
    const inc = incomes[idx];
    const value = inc.name.trim();
  
    try {
      if (!value) {
        if (inc.id) await deleteIncome(inc.id);
        setIncomes(prev => prev.filter((_, i) => i !== idx));
        toast.error("Empty income removed");
        return;
      }
  
      if (inc.id) {
        await updateIncome(inc.id, { name: value });
        toast.success("Income updated");
      } else {
        const created = await createIncome({ name: value, clientId: activeClientId });
        setIncomes(prev => {
          const updated = [...prev];
          updated[idx] = created;
          return updated;
        });
        toast.success("Income added");
      }
    } catch (err) {
      console.error("Failed to save income:", err);
      toast.error("Failed to save income");
    }
  };
  
  
  useEffect(() => {
    const { idx, value } = debouncedIncome;
    if (idx === null || !value?.trim()) return;
  
    const saveIncome = async () => {
      const current = incomes[idx];
      setLoadingIncome(true);
      try {
        if (current?.id) {
          await updateIncome(current.id, { name: value });
          // toast.success("Income updated successfully!");
        } else {
          const created = await createIncome({
            name: value,
            clientId: activeClientId,
          });
          setIncomes(prev => {
            const updated = [...prev];
            updated[idx] = created;
            return updated;
          });
          // toast.success("Income added successfully!");
        }
      } catch (err) {
        console.error("Failed to save income:", err);
        toast.error("Failed to save income. Please try again.");
      } finally {
        setLoadingIncome(false);
      }
    };
  
    saveIncome();
  }, [debouncedIncome]);
  

  
  const handleIncomeDelete = async (idx) => {
    const income = incomes[idx];
  
    try {
      // Only delete from backend if it has an ID
      if (income.id) {
        await deleteIncome(income.id);
      }
  
      // Remove from state
      setIncomes(incomes.filter((_, i) => i !== idx));
    } catch (err) {
      console.error("Failed to delete income:", err);
    }
  };
  
  const handleAddIncome = () => {
    setIncomes([...incomes, { name: "" }]); // no id yet
  };

  console.log("selected Candiate", selectedCandidate);


// ✅ Check if an ethnicity is used by any candidate
const isEthnicityUsed = (eth) => {
  if (!eth?.name || !Array.isArray(candidateEthnicity)) return false;
  return candidateEthnicity.some(
    (usedEth) =>
      usedEth?.trim().toLowerCase() === eth.name.trim().toLowerCase()
  );
};


const isIncomeUsed = (inc) => {
  if (!inc?.name || !Array.isArray(candidateIncome)) return false;
  return candidateIncome.some(
    (usedInc) =>
      usedInc?.trim().toLowerCase() === inc.name.trim().toLowerCase()
  );
};



  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-1/2 lg:w-3/12 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="flex flex-col border-1 border-gray-200  overflow-hidden h-1/2">
          {/* Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-1.5">
            {/* Control buttons */}
            <div className="flex flex-col mb-3">
              <div className="flex justify-end gap-1">
                <button ref={controlsRef}
                  className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium text-white bg-gray-200 hover:bg-gray-400 transition-colors"
                  onClick={() => {
                    setSelectedCandidate(null);
                    setShowAdd(true);
                    setShowEdit(false);
                    setFormStatus("Creating...");
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                </button>

                {selectedCandidate && (
                  <div className="flex gap-1 candidate-item">
                    <button
                      className="p-1.5 text-gray-600 bg-gray-200 hover:bg-gray-400 hover:text-white transition-colors"
                      onClick={() => handleDelete(selectedCandidate.id)}
                    >
                      <Trash className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
            {/* Column Headers */}
            <div className="grid grid-cols-3 gap-1 text-xs font-semibold text-black tracking-wide">
              {[
                { key: "lastName", label: "Last Name" },
                { key: "firstName", label: "First Name" },
                { key: "id", label: "Candidate ID" },
              ].map((col) => (
                <div
                  key={col.key}
                  className="flex items-center cursor-pointer select-none"
                  onClick={() => {
                    if (sortBy === col.key) {
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                    } else {
                      setSortBy(col.key);
                      setSortOrder("asc");
                    }
                  }}
                >
                  {col.label}
                </div>
              ))}
            </div>
          </div>

          {/* List Toggle */}
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
                Candidates ({dataList.length})
              </p>
            </div>

            {showList &&
              getFilteredData().map((item, index) => {
                const isSelected = selectedCandidate?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`candidate-item grid grid-cols-3 gap-2 items-center cursor-pointer px-4 py-2 border-b border-gray-50 transition-all ${
                      isSelected
                        ? "bg-blue-100 border-l-4 border-l-blue-400 text-black"
                        : "hover:bg-gray-50"
                    }`}
                    onClick={() => {
                      setSelectedCandidate(item);
                      setShowEdit(true);
                      setShowAdd(false);
                      setShowReview(false);
                      // setFormStatus("Editing...");
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedCandidate(item);
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
                      {item.candidateId}
                    </p>
                  </div>
                );
              })}

            {/* Objects Section */}
            <div className="border-t border-gray-200">
              <div
                className="flex items-center cursor-pointer select-none text-sm font-medium text-gray-900 px-4 py-2 hover:text-gray-700 transition-colors"
                onClick={() => setShowObjects((prev) => !prev)}
              >
                {showObjects ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
                )}
                Objects
              </div>

              {showObjects && (
                <div className="px-4 py-2 space-y-4">
                  {/* Ethnicity Inputs */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Ethnicities (Max 10):
                    </label>
                    <div className="space-y-1">
                      {ethnicities.map((eth, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={25}
                            value={eth.name || ""}
                            disabled={isEthnicityUsed(eth)} 
                            onChange={(e) => handleEthnicityChange(idx, e.target.value)}
                            onBlur={() => handleEthnicityBlur(idx)}
                            className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                            placeholder={`Ethnicity ${idx + 1}`}
                          />
                          <button
  type="button"
  onClick={() => handleEthnicityDelete(idx)}
  disabled={isEthnicityUsed(eth)}  // ✅ disable if used
  className={`px-2 py-1 text-xs rounded ${
    isEthnicityUsed(eth)
      ? "text-gray-400 cursor-not-allowed"
      : "text-red-500"
  }`}
>
  <Trash2 className="w-4 h-4" />
</button>

                        </div>
                      ))}
                      {ethnicities.length < 10 && (
                        <button
                          type="button"
                          onClick={handleAddEthnicity}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm text-gray-800"
                        >
                          + Add Ethnicity
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Income Inputs */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700">
                      Incomes Ranges (Max 10):
                    </label>
                    <div className="space-y-1">
                      {incomes.map((income, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input
                            type="text"
                            maxLength={25}
                            value={income.name || ""}
                            disabled={isIncomeUsed(income)} 
                            onChange={(e) => handleIncomeChange(idx, e.target.value)}
                            onBlur={() => handleIncomeBlur(idx)}
                            className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                            placeholder={`Income Ranges ${idx + 1}`}
                          />
                          <button
                            type="button"
                            onClick={() => handleIncomeDelete(idx)}
                            disabled={isIncomeUsed(income)} // ✅ disable if in use
                            className={`px-2 py-1 text-xs rounded ${
                              isIncomeUsed(income)
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-red-500 "
                            }`} 
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {incomes.length < 10 && (
                        <button
                          type="button"
                          onClick={handleAddIncome}
                          className="px-2 py-1 bg-gray-200 hover:bg-gray-300 text-sm text-gray-800"
                        >
                          + Add Income
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            ref={contextRef}
            className="absolute bg-gray-200 border border-gray-300 shadow-md z-50 w-56"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="flex justify-between items-center px-4 py-2 text-sm text-gray-800 hover:bg-gray-300 w-full text-left border-t border-gray-200"
              onClick={(e) => {
                e.stopPropagation();
                setContextMenu((prev) => ({ ...prev, visible: false }));
                setSelectedCandidate(contextMenu.selectedCandidate);
                setShowReview(true);
                setShowEdit(false);
                setShowAdd(false);
              }}
            >
              <span className="flex items-center gap-2">
                <View className="w-4 h-4" /> Review
              </span>
              <span className="text-gray-400 text-xs ml-4">Ctrl + R</span>
            </button>

            <button
              className="flex justify-between items-center px-4 py-2 text-sm text-gray-800 hover:bg-red-200 w-full text-left border-t border-gray-200"
              onClick={() => {
                handleDelete(contextMenu.selectedCandidate.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </span>
              <span className="text-gray-400 text-xs ml-4">Del</span>
            </button>
          </div>
        )}

        {/* Candidate editor Section */}
        <div className="h-1/2 overflow-auto my-0.5" ref={formRef}>
        <CandidateEditor
          candidate={selectedCandidate}
          ethnicities={ethnicities}   
          incomes={incomes}  
          showForm={showEdit}
          onSave={(updatedCandidate) => {
            setDataList((prev) =>
              prev.map((c) =>
                c.id === updatedCandidate.id ? updatedCandidate : c
              )
            );
            setSelectedCandidate(updatedCandidate);
            setFormStatus("Candidate Updated");

              // Optional: revert back to Ready after 2s
              
          }}
        />

        </div>
      </div>

      {/* Right Panel - Create Candidate */}
      <div className="w-1/2 lg:w-9/12 bg-white">
        
          {showAdd && (
            <div className="h-full flex flex-col w-96" ref={createFormRef}>
              <CreateCandidateForm onClose={() => setShowAdd(false)} onCreate={handleCreate} ethnicities={ethnicities}
    incomes={incomes} />
            </div>
          )}

          {showReview && (
            <div className="h-full overflow-auto" ref={reviewRef}>
              <ReviewCandidate candidate={selectedCandidate} />
            </div>
          )}

       
      </div>

   
    </div>
  );
}
