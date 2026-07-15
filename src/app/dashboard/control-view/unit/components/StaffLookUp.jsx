import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { getAllStaffs } from "@/services/staffService";

export default function StaffLookup({ onClose, onSelect, selectedIds: initialSelectedIds = [], lookupFor }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState(initialSelectedIds);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [staffs, setStaffs] = useState([]);

  // Sync selectedIds whenever initialSelectedIds changes (important for changing lookup type)
  useEffect(() => {
    setSelectedIds(initialSelectedIds || []);
  }, [initialSelectedIds]);

  useEffect(() => {
    const fetchStaffs = async () => {
      try {
        setLoading(true);
        const activeClientId = sessionStorage.getItem("activeClientId");
        const data = await getAllStaffs(activeClientId); // fetch all staff for the client
        setStaffs(data);
      } catch (err) {
        console.error("Failed to fetch staff:", err);
        setError("Failed to load staff. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchStaffs();
  }, []);

  const filteredStaffs = staffs
    .filter((staff) => staff.accountStatus === "Enabled" && staff.accessLevel === "Leaders Access")
    .filter((staff) =>
      `${staff.firstName} ${staff.lastName} ${staff.jobTitle} ${staff.emailAddress} ${staff.department}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
    );

  const handleRowClick = (id) => {
    if (lookupFor === "director") {
      // Only one director can be selected
      setSelectedIds([id]);
    } else {
      if (selectedIds.includes(id)) {
        setSelectedIds(selectedIds.filter((sid) => sid !== id));
      } else {
        if (selectedIds.length >= 3) return; // Max 3 selections for leaders/assessors
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const handleSubmit = () => {
    const selectedStaff = staffs.filter((staff) => selectedIds.includes(staff.id));
    console.log("staff look up dta::", selectedStaff)
    onSelect(selectedStaff);
    onClose();
  };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="fixed inset-0 bg-black/0 backdrop-blur-xs flex justify-center items-center z-50"
    >
      <div className="bg-white p-4 w-[600px] border shadow-2xl border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Staff Lookup</h2>
          <button onClick={onClose} className="cursor-pointer">
            <X className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Search Staff..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border p-2 w-full mb-3 text-sm"
        />

        <table className="w-full border text-xs">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-1">Action</th>
              <th className="border p-1">Last Name</th>
              <th className="border p-1">First Name</th>
              <th className="border p-1">Job Title</th>
              <th className="border p-1">Department</th>
              <th className="border p-1">Company E-mail Address</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((c) => (
              <tr
                key={c.id}
                onClick={() => handleRowClick(c.id)}
                className={`cursor-pointer ${selectedIds.includes(c.id) ? "bg-gray-200" : "hover:bg-gray-100"}`}
              >
                <td className="border p-1 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(c.id)}
                    onChange={() => handleRowClick(c.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 text-sm text-center accent-black font-medium text-gray-900 rounded focus:ring-blue-500"
                  />
                </td>
                <td className="border p-1">{c.lastName}</td>
                <td className="border p-1">{c.firstName}</td>
                <td className="border p-1">{c.jobTitle}</td>
                <td className="border p-1">{c.department}</td>
                <td className="border p-1">{c.emailAddress}</td>
              </tr>
            ))}
            {filteredStaffs.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-2 text-gray-500">
                  No matching Staff found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">{selectedIds.length} / {lookupFor === "director" ? 1 : 3} selected</span>
          <button
            onClick={handleSubmit}
            disabled={selectedIds.length === 0}
            className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-1 rounded"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
