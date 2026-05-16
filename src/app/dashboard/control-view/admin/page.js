"use client";

import {
  Trash,
  Plus,
  ChevronRight,
  ChevronDown,
  Search,
  Trash2,
  Check,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import ClientEditor from "./components/ClientEditor";
import CreateClientForm from "./components/CreateClientForm";
import { createClient, deleteClient, getAllClients } from "@/services/clientService";
import { useFormStatus } from "@/context/FormStatusContext";
import toast, { Toaster } from "react-hot-toast";
import { Controls } from "three";
import { useRouter } from "next/navigation";
import { useClient } from "@/context/ClientContext";
import { createAccount } from "@/services/accountService";

export default function AdminControl() {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showList, setShowList] = useState(true);
  const editorFormRef = useRef(null);
  const createFormRef = useRef(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [sortBy, setSortBy] = useState("id");
  const [showObjects, setShowObjects] = useState(false);
  const [dataList, setDataList] = useState([
    // {
    //   id: "5678",
    //   firstName: "Sadeesha",
    //   lastName: "Perera",
    // },
    // {
    //   id: "5679",
    //   firstName: "Nadeesha",
    //   lastName: "Silva",
    // },
    // {
    //   id: "5680",
    //   firstName: "Kasun",
    //   lastName: "Fernando",
    // },
    // {
    //   id: "5681",
    //   firstName: "Dilani",
    //   lastName: "Gunasekara",
    // },
    // {
    //   id: "5682",
    //   firstName: "Tharindu",
    //   lastName: "Jayasinghe",
    // },
  ]);
  const [clients, setClients] = useState([]); // Renamed from dataList to clients
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const controlsRef = useRef(null);
  const router = useRouter();

  const loggedInUser = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("user")) : null;
  const isSuperAdmin = loggedInUser?.role === "super admin";


  const { setFormStatus } = useFormStatus();
  // const { activeClientId, setActiveClientId } = useClient();

  const ACTIVE_CLIENT_KEY = "activeClientId";
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
  
    if (!token || !user) {
      router.replace("/login");
    }
  }, [router]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const data = await getAllClients();
        const clientsArray = Array.isArray(data) ? data : [];
        setDataList(clientsArray);
        setClients(clientsArray);
  
        if (clientsArray.length === 0) return;
  
        // ✅ Keep the active client stored in sessionStorage
        const storedId = sessionStorage.getItem(ACTIVE_CLIENT_KEY);
  
        // ✅ Do NOT overwrite the active client
        // We just need to ensure one is stored
        if (!storedId) {
          sessionStorage.setItem(ACTIVE_CLIENT_KEY, String(clientsArray[0].id));
        }
  
        // ✅ Always select the first client for editing (independent of active)
        const firstClient = clientsArray[0];
        setSelectedClient(firstClient);
        setShowEdit(true);
        setShowAdd(false);
  
      } catch (err) {
        console.error("Failed to fetch clients:", err);
        setError("Failed to load clients. Please try again.");
        setClients([]);
      } finally {
        setLoading(false);
      }
    };
  
    fetchClients();
  }, []);
  
  
  const handleCreate = async (newClient) => {
    try {

      const accountPayload = {
        username: newClient.emailAddress,
        password: "12345678", // default password
        acc_id: loggedInUser?.acc,
        role: "admin",
      };
      const createdAccount = await createAccount(accountPayload);

      console.log("client created: ->", createdAccount);

      const clientWithAccount = {
        ...newClient,
        accountId: loggedInUser?.id, // ✅ assign accountId
      };
      
      const createdClient = await createClient(clientWithAccount);
      setClients(prev => [...prev, createdClient]);
      setDataList(prev => [...prev, createdClient]);
      // console.log(dataList);
      setSelectedClient(createdClient);
      setShowAdd(false);
      return createdClient;
    } catch (err) {
      console.error("Failed to create client:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to create client";
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
        String(item.executiveId || item.id).toLowerCase().includes(term)
      );
    });
  };
  
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    selectedClient: null,
  });

  // Sort the dataList based on sortBy and sortOrder
  const getSortedDataList = () => {
    return [...dataList].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      
      // Handle cases where values might be undefined/null
      if (valA == null) return sortOrder === "asc" ? 1 : -1;
      if (valB == null) return sortOrder === "asc" ? -1 : 1;
      
      // If both values are numbers, compare numerically
      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortOrder === "asc" ? valA - valB : valB - valA;
      }
      
      // Otherwise, compare as strings
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      
      if (strA < strB) return sortOrder === "asc" ? -1 : 1;
      if (strA > strB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // useEffect(() => {
  //   // Select first client by default
  //   if (dataList.length > 0) {
  //     setSelectedClient(dataList[0]);
  //     setActiveClientId(dataList[0].id);
  //   } else {
  //     setSelectedClient(null);
  //     setActiveClientId(null);
  //   }
  // }, [dataList]);

  // const handleDelete = (id) => {
  //   const updatedData = dataList.filter((item) => item.id !== id);
  //   setDataList(updatedData);
  //   if (selectedClient?.id === id) {
  //     setSelectedClient(updatedData[0] || null);
  //   }
  // };

  const handleUpdateClient = (updatedClient) => {
    setDataList((prev) =>
      prev.map((c) => (c.id === updatedClient.id ? updatedClient : c))
    );
    setSelectedClient(updatedClient);
  };


  const handleDelete = async (id) => {
    // if (!window.confirm("Are you sure you want to delete this client?")) {
    //   return;
    // }

    try {
      setFormStatus('Processing...')
      // Call the delete service
      await deleteClient(id);
      
      // Update local state
      const updatedData = dataList.filter((item) => item.id !== id);
      setFormStatus('Client Deleted');
      setDataList(updatedData);
      
      // Update selected client if needed
      if (selectedClient?.id === id) {
        setSelectedClient(updatedData[0] || null);
      }
      
      // Show success message or notification
      console.log("Client deleted successfully");
    } catch (err) {
      console.error("Failed to delete client:", err);
      setError("Failed to delete client. Please try again.");
    }
  };

  const contextRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      const isContextMenuClick =
        contextRef.current && contextRef.current.contains(e.target);
      const isClientClick = e.target.closest(".staff-item");
      const isEditorFormClick = editorFormRef.current && editorFormRef.current.contains(e.target);
      const isCreateFormClick = createFormRef.current && createFormRef.current.contains(e.target);
      const isControlClick = controlsRef.current && controlsRef.current.contains(e.target);


      // Only deselect if click is outside staff item, context menu, and form
      if (!isContextMenuClick && !isClientClick && !isEditorFormClick && !isControlClick & !isCreateFormClick) {
        setContextMenu({ visible: false, x: 0, y: 0, selectedClient: null });
        setSelectedClient(null);
        setShowEdit(false);
        setFormStatus("Ready...");
      }
    };

    
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [ setFormStatus]);
  


  return (
    <div className="flex h-full overflow-hidden">
      
      <div className="w-1/2 lg:w-3/12 bg-white shadow-sm border-r border-gray-200 flex flex-col">
        <div className="h-1/2 flex flex-col border-1 border-gray-200 overflow-hidden">
          {/* Header with controls */}
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-1.5">
            {/* Control buttons */}
            <div className="flex flex-col mb-3">
                <div className="flex justify-end gap-1" >
                {isSuperAdmin && (
                    <button
                      ref={controlsRef}
                      className="inline-flex items-center px-1.5 py-1.5 text-xs font-medium text-white bg-gray-200 hover:bg-gray-400 transition-colors"
                      onClick={() => {
                        setSelectedClient(null);
                        setShowAdd(true);
                        setShowEdit(false);
                        setFormStatus("Creating...");
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 text-black" />
                    </button>
                  )}

                  {selectedClient && (
                    <div className="flex gap-1 client-item">
                      <button
                        className="p-1.5 text-gray-600 bg-gray-200 hover:bg-gray-400 hover:text-white transition-colors"
                        onClick={() => {
                          handleDelete(selectedClient.id)
                        }}
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
            </div>

          {/* Column headers */}
          <div className="grid grid-cols-3 gap-1 text-xs font-semibold text-black tracking-wide px-4 py-2">
            {[
              { key: "lastName", label: "Last Name" },
              { key: "firstName", label: "First Name" },
              { key: "id", label: "Executive ID" },
            ].map((col) => (
              <div
                key={col.key}
                className="flex items-center cursor-pointer hover:text-black transition-colors"
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

          {/* Client list */}
          <div className="flex-[1.1] min-h-0 overflow-auto">
            {/* List toggle */}
            <div
              className="flex items-center px-4 py-2 cursor-pointer select-none hover:text-gray-700 transition-colors"
              onClick={() => setShowList((prev) => !prev)}
            >
              {showList ? (
                <ChevronDown className="w-4 h-4 text-gray-700 mr-2" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
              )}
              <span className="text-sm font-medium text-gray-900">
                Clients ({dataList.length})
              </span>
            </div>

            {/* Client items */}
            {showList && (
              <div className="flex-1">
                {getFilteredData().map((item) => {
                  const isSelected = selectedClient?.id === item.id;
                  const activeClientId = sessionStorage.getItem(ACTIVE_CLIENT_KEY);
                  const isActive = String(activeClientId) === String(item.id);

                  return (
                    <div
                      key={item.id}
                      className={`client-item grid grid-cols-3 gap-2 items-center cursor-pointer px-4 py-2 border-b border-gray-50 transition-all
                        ${isActive ? "font-bold" : ""}
                        ${isSelected ? "bg-blue-100 border-l-4 border-l-blue-400" : "hover:bg-gray-50"}
                      `}
                      //  LEFT CLICK = select only
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClient(item);
                        setShowEdit(true);
                        setShowAdd(false);
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        sessionStorage.setItem(ACTIVE_CLIENT_KEY, String(item.id));
                        setSelectedClient((prev) => ({ ...prev }));
                        // setFormStatus(`Active Client: ${item.firstName} ${item.lastName}`);
                      }}
                      //  RIGHT CLICK = make active + context menu
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      
                        // ✅ Open context menu
                        setContextMenu({
                          visible: true,
                          x: e.pageX,
                          y: e.pageY,
                          selectedClient: item,
                        });
                      }}
                      
                    >
                      <p
                        className={`text-sm truncate ${
                          isActive ? "font-bold text-black" : "text-gray-800"
                        }`}
                      >
                        {item.lastName}
                      </p>
                      <p
                        className={`text-sm truncate ${
                          isActive ? "font-bold text-black" : "text-gray-800"
                        }`}
                      >
                        {item.firstName}
                      </p>
                      <p
                        className={`text-sm truncate ${
                          isActive ? "font-bold text-black" : "text-gray-800"
                        }`}
                      >
                        {item.executiveId}
                      </p>
                    </div>
                  );
                })}

              </div>
            )}

            <div className=" border-gray-200">
              <div
                className="flex items-center cursor-pointer select-none text-sm font-medium text-gray-900 px-4 py-2 hover:text-gray-700 transition-colors"
                onClick={() => setShowObjects((prev) => !prev)}
              >
                {showObjects ? (
                  <ChevronDown className="w-4 h-4 text-gray-500 mr-2" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500 mr-2" />
                )}
                SaaS Service Usage Report
              </div>
            </div>
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
                handleDelete(contextMenu.selectedClient.id);
                setContextMenu((prev) => ({ ...prev, visible: false }));
              }}
              
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </span>
              <span className="text-gray-400 text-xs ml-4">Del</span>
            </button>
            <button
              className="flex justify-between items-center px-4 py-2 text-sm text-gray-800 hover:bg-gray-300 w-full text-left border-b border-gray-200"
              onClick={() => {
                if (contextMenu.selectedClient) {
                  // ✅ Set selected client as active
                  sessionStorage.setItem(
                    ACTIVE_CLIENT_KEY,
                    String(contextMenu.selectedClient.id)
                  );

                  // ✅ Force UI update
                  setSelectedClient((prev) => ({ ...prev }));
                  setFormStatus(`Active Client: ${contextMenu.selectedClient.firstName} ${contextMenu.selectedClient.lastName}`);
                }
                setContextMenu({ ...contextMenu, visible: false });
              }}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4" /> Set Active Client
              </span>
              
            </button>
          </div>
        )}

        {/* Client editor */}
        <div className="h-1/2 overflow-auto my-0.5" ref={editorFormRef}>
          <ClientEditor
            client={selectedClient}
            showForm={!!selectedClient && showEdit} // show only if a client is selected
            onClose={() => {
              setSelectedClient(null);  // deselect client
              setShowEdit(false);
              setFormStatus("Ready...");
            }}
            setFormStatus={setFormStatus}
            onSave={(updatedClient) => {
              setDataList((prev) =>
                prev.map((item) =>
                  item.id === updatedClient.id ? updatedClient : item
                )
              );
              setSelectedClient(updatedClient);
              setFormStatus("Client Updated");

              // Optional: revert back to Ready after 2s
              // setTimeout(() => setFormStatus("Ready..."), 2000);
            }}
          />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-1/2 lg:w-9/12 bg-white">
        <div className="h-full flex flex-col w-96" ref={createFormRef} >
          {showAdd && <CreateClientForm onClose={() => setShowAdd(false)} onCreate={handleCreate} />}
        </div>
      </div>

      
    </div>
  );
}
