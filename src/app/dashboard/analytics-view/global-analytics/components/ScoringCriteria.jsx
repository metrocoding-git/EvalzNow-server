"use client";
import { ListFilterPlus, X } from "lucide-react";
import { useState } from "react";

const workflowStages = [
  "Analysis",
  "Backlog",
  "Completed",
  "Conceptual Phase",
  "Critical Phase",
  "Delivered",
  "Deployment",
  "Development",
  "En Route",
  "Facilitation",
  "Feasibility",
  "Follow-Up",
  "Formal Disposition",
  "Formal Request",
  "Implementation",
  "In Deliberation",
  "In Legal",
  "In Operation",
  "In Production",
  "In Progress",
  "In Queue",
  "In Review",
  "Instruction",
  "Kick-Off",
  "Logistics",
  "Maintenance",
  "Makers Learning",
  "Mock-Up",
  "Next Iteration",
  "On-Hold",
  "Optimization",
  "Other",
  "Overhaul",
  "Planning",
  "Policy Shift",
  "Preliminary Phase",
  "Preparation/CSR/CPD",
  "Procurement",
  "Ready for Delivery",
  "Ready for Review",
  "Rejected",
  "Servicing",
  "Simulation/Demo",
  "Staging",
  "Standard",
  "Tender/Bid",
  "Testing",
  "Waiting for External",
  "Waiting for Internal",
];

const assessmentTypes = [
  "Agile Model Target",
  "Behavior-driven Dev Target",
  "Coaching Objective",
  "Company Objective",
  "Confirmative",
  "Criterion-Referenced",
  "Data Security",
  "Deviation",
  "Diagnostic",
  "Domain-driven Dev Target",
  "Formative",
  "Gifted & Talented",
  "Human Capital",
  "IEP Objective",
  "Incremental Model Target",
  "Innovative",
  "Investigative/Root Cause",
  "Ipsative",
  "Key Performance",
  "Neuro-Linguistic Programming",
  "Norm-Referenced",
  "One-Time",
  "Other",
  "Peer",
  "Psychometric",
  "RAD Dev Target",
  "Risk",
  "Routine",
  "RUP Dev Target",
  "SCRUM Model target",
  "SEND Objective",
  "SMART Goal",
  "Special",
  "Spiral Model Target",
  "Summative",
  "Test-Driven Dev Target",
  "V Model Target",
  "Waterfall Model",
];

const scheduleImpacts = [
  "Abandoned",
  "Adjusted",
  "Ahead",
  "Constrained by cost",
  "Constrained by manhours",
  "Delayed",
  "Disrupted",
  "Downtime",
  "Escalated (important, not urgent)",
  "Escalated (urgent, not important)",
  "Escalated (urgent+ important)",
  "Extended",
  "Failed",
  "Force Majeure",
  "High Impact",
  "High-Time (short-staffed)",
  "High-Time (staffed)",
  "Intermittent",
  "Late (manageable)",
  "Late (unmanageable)",
  "Low Impact",
  "Miletone (approaching)",
  "Miletone (due)",
  "Miletone (overdue)",
  "Not Applicable",
  "On-Time",
  "On-Track",
  "Other",
  "Refined",
  "Rescheduled",
  "Scheduled",
  "Suspended",
  "Terminated",
];

const mockPpIds = ["PP-001", "PP-002", "PP-003"]; // Replace with real data from props or API

export default function ScoringCriteria({ onClose }) {
  const [formData, setFormData] = useState({
    ppId: "",
    duration: "",
    referenceDate: "",
    task: "",
    workflowStage: "",
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Submitting:", formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-50 text-black border shadow-lg rounded overflow-y-auto z-50  w-full m-auto max-w-5xl  fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ">
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-100 px-4 py-2 border-b border-blue-300">
          <div className="flex items-center gap-2 text-blue-800 font-semibold">
            <ListFilterPlus className="w-5 h-5" />
            Insert Scores for Competency Accounting
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 text-sm hover:bg-red-100 rounded-full p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-3 py-1 text-sm text-gray-600 border-b border-gray-200">
          Scoring Criteria
        </div>

        {/* Form Fields */}
        <div className="p-4 text-xs space-y-3">
          {/* PP ID */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              PP ID Callout:
            </label>
            <select
              value={formData.ppId}
              onChange={(e) => handleChange("ppId", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            >
              <option value="">Select PP ID</option>
              {mockPpIds.map((pp, i) => (
                <option key={i} value={pp}>
                  {pp}
                </option>
              ))}
            </select>
          </div>

          {/* Duration */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Duration (hrs):
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            />
          </div>

          {/* Critical Reference Date */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Critical Ref. Date:
            </label>
            <input
              type="date"
              value={formData.referenceDate}
              onChange={(e) => handleChange("referenceDate", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            />
          </div>

          {/* Task Declaration */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Task Declaration:
            </label>
            <input
              type="text"
              maxLength={50}
              value={formData.task}
              onChange={(e) => handleChange("task", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            />
          </div>

          {/* Workflow Stage */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Workflow Stage:
            </label>
            <select
              value={formData.workflowStage}
              onChange={(e) => handleChange("workflowStage", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            >
              <option value="">Select Stage</option>
              {workflowStages.map((stage, i) => (
                <option key={i} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </div>

          {/* Assessment Type */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Assessment Type:
            </label>
            <select
              value={formData.assessmentType}
              onChange={(e) => handleChange("assessmentType", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            >
              <option value="">Select Assessment Type</option>
              {assessmentTypes.map((type, i) => (
                <option key={i} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Schedule Impact */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Schedule Impact:
            </label>
            <select
              value={formData.scheduleImpact}
              onChange={(e) => handleChange("scheduleImpact", e.target.value)}
              className="flex-1 border px-2 py-1 rounded"
            >
              <option value="">Select Schedule Impact</option>
              {scheduleImpacts.map((impact, i) => (
                <option key={i} value={impact}>
                  {impact}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 p-2 pr-3 border-t bg-gray-100">
          <button
            onClick={handleSubmit}
            className="px-3 py-1 text-sm bg-blue-600 text-white border border-blue-700 rounded hover:bg-blue-700"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
