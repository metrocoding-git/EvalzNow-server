"use client";

import {
  ChevronRight,
  Plus,
  X,
  Edit3,
  Trash2,
  Trash,
  ChevronDown,
  Search,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import StaffEditor from "./components/StaffEditor";
import CreateStaffForm from "./components/CreateStaffForm";
import { createStaff, deleteStaff, getAllStaffs } from "@/services/staffService";
import { useFormStatus } from "@/context/FormStatusContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useClient } from "@/context/ClientContext";
import { createAccount } from "@/services/accountService";

export default function StaffControl() {
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showList, setShowList] = useState(true);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("id");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const formRef = useRef(null);
  const createFormRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedStaff: null,
  });

  const [loggedInUser, setLoggedInUser] = useState(null);
  // const loggedInUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  // const [dataList, setDataList] = useState([
  //   { id: "001", firstName: "John", lastName: "Doe" },
  //   { id: "002", firstName: "Jane", lastName: "Smith" },
  //   { id: "003", firstName: "Michael", lastName: "Brown" },
  //   { id: "004", firstName: "Emily", lastName: "Clark" },
  //   { id: "005", firstName: "David", lastName: "Lee" },
  //   { id: "006", firstName: "Sarah", lastName: "Wilson" },
  //   { id: "007", firstName: "Daniel", lastName: "Johnson" },
  //   { id: "008", firstName: "Laura", lastName: "Martinez" },
  //   { id: "009", firstName: "Chris", lastName: "Davis" },
  //   { id: "010", firstName: "Anna", lastName: "White" },
  // ]);
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {formStatus, setFormStatus} = useFormStatus();
  // const activeClientId = sessionStorage.getItem('activeClientId');
  // const user = localStorage.getItem('user');
  const [user, setUser] = useState(null);
  const controlsRef = useRef(null);
  const [activeClientId, setActiveClientId] = useState(null);


  console.log("active Client Id on staff:", activeClientId);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
  
    if (!token || !user) {
      router.replace("/login");
    }

    setLoggedInUser(JSON.parse(user));
    setUser(user);
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedClientId = sessionStorage.getItem("activeClientId");
      setActiveClientId(storedClientId);
    }
  }, []);

  // Fetch staff data
  useEffect(() => {
    if (!activeClientId) return;

    const fetchStaffs = async () => {
      try {
        
        setLoading(true);
        const data = await getAllStaffs(activeClientId);
         // Sort ascending by staffId or id
        const sortedData = (Array.isArray(data) ? data : []).sort(
          (a, b) => Number(a.id) - Number(b.id)
        );

        setDataList(sortedData);

        // Select first staff by default
        if (sortedData.length > 0) {
          setSelectedStaff(sortedData[0]);
          setShowEdit(true);
          setShowAdd(false);
        }
      } catch (err) {
        console.error("Failed to fetch staffs:", err);
        setError("Failed to load staffs. Please try again.");
        setDataList([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();
  }, [activeClientId]);

  // Create new staff
  const handleCreate = async (newStaff) => {
    try {

      const staffIdExists = dataList.some(
        (staff) => staff.staffId === newStaff.staffId
      );

      const staffEmailExists = dataList.some(
        (staff) => staff.emailAddress === newStaff.emailAddress
      );
  
      if (staffIdExists) {
        toast.error(`Staff ID "${newStaff.staffId}" already exists`);
        return false;
      }

      if (staffEmailExists) {
        toast.error(`Staff Email "${newStaff.emailAddress}" already exists`);
        return false;
      }

      const accountPayload = {
        username: newStaff.emailAddress,
        password: "12345678", // default password
        acc_id: loggedInUser?.acc,
        role: "staff",
      };
      const createdAccount = await createAccount(accountPayload);
  
      const staffWithAccount = {
        ...newStaff,
        accountId: loggedInUser?.id, // ✅ assign accountId
        clientId: activeClientId, 
      };
      const createdStaff = await createStaff(staffWithAccount);
      setDataList((prev) => [...prev, createdStaff]);
      setSelectedStaff(createdStaff);
      setShowAdd(false);
      setFormStatus("Staff Created");
      return createStaff;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to create staff";
      toast.error(errorMessage); // ✅ show toast here
      return null;
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
        String(item.staffId || item.id).toLowerCase().includes(term)
      );
    });
  };

  const getSortedDataList = () => {
    const sorted = [...dataList].sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];

      if (sortBy === "id") {
        // Convert to numbers for numeric sorting
        valA = Number(valA);
        valB = Number(valB);
      } else {
        // For names: lowercase strings
        valA = (valA || "").toLowerCase();
        valB = (valB || "").toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const contextRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isContextMenuClick =
      contextRef.current && contextRef.current.contains(e.target);
      const isStaffClick = e.target.closest(".staff-item");
      const isFormClick = formRef.current && formRef.current.contains(e.target);
      const isCreateFormClick = createFormRef.current && createFormRef.current.contains(e.target);
      const isControlClick = controlsRef.current && controlsRef.current.contains(e.target);

      // Only deselect if click is outside staff item, context menu, and form
      if (!isContextMenuClick && !isStaffClick && !isFormClick && !isControlClick & !isCreateFormClick) {
        setContextMenu({ visible: false, x: 0, y: 0, selectedStaff: null });
        setSelectedStaff(null);
        setShowEdit(false);
        setFormStatus("Ready...");
      }
    };

    if (dataList.length > 0) {
      setSelectedStaff(dataList[0]);
      setShowEdit(true);
      setShowAdd(false);
    } else {
      setSelectedStaff(null);
      setShowEdit(false);
    }
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [dataList]);

  const handleDelete = async (id) => {
    try {
      setFormStatus('Processing...')
      await deleteStaff(id); // API call to delete from backend
      
      setDataList((prev) => prev.filter((staff) => staff.id !== id)); // Remove from state
      setFormStatus('Staff Deleted');
      if (selectedStaff?.id === id) {
        setSelectedStaff(null);
        setShowEdit(false);
      }
  
      // console.log("Staff deleted successfully");
    } catch (err) {
      console.error("Failed to delete staff:", err);
      setError("Failed to delete staff. Please try again.");
    }
  };
  
  // console.log("staffs: ", dataList);

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-1/2 lg:w-3/12 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="flex flex-col border-1 border-gray-200  overflow-hidden h-1/2">
          {/* Header */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-1.5">
            {/* Control buttons */}
            <div className="flex flex-col mb-3">
              <div className="flex justify-end gap-1" >
                <button ref={controlsRef}
                  className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium text-white bg-gray-200 hover:bg-gray-400 transition-colors"
                  onClick={() => {
                    setSelectedStaff(null);
                    setShowAdd(true);
                    setShowEdit(false);
                    setFormStatus("Creating...");
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-black" />
                </button>

                {selectedStaff && loggedInUser?.role !== "staff" && (
                  <div className="flex gap-1 staff-item">
                    <button
                      className={`p-1.5 text-gray-600 bg-gray-200 transition-colors ${
                        selectedStaff.accessLevel === "Full Access" && user.role === "staff"
                          ? "opacity-50 cursor-not-allowed"
                          : "hover:bg-gray-400 hover:text-white"
                      }`}
                      onClick={() => handleDelete(selectedStaff.id)}
                      disabled= {selectedStaff.accessLevel === "Full Access" && user.role === "staff"}
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
                { key: "id", label: "Staff ID" },
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
                Staff ({dataList.length})
              </p>
            </div>

            {showList &&
              getFilteredData().map((item, index) => {
                const isSelected = selectedStaff?.id === item.id;
                return (
                  <div
                    key={item.id}
                    className={`staff-item grid grid-cols-3 gap-2 items-center cursor-pointer px-4 py-2 border-b border-gray-50 transition-all ${isSelected
                      ? "bg-blue-100 border-l-4 border-l-blue-400 text-black"
                      : "hover:bg-gray-50"
                      }`}
                    onClick={() => {
                      setSelectedStaff(item);
                      setShowEdit(true);
                      setShowAdd(false);
                      // setFormStatus("Editing...");
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedStaff(item);
                      setContextMenu({
                        visible: true,
                        x: e.pageX,
                        y: e.pageY,
                        selectedStaff: item,
                      });
                    }}
                  >
                    <p
                      className={`text-sm font-medium truncate ${isSelected ? "text-black" : "text-gray-800"
                        }`}
                    >
                      {item.lastName}
                    </p>
                    <p
                      className={`text-sm font-medium truncate ${isSelected ? "text-black" : "text-gray-800"
                        }`}
                    >
                      {item.firstName}
                    </p>
                    <p
                      className={`text-sm font-medium truncate ${isSelected ? "text-black" : "text-gray-800"
                        }`}
                    >
                      {item.staffId}
                    </p>
                  </div>
                );
              })}


          </div>
        </div>

        {/* Context Menu */}
        {contextMenu.visible && (
          <div
            className="absolute bg-gray-200 border border-gray-300 shadow-md z-50 w-56"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            <button
              className="flex justify-between items-center px-4 py-2 text-sm text-gray-800 hover:bg-red-200 w-full text-left border-t border-gray-200"
              onClick={() => {
                handleDelete(contextMenu.selectedStaff.id);
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

        {/* Staff editor Section */}

        <div className="h-1/2 overflow-auto my-0.5" ref={formRef}>
        <StaffEditor
          staff={selectedStaff}
          showForm={showEdit}
          onClose={() => setShowEdit(false)}
          onSave={(updatedStaff) => {
            setDataList((prev) =>
              prev.map((item) =>
                item.id === updatedStaff.id ? updatedStaff : item
              )
            );
            setSelectedStaff(updatedStaff);
            setFormStatus("Staff Updated");

          }}
        />
        </div>
      </div>

      {/* Right Panel - Create Staff */}
      <div className="w-1/2 lg:w-9/12 bg-white">
        <div className="h-full flex flex-col w-96" ref={createFormRef}>
          {showAdd && (
            <CreateStaffForm onClose={() => setShowAdd(false)} onCreate={handleCreate} />
          )}
        </div>
      </div>
    </div>
  );
}
