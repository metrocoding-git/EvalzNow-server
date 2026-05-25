"use client";
import { useFormStatus } from "@/context/FormStatusContext";
import { createStaff } from "@/services/staffService";
import { ListFilterPlus, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const accessLevels = [
  "Full Access",
  "Leaders Access",
];

const accountStatuses = ["Enabled", "Disabled"];

export default function CreateStaffForm({ onClose, onCreate }) {
  const [form, setForm] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const { formStatus, setFormStatus } = useFormStatus();

    // // Set status when the form opens
    // useEffect(() => {
    //   setFormStatus("Creating...");
    //   return () => setFormStatus("Ready..."); // Reset when form unmounts
    // }, [setFormStatus]);

  const todayStr = new Date().toISOString().split("T")[0];

  const handleChange = (label, value) => {
    setForm((prev) => ({ ...prev, [label]: value }));
  };

  // Check if all required fields are filled
  const isFormValid = () => {
    const requiredFields = [
      "Last Name",
      "First Name",
      "Job Title",
      "Department",
      "Date of Birth",
      "Date of Employment",
      "Staff ID",
      "Contact Number",
      "Company E-mail Address",
      "Access Level",
      "Account Status"
    ];
    return requiredFields.every((field) => form[field] && form[field].toString().trim() !== "");
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    const dobValue = form["Date of Birth"];
    if (dobValue) {
      const dobDate = new Date(dobValue);
      const today = new Date();
      // Compare dates ignoring time
      dobDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      if (dobDate > today) {
        toast.error("Date of birth is wrong.");
        setFormStatus("Creating...");
        return; // stop submission
      }
    }

    if (!isFormValid()) {
      toast.error("Please check your validity.");
      setFormStatus("Creating...");
      return; // stop submission
    }

    setIsSubmitting(true);
    setError(null);
    setFormStatus("Processing...");

    try {
      const staffData = {
        lastName: form["Last Name"],
        firstName: form["First Name"],
        jobTitle: form["Job Title"],
        department: form["Department"],
        dateOfBirth: form["Date of Birth"],
        dateOfEmployment: form["Date of Employment"],
        contactNumber: form["Contact Number"],
        emailAddress: form["Company E-mail Address"],
        staffId: form["Staff ID"],   
        accessLevel: form["Access Level"] || "Leaders Access",
        accountStatus: form["Account Status"] || "Enabled",
      };

      const result = await onCreate(staffData);
      
      if (result !== false) {
        setFormStatus("Staff Created");
        onClose(); // close form only on success
      } else {
        setFormStatus("Submission failed");
      }
     
      
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || "Failed to create staff";
      setError(errorMessage);
      setFormStatus("Creating...");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full w-full bg-white z-20 border shadow-2xl border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-black font-semibold">
          <ListFilterPlus className="w-5 h-5" />
          Create Staff
        </div>

        {/* Close icon */}
        <button
          onClick={() => {
            onClose()
            setFormStatus("Ready..");
          }}
          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-2 gap-1 space-y-3 text-sm max-w-xl">
          {[
            "Last Name",
            "First Name",
            "Job Title",
            "Department",
            "Date of Birth",
            "Date of Employment",
            "Staff ID",
            "Contact Number",
            "Company E-mail Address",
          ].map((label, idx) => (
            <React.Fragment key={idx}>
              <label className="col-span-1 flex items-center text-gray-700">
                {label}:
              </label>
              <input
                type={label.includes("Date") ? "date" : "text"}
                max={label === "Date of Birth" ? todayStr : undefined} // prevents picking future DOB
                className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
                onChange={(e) => handleChange(label, e.target.value)}
                required
              />
            </React.Fragment>
          ))}

          {/* Access Level Dropdown */}
          <label className="col-span-1 flex items-center text-gray-700">Access Level:</label>
          <select
            className="col-span-1 border border-gray-300 px-2 py-1 bg-gray-100 text-sm"
            onChange={(e) => handleChange("Access Level", e.target.value)} 
            required
          >
            <option value="">Select Access Level</option>
            {accessLevels.map((level, i) => (
              <option key={i} value={level}>
                {level}
              </option>
            ))}
          </select>


          {/* Account Status Dropdown */}

          <label className="col-span-1 flex items-center text-gray-700">Account Status:</label>
          <select
            className="col-span-1 border border-gray-300 px-2 py-1 bg-gray-100 text-sm"
            onChange={(e) => handleChange("Account Status", e.target.value)}
            required
          >
            <option value="">Select Status</option>
            {accountStatuses.map((status, i) => (
              <option key={i} value={status}>
                {status}
              </option>
            ))}
          </select>


        </div>
      </div>

      {/* Fixed Footer */}
      <div className="border-t border-gray-300 p-2 pr-6 bg-gray-50 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={!isFormValid() || isSubmitting}
            // onClick={onClose}
            className={`px-4 py-1 bg-gray-200  text-sm transition-colors ${
              !isFormValid() || isSubmitting
                ? "cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Close
          </button>
        </div>
      </div>

      <Toaster position="top-right" reverseOrder={false} />
    </form>
  );
}