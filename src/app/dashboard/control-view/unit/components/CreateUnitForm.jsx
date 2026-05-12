"use client";
import { ListFilterPlus, Trash2, X } from "lucide-react";
import React, { useState, useEffect } from "react";
import StaffLookup from "./StaffLookUp";
import { getAllCandidates } from "@/services/candidateService";
import { createUnit } from "@/services/unitService";
import { useFormStatus } from "@/context/FormStatusContext";
import { Toaster } from "react-hot-toast";

const UNIT_TYPES = [
  "Communicative I/O",
  "Theory & Practice",
  "Third Parameter",
];
const ENVIRONMENTS = ["Workforce", "Classroom"];
const SIGNATURE_PROFILES = [
  "Case 1: Solid Balanced",
  "Case 2: Rigorous Balanced",
  "Case 3a: Productive‑Weighted",
  "Case 3b: Receptive‑Weighed",
];
const SCORING_SYSTEMS = ["3-Point", "5-Point"];

const BENCHMARK_TYPES = [
  "Academic",
  "Audit Requirement",
  "Baseline",
  "Company Standard",
  "Direct Job Function",
  "District Standard",
  "Experimental",
  "External",
  "Governmental",
  "Human Capital",
  "Innovation",
  "Internal",
  "Investment",
  "KPI",
  "Market Disruption",
  "Other",
  "Performance",
  "Regulatory",
  "Safety",
  "SARPs",
  "SLO",
  "Standard",
  "Strategic",
  "Team Building",
  "Trial & Error",
];

export default function CreateUnitForm({ onClose, staffPool = [], onSubmit, unitData }) {
  const [form, setForm] = useState({
    unitName: "",
    unitId: "",
    startDate: "",
    endDate: "",
    unitType: "",
    environment: "",
    signatureProfile: "",
    unitDirector: "",
    scoringSystem: "",
    passThresholds: {}, // Initialize to avoid undefined errors
    benchmarks: [],
    assignedLeaders: [], // ✅ Initialize
    assignedAssessors: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };
  const [lookupFor, setLookupFor] = useState(null);
  const [showLookup, setShowLookup] = useState(false);
  const { formStatus, setFormStatus } = useFormStatus();

  const showThresholds = form.unitType !== "";

  // Map of abbreviations to expanded names
const THRESHOLD_NAMES = {
  XEP: "Equivalent Proficiency",
  XRR: "Reading Ratio",
  XLR: "Listening Ratio",
  XSR: "Speaking Ratio",
  XWR: "Writing Ratio",
  XCP: "Composite Proficiency",
  XBP: "Band Proficiency",
  MSIP: "Butler Interaction Proficiency",
  ΔRRN: "Receptive Growth Differential",
  ΔPRN: "Productive Growth Differential",
  ΔARN: "Acuity Growth Differential",
  ΔGEQ: "Equivalent Growth Differential",
  IC: "Interaction Class",
  XTR: "Theory-Based Ratio",
  XPR: "Practice Ratio",
  XRVSR: "Receptive Variable Scoring Ratio",
  XPVSR: "Productive Variable Scoring Ratio",
  XAVSR: "Acuity Value Score Ratio"
};


  const [unitDirectors, setUnitDirectors] = useState([]);
  const defaultThresholds = {
    "Communicative I/O": {
      XEP: 0.700,
      XRR: 0.700,
      XLR: 0.700,
      XSR: 0.700,
      XWR: 0.700,
      XCP: 0.700,
      XBP: 0.700,
      MSIP: 0.450,
      ΔRRN: 0.0,
      ΔPRN: 0.0,
      ΔGEQ: 0.0,
      IC: 2,
    },
    "Theory & Practice": {
      XEP: 0.700,
      XTR: 0.700,
      XPR: 0.700,
      XCP: 0.700,
      XBP: 0.700,
      MSIP: 0.450,
      ΔRRN: 0.0,
      ΔPRN: 0.0,
      ΔGEQ: 0.0,
      IC: 2,
    },
    "Third Parameter": {
      XEP: 0.700,
      XRVSR: 0.700,
      XPVSR: 0.700,
      XAVSR: 0.700,
      XCP: 0.700,
      XBP: 0.700,
      MSIP: 0.450,
      ΔRRN: 0.0,
      ΔPRN: 0.0,
      ΔARN: 0.0,
      ΔGEQ: 0.0,
      IC: 2,
    },
  };

  // Dynamic signature profiles
  const getSignatureProfiles = (unitType) => {
    if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
      return [
        "Case 1: Solid Balanced",
        "Case 2: Rigorous Balanced",
        "Case 3a: Productive-Weighted",
        "Case 3b: Receptive-Weighted",
      ];
    }
    if (unitType === "Third Parameter") {
      return ["Case 1: Solid Balanced"];
    }
    return [];
  };

  // Reset signatureProfile whenever unitType changes
  useEffect(() => {

    if (unitData) {
      return;
    }

    setForm((prev) => ({
      ...prev,
      signatureProfile: "", // reset selection
    }));
  }, [form.unitType, unitData]);

  const handleStaffSelect = (selectedStaffArray) => {
    if (lookupFor === "leaders") {
      const leaderIds = selectedStaffArray.map((s) => s.id);
      handleChange("assignedLeaders", leaderIds);
  
      // Update unitDirectors dropdown to match selected leaders
      setUnitDirectors(selectedStaffArray);
    } else if (lookupFor === "assessors") {
      handleChange(
        "assignedAssessors",
        selectedStaffArray.map((s) => s.id)
      );
    } else if (lookupFor === "director") {
      handleChange("unitDirector", selectedStaffArray[0]?.id || "");
    }
  
    setShowLookup(false);
    setLookupFor(null);
  };
  

  useEffect(() => {
    if (form.unitType && defaultThresholds[form.unitType]) {
      setForm((prev) => ({
        ...prev,
        passThresholds: defaultThresholds[form.unitType],
      }));
    } else {
      // Fallback if unitType is invalid
      setForm((prev) => ({
        ...prev,
        passThresholds: {},
      }));
    }
  }, [form.unitType]);

  const isFormValid = () => {
  return (
    form.unitName?.trim() &&
    form.unitId?.trim() &&
    form.startDate?.trim() &&
    form.unitDirector?.trim() &&
    form.unitType?.trim() &&
    form.signatureProfile?.trim() &&
    form.environment?.trim() &&
    (form.environment !== "Workforce" || form.scoringSystem?.trim())
  );
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.unitName || !form.unitId || !form.unitType || !form.unitDirector) {
      alert("Please fill in all required fields");
      return;
    }
    
    setIsSubmitting(true);
    setFormStatus("Processing...");
    try {
      // Prepare benchmarks data
      const benchmarks = form.benchmarks.map(bm => ({
        benchmarkType: bm.type,
        benchmarkRef: bm.ref,
        benchmarkDescription: bm.description
      }));

      // 🧩 Prepare staff lookup data
      const staffLookup = [
        ...(form.assignedLeaders || []).map((id) => ({
          staffId: id,
          roleType: "Leader",
        })),
        ...(form.assignedAssessors || []).map((id) => ({
          staffId: id,
          roleType: "Assessor",
        })),
      ];

      // Prepare the complete unit data
      const unitData = {
        unitName: form.unitName,
        unitId: form.unitId,
        unitStartDate: form.startDate,
        unitEndDate: form.endDate,
        unitDirector: form.unitDirector,
        unitType: form.unitType,
        signatureProfile: form.signatureProfile,
        environment: form.environment,
        scoringSystem: form.scoringSystem,
        benchmarks: benchmarks,
        staffLookup: staffLookup,
        ...form.passThresholds,
      };

      // const createdUnit = await createUnit(unitData);
      // console.log("Unit created successfully:", createdUnit);
      
      const result = await onSubmit(unitData);
      // ✅ Only close if submission was successful
      if (result !== false) {
        setFormStatus("Unit Created");
        onClose(); // close form only on success
      } else {
        setFormStatus("Submission failed");
      }
    } catch (error) {
      console.error("Error creating unit:", error);
      alert("Failed to create unit. Please try again.");
    }
    finally {
      setIsSubmitting(false);
    }
    
  };

  console.log("selcted duplicate data: ", unitData);



  // Populate form if unitData is provided (for editing)
  useEffect(() => {
    if (!unitData) return;

    let assignedLeaders = [];
    let assignedAssessors = [];
    let unitDirectors = [];

    // ✅ Check both staffAssignments and staffMembers
    const staffSource = unitData.staffAssignments?.length > 0 
      ? unitData.staffAssignments 
      : unitData.staffMembers || [];

    console.log("Staff source data:", staffSource); // Debug log

    if (Array.isArray(staffSource) && staffSource.length > 0) {
      // If using staffAssignments (has roleType directly)
      if (staffSource[0]?.roleType) {
        assignedLeaders = staffSource
          .filter(sa => sa.roleType === "Leader")
          .map(sa => sa.staff?.id || sa.staffId || sa.id || "");

        assignedAssessors = staffSource
          .filter(sa => sa.roleType === "Assessor")
          .map(sa => sa.staff?.id || sa.staffId || sa.id || "");

        unitDirectors = staffSource
          .filter(sa => sa.roleType === "Leader")
          .map(sa => sa.staff || sa)
          .filter(Boolean);
      } 
      // If using staffMembers (roleType is inside StaffLookup property)
      else if (staffSource[0]?.StaffLookup?.roleType) {
        assignedLeaders = staffSource
          .filter(staff => staff.StaffLookup?.roleType === "Leader")
          .map(staff => staff.id);

        assignedAssessors = staffSource
          .filter(staff => staff.StaffLookup?.roleType === "Assessor")
          .map(staff => staff.id);

        unitDirectors = staffSource
          .filter(staff => staff.StaffLookup?.roleType === "Leader");
      }
      // Fallback: treat all as leaders
      else {
        assignedLeaders = staffSource.map(staff => staff.id);
        unitDirectors = staffSource;
      }
    }

    setForm({
      unitName: "",
      unitId: "",
      startDate: unitData.unitStartDate || "",
      endDate: unitData.unitEndDate || "",
      unitType: unitData.unitType || "",
      environment: unitData.environment || "",
      signatureProfile: unitData.signatureProfile || "",
      unitDirector: unitData.unitDirector || "",
      passThresholds:
        unitData.passThresholds ||
        defaultThresholds[unitData.unitType] ||
        {},
      benchmarks: (unitData.benchmarks || []).map((bm, i) => ({
        id: String(i + 1),
        benchmarkId: bm.benchmarkId || "",
        type: bm.benchmarkType || "",
        ref: bm.benchmarkRef || "",
        description: bm.benchmarkDescription || "",
      })),
      assignedLeaders, // ✅ Set from unitData
      assignedAssessors, // ✅ Set from unitData
      scoringSystem: unitData.scoringSystem || "",
    });

    setUnitDirectors(unitDirectors);
    
    // ✅ Add console log to verify
    console.log("Populated form with staff:", {
      assignedLeaders,
      assignedAssessors,
      unitDirector: unitData.unitDirector
    });
  }, [unitData]);


  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full w-full bg-white z-20 border shadow-2xl border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-black font-semibold">
          <ListFilterPlus className="w-5 h-5" />
          Create Unit
        </div>

        {/* Close icon */}
        <button
          onClick={onClose}
          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-1 gap-1 space-y-3 text-sm max-w-xl">

          {/* Basic Unit Details */}
          {[
            { label: "Unit Name", key: "unitName", type: "text", required: true },
            { label: "Unit ID", key: "unitId", type: "text", required: true },
            { label: "Unit Start Date", key: "startDate", type: "date", required: true },
            { label: "Unit End Date", key: "endDate", type: "date" }
          ].map(({ label, key, type, placeholder }) => (
            <React.Fragment key={key}>
              <label className="col-span-1 flex items-center text-gray-700">{label}:</label>
              <input
               type={type}
               required
               value={form[key] || ""}
               onChange={(e) => handleChange(key, e.target.value)}
                className="col-span-1 border border-gray-300 px-2 py-1 bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
              />
            </React.Fragment>
          ))}

          {/* Staff Assignment */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              Staff Assignment
            </h3>

            {/* Assigned Leaders */}
            <div className="flex justify-between gap-2 space-y-1">
              <label className="col-span-1 flex items-center text-gray-700">
                Assigned Leaders:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLookupFor("leaders");
                    setShowLookup(true);
                  }}
                  className="px-2 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                >
                  + Add Leader
                </button>
                <div className="text-sm text-gray-700">
                  {/* {form.assignedLeaders?.length || 0} selected */}
                  Max 3
                </div>
              </div>
            </div>

            {/* Assigned Assessors */}
            <div className="flex justify-between gap-2 space-y-1">
              <label className="col-span-1 flex items-center text-gray-700">
                Assigned Assessors:
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLookupFor("assessors");
                    setShowLookup(true);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                >
                  + Add Assessor
                </button>
                <div className="text-sm text-gray-700">
                  {/* {form.assignedAssessors?.length || 0} selected */}
                  Max 3
                </div>
              </div>
            </div>

            {/* Unit Director */}
            <div className="flex justify-between gap-2 space-y-1">

              {/* <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLookupFor("director");
                    setShowLookup(true);
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm"
                >
                  Select Director
                </button>
                <div className="text-sm text-gray-700">
                  {form.unitDirector
                    ? staffPool.find((s) => s.id === form.unitDirector)?.name ||
                    "Selected"
                    : "None"}
                </div>
              </div> */}

              <label className="col-span-1 flex items-center text-gray-700">
                Unit Director:
              </label>
              <select
                required
                value={form.unitDirector || ""}
                onChange={(e) => handleChange("unitDirector", e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
              >
                <option value="">Select Unit Director</option>
                {unitDirectors.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName} 
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Fixed Fields */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              Unit Configuration
            </h3>
            {[
              { label: "Unit Type", key: "unitType", options: UNIT_TYPES },
              {
                label: "Signature Profile",
                key: "signatureProfile",
                options: getSignatureProfiles(form.unitType),
              },
              { label: "Environment", key: "environment", options: ENVIRONMENTS },
            ].map(({ label, key, options }) => (
              <div key={key} className="grid grid-cols-2 items-center gap-2">
                <label className="col-span-1 flex items-center text-gray-700">
                  {label}:
                </label>
                <select
                  value={form[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                >
                  <option value="" disabled>
                    Select {label}
                  </option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}



            {form.environment === "Workforce" && (
              <div className="space-y-1">
                <label className="col-span-1 flex items-center text-gray-700">
                  Scoring System:
                </label>
                <select
                  required
                  value={form.scoringSystem}
                  onChange={(e) => handleChange("scoringSystem", e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                >
                  <option value="">Select System</option>
                  {SCORING_SYSTEMS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Pass/Fail Thresholds Section */}
          {showThresholds && (
            <div className="pt-4 border-t border-gray-200 space-y-3">
              <h3 className="text-base font-semibold text-gray-800">
                Pass/Fail Thresholds
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(form.passThresholds).map(([k, v]) => (
                  <div key={k} className="space-y-1 relative group">
                    {/* Tooltip */}
                    <div className="absolute -top-8 left-0 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 whitespace-nowrap">
                      {THRESHOLD_NAMES[k] || k}
                    </div>

                    <label className="block text-gray-700 font-medium text-xs">
                      {k}:
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={typeof v === "number" ? v.toFixed(3) : ""}
                      disabled={k === "IC"}
                      onChange={(e) =>
                        handleChange("passThresholds", {
                          ...form.passThresholds,
                          [k]: parseFloat(e.target.value),
                        })
                      }
                      className={`w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent ${
                        k === "IC" ? "bg-gray-100" : "bg-white"
                      }`}
                    />
                  </div>
                ))}
              </div>


            </div>
          )}

          {/* Benchmarks Section */}
          <div className="pt-4 border-t border-gray-200 space-y-3">
            <h3 className="text-base font-semibold text-gray-800">
              Unit Benchmarks
            </h3>
            <div className="space-y-2">
              {(form.benchmarks || []).map((bm, idx) => (
                <div key={idx} className="flex items-end gap-3 overflow-x-auto p-2">
                  {/* Benchmark ID */}
                  <div className="flex flex-col min-w-[120px]">
                    <label className="text-gray-700 font-medium text-xs">
                      BID:
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: 01"
                      maxLength={20}
                      className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      value={bm.benchmarkId ||bm.id || ""}
                      readOnly
                      
                    />
                  </div>

                  {/* Benchmark Type */}
                  <div className="flex flex-col min-w-[160px]">
                    <label className="text-gray-700 font-medium text-xs">
                      Benchmark Type:
                    </label>
                    <select
                      className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      value={bm.type || ""}
                      onChange={(e) => {
                        const updated = [...form.benchmarks];
                        updated[idx].type = e.target.value;
                        setForm((f) => ({ ...f, benchmarks: updated }));
                      }}
                    >
                      <option value="">Select Type</option>
                      {BENCHMARK_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Benchmark Ref */}
                  <div className="flex flex-col min-w-[160px]">
                    <label className="text-gray-700 font-medium text-xs">
                      Benchmark Ref:
                    </label>
                    <input
                      type="text"
                      maxLength={40}
                      className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      value={bm.ref || ""}
                      onChange={(e) => {
                        const updated = [...form.benchmarks];
                        updated[idx].ref = e.target.value;
                        setForm((f) => ({ ...f, benchmarks: updated }));
                      }}
                    />
                  </div>


                  {/* Benchmark Ref */}
                  <div className="flex flex-col min-w-[160px]">
                    <label className="text-gray-700 font-medium text-xs">
                      Benchmark Description:
                    </label>
                    <input
                      type="text"
                      placeholder=""
                      maxLength={40}
                      className="w-full border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
                      value={bm.description || ""}
                      onChange={(e) => {
                        const updated = [...form.benchmarks];
                        updated[idx].description = e.target.value;
                        setForm((f) => ({ ...f, benchmarks: updated }));
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-center mb-1">
                    <button
                      type="button"
                      onClick={() => {
                        // Remove the selected benchmark
                        const updated = form.benchmarks.filter((_, i) => i !== idx);
                    
                        // Reorder IDs sequentially (1, 2, 3, ...)
                        const reordered = updated.map((bm, i) => ({
                          ...bm,
                          id: String(i + 1),
                        }));
                    
                        setForm((f) => ({ ...f, benchmarks: reordered }));
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>


                </div>
              ))}

              {/* Add Benchmark Button */}
              <button
                type="button"
                onClick={() =>
                  setForm((f) => {
                    // Reindex existing first to ensure consistency
                    const reordered = (f.benchmarks || []).map((bm, i) => ({
                      ...bm,
                      id: String(i + 1),
                    }));
              
                    // Add new one with next sequential ID
                    const nextId = reordered.length + 1;
              
                    return {
                      ...f,
                      benchmarks: [
                        ...reordered,
                        { id: String(nextId), ref: "", type: "", description: "" },
                      ],
                    };
                  })
                }
                className="px-3 py-1 bg-gray-200 text-gray-800 hover:bg-gray-300 text-sm transition-colors"
              >
                + Add Benchmark
              </button>
            </div>
          </div>
        </div>
      </div>
      {/*  Bottom Actions */}
      <div className="border-t border-gray-300 p-2 pr-6 bg-gray-50 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={!isFormValid()}
            className={`px-4 py-1 bg-gray-200 hover:bg-gray-300 text-sm transition-colors ${
              !isFormValid() 
                ? "cursor-not-allowed"
                : "bg-gray-200 hover:bg-gray-300"
            }`}
          >
            Close
          </button>
        </div>
      </div>



      {
        showLookup && (
          <StaffLookup
            onClose={() => {
              setShowLookup(false);
              setLookupFor(null);
            }}
            onSelect={handleStaffSelect} // reuse handleStaffSelect
            selectedIds={
              lookupFor === "leaders"
                ? form.assignedLeaders || []
                : lookupFor === "assessors"
                ? form.assignedAssessors || []
                : lookupFor === "director"
                ? form.unitDirector
                  ? [form.unitDirector]
                  : []
                : []
            }
          />
        )
      }
      <Toaster position="top-right" reverseOrder={false} />
    </form >
  );
}