"use client";
import { useFormStatus } from "@/context/FormStatusContext";
import { createAssessmentBlock } from "@/services/assessmentBlockManagerService";
import { ListFilterPlus, X } from "lucide-react";
import React, { useState, useEffect } from "react";


const PERIOD_TYPES = [
  "Audit/Survey",
  "Blended - Instructor",
  "Blended - Platform",
  "Camp",
  "Case Study",
  "Certification",
  "Coaching",
  "Conditioning",
  "Exam/Test",
  "Experimental",
  "External Eval",
  "Flex",
  "Flipped",
  "Homework",
  "Immersion",
  "Intern/Co-Op",
  "Internal Eval",
  "Lab",
  "LMS - Distance",
  "Online - Distance",
  "Other",
  "Placement",
  "Probationary",
  "Promotion",
  "Pull-Out",
  "Push-In",
  "Reassigned Work",
  "Research/R&D",
  "Reskilling/CPD/CMP",
  "Rework",
  "Rotation",
  "Scaffolding",
  "Seminar",
  "Study Abroad",
  "Summer Program",
  "Training for Trainees",
  "Training for Trainers",
  "Work",
  "Workshop",
  "Work-Study",
];

const INDIRECT_DELIVERY = [
  "After Unit Operations (MISC)",
  "Before Unit Operations (MISC)",
  "Sensitivity or Exploratory Checking",
  "Pre-Employment",
];

const DIRECT_DELIVERY = [
  "During Unit Operations (on-site)",
  "During Unit Operations (practice)",
  "During Unit Operations (remote)",
  "During Unit Operations (training)",
];


export default function CreateBlockManagerForm({ onClose, activeTab, unitId, candidate, refreshBlocks }) {
  const [form, setForm] = useState({
    periodType: PERIOD_TYPES[0], // default to first period type
    shortDescription: "",
    delivery: activeTab === "Direct" ? DIRECT_DELIVERY[0] : INDIRECT_DELIVERY[0], // default delivery
  });
  const { setFormStatus } = useFormStatus();

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatus("Processing");
    try {
      const payload = {
        unitId: unitId,    
        candidate_id: candidate,             // comes from Unit Roster page
        manageType: activeTab,          // "Direct" or "Indirect"
        periodType: form.periodType,
        shortDescription: form.shortDescription,
        delivery: form.delivery,
      };
      console.log("Sending payload:", payload);
      await createAssessmentBlock(payload);

      if (refreshBlocks) {
        await refreshBlocks();
      }
      setFormStatus("Assessment Block Manager Created");
      onClose(); // close form after success
    } catch (error) {
      console.error("Error creating block:", error);
    }
  };

  const isFormValid = form.shortDescription;

  return (
    <form onSubmit={handleSubmit}
      className="flex flex-col h-full w-full bg-white z-20 border shadow-2xl border-gray-200" >
        
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2 text-black font-semibold">
          <ListFilterPlus className="w-4 h-4" /> Create Assessment Block
        </div>

        {/* Close icon */}
        <button
          onClick={ () => {
            onClose()
            setFormStatus("Ready...")
          }
        }
          className="p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="grid grid-cols-[150px_1fr] gap-y-4 gap-x-4 text-sm max-w-xl">
          {/* Period Type */}
          <label className="flex items-center text-gray-700">Period Type:</label>
          <select
            className="border px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            value={form.periodType}
            onChange={(e) => handleChange("periodType", e.target.value)}
          >
            {PERIOD_TYPES.map((type, i) => (
              <option key={`period-${i}`} value={type}>
                {type}
              </option>
            ))}
          </select>

          {/* Short Description */}
          <label className="flex items-center text-gray-700">Short Description:</label>
          <input
            type="text"
            placeholder="Enter short description"
            value={form.shortDescription}
            onChange={(e) => handleChange("shortDescription", e.target.value)}
            className="border px-2 py-1 w-full bg-white text-sm focus:outline-none focus:ring-1 focus:ring-gray-400"
          />

          {/* Delivery */}
          <label className="flex items-center text-gray-700">Delivery:</label>
          <select
            className="border px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-gray-400"
            value={form.delivery}
            onChange={(e) => handleChange("delivery", e.target.value)}
          >
            {(activeTab === "Direct" ? DIRECT_DELIVERY : INDIRECT_DELIVERY).map(
              (type, i) => (
                <option key={`delivery-${i}`} value={type}>
                  {type}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-gray-300 p-2 pr-6 bg-gray-50 flex-shrink-0">
        <div className="flex justify-end gap-2">
          <button
            type="submit"
            disabled={!isFormValid}
            onClick={handleSubmit}
            className={`px-4 py-1 text-sm transition-colors ${
              isFormValid
                ? "bg-gray-200 hover:bg-gray-300 cursor-pointer"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Close
          </button>
        </div>
      </div>
    </form>

  );
}