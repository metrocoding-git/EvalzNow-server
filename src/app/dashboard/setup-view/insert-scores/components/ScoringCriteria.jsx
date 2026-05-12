"use client";
import { ListFilterPlus, X } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from 'next/navigation';

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

const engageLevel = ["High", "Medium", "Low"];

const competencyTypes = {
  communicativeio: ["Listening", "Reading", "Speaking", "Writing"],
  theorypractical: ["Practice", "Theory"],
  thirdparameter: ["Receptive", "Productive", "Acuity"],
};


const mockPpIds = ["001", "002", "003", "-001", "-002", "-003"];

export default function ScoringCriteria({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    ppId: "",
    duration: "",
    referenceDate: "",
    task: "",
    workflowStage: "",
  });

  const searchParams = useSearchParams();
  const unitQuery = searchParams.get("unitId");
  const typeQuery = searchParams.get("type") || "Communicative I/O";
  const environmentQuery = searchParams.get("environment") || "Classroom";

  const type = typeQuery.toLowerCase().replace(/\s/g, ""); // "communicativeio"
  const environment = environmentQuery; 

  // Get the appropriate competencies based on type
  const currentCompetencies = competencyTypes[type] || competencyTypes.communicativeio;


  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    console.log("Submitting:", formData);
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm flex items-center justify-center">
      <div className="bg-gray-50 text-black border shadow-lg overflow-y-auto z-50  w-full m-auto max-w-5xl  fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 ">
        {/* Header */}
        <div className=" bg-gray-100 px-4 py-2 border-b border-gray-300">
          <div className="flex items-center gap-2 text-gray-800 font-semibold">
            <ListFilterPlus className="w-5 h-5" />
            Insert Scores
          </div>
        </div>
        <div className="px-3 py-1 text-sm text-gray-600 border-b border-gray-200">
          Scoring Criteria
        </div>

        {/* Form Fields */}
        <div className="p-4 text-xs space-y-3 bg-white">
          {/* PP ID */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              PP ID Callout:
            </label>
            <select
              value={formData.ppId}
              onChange={(e) => handleChange("ppId", e.target.value)}
              className="flex-1 border px-2 py-1"
            >
              <option value="" disabled>
                Select PP ID
              </option>
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
              className="flex-1 border px-2 py-1"
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
              className="flex-1 border px-2 py-1"
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
              className="flex-1 border px-2 py-1"
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
              className="flex-1 border px-2 py-1"
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
              className="flex-1 border px-2 py-1"
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
              className="flex-1 border px-2 py-1"
            >
              <option value="">Select Schedule Impact</option>
              {scheduleImpacts.map((impact, i) => (
                <option key={i} value={impact}>
                  {impact}
                </option>
              ))}
            </select>
          </div>

          {/* Engage Level */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Engage Level:
            </label>
            <select
              value={formData.engageLevel || ""}
              onChange={(e) => handleChange("engageLevel", e.target.value)}
              className="flex-1 border px-2 py-1"
            >
              <option value="" disabled>
                Select Engage Level
              </option>
              {engageLevel.map((level, i) => (
                <option key={i} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </div>

          {/* Competency */}
          <div className="flex items-center">
            <label className="w-40 pr-2 text-left text-gray-700">
              Competency:
            </label>
            <select
              value={formData.competency || ""}
              onChange={(e) => handleChange("competency", e.target.value)}
              className="flex-1 border px-2 py-1"
            >
              <option value="" disabled>
                Select Competency
              </option>
              {currentCompetencies.map((comp, i) => (
                <option key={i} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>

        </div>
        

        {/* Buttons */}
        <div className="flex justify-end gap-2 p-2 pr-3 border-t bg-gray-100">
          <button
            onSubmit={handleSubmit}
            onClick={onClose}
            className="px-3 py-1 text-sm bg-gray-600 text-white border border-gray-700 hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
