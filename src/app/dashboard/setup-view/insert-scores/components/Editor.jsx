"use client";
import React, { useState, useEffect } from "react";
import { Edit, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { getCriticalRefbyPpId, updateInsertScore } from "@/services/insertScoreService";
import { useFormStatus } from "@/context/FormStatusContext";
import { getAssessmentBlockByUnitAndCandidate } from "@/services/assessmentBlockManagerService";
import toast from "react-hot-toast";
import { useUnit } from "@/context/UnitContext";
import { getScoringCriteriaByUnitId } from "@/services/scoringCriteriaService";

const companySizes = [
  "Tier 1 - Micro-Size: 1-4 Candidates",
  "Tier 2 - Small-Size : 5-19 Candidates",
  "Tier 3 - Medium-Size : 20-99 Candidates",
  "Tier 4 - Large-Size : 100-249 Candidates",
  "Tier 5 - Low Enterprise : 250-999 Candidates",
  "Tier 6 - High Enterprise : 1000-2499 Candidates",
  "Tier 7 - Small Campus : 2500-4999 Candidates",
  "Tier 8 - Medium Campus : 5000-14999 Candidates",
  "Tier 9 - Large Campus : 15000-50000 Candidates",
  "Tier 10 - Mass Network : > 50000 Candidates",
];

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

const engageLevel = ["High", "Medium", "Low", "N/A"];

const competencyTypes = {
  communicative: ["Listening", "Reading", "Speaking", "Writing"],
  'theory & practice': ["Practice", "Theory"],
  'third parameter': ["Receptive", "Productive", "Acuity"],
  // Add more types if needed
};

const MAIN_CRITERIA = [
  { name: "Communication", label: "MC1" },
  { name: "Intelligence", label: "MC2" },
  { name: "Responsiveness", label: "MC3" },
  { name: "Efficiency", label: "MC4" },
  { name: "Adaptation", label: "MC5" },
  { name: "Accuracy", label: "MC6" },
  { name: "Verbal Reasoning", label: "MC7" },
  { name: "Spatial Reasoning", label: "MC8" },
  { name: "Numerical Reasoning", label: "MC9" },
  { name: "Problem Solving", label: "MC10" },
  { name: "Memory", label: "MC11" },
  { name: "Data Checking", label: "MC12" },
  { name: "Work Sampling", label: "MC13" },
  { name: "Quality of Work", label: "MC14" },
  { name: "Resourcefulness", label: "MC15" },
  { name: "Following Instructions", label: "MC16" },
  { name: "Working in Teams", label: "MC17" },
  { name: "Working Alone", label: "MC18" },
  { name: "Initiative", label: "MC19" },
  { name: "Sick/Injury Avoidance", label: "MC20" },
];


export default function Editor({ details, performancePoints, onClose, onUpdate, unit }) {
  const [form, setForm] = useState({});
  // const searchParams = useSearchParams();
  const { setFormStatus } = useFormStatus();
  
  const { selectedUnitId, setSelectedUnitId } = useUnit(); 
  const unitId = selectedUnitId;
  const environment = unit?.environment || "";
  const [ppIds, setPpIds] = useState([]);
  // const rawType = searchParams.get("type") || "communicative";
  const type = unit?.unitType?.toLowerCase(); // normalize
  const [criticalRange, setCriticalRange] = useState(null);
  const [customCriteria, setCustomCriteria] = useState([]);
  const [scoringSystem, setScoringSystem] = useState();

  // Get the appropriate competencies based on type
  const currentCompetencies = competencyTypes[type] || competencyTypes.communicative;

  const mockPpIds =
    performancePoints === "Direct"
      ? ["1", "2", "3"]
      : performancePoints === "Indirect"
        ? ["-1", "-2"]
        : [];
       

  const [formData, setFormData] = useState({
    ppId: "",
    durationHrs: "",
    criticalRefDate: "",
    remarks: "",
    workflowStage: "",
    assessmentType: "",
    scheduleImpact: "",
    engageLevel: "",
    competency: "",
    attainedScore: null,
    maxScore: null,
    assessmentBlockId: null,
    unitId: null,
    candidate_id: null,


    mc1: "",
    mc2: "",
    mc3: "",
    mc4: "",
    mc5: "",
    mc6: "",
    mc7: "",
    mc8: "",
    mc9: "",
    mc10: "",
    mc11: "",
    mc12: "",
    mc13: "",
    mc14: "",
    mc15: "",
    mc16: "",
    mc17: "",
    mc18: "",
    mc19: "",
    mc20: "",
    // Custom criteria cc1 - cc20
    cc1: "",
    cc2: "",
    cc3: "",
    cc4: "",
    cc5: "",
    cc6: "",
    cc7: "",
    cc8: "",
    cc9: "",
    cc10: "",
    cc11: "",
    cc12: "",
    cc13: "",
    cc14: "",
    cc15: "",
    cc16: "",
    cc17: "",
    cc18: "",
    cc19: "",
    cc20: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  useEffect(() => {
    const fetchCriteria = async () => {
      if (!unitId) return;
  
      try {
        const data = await getScoringCriteriaByUnitId(unitId);
        if (!Array.isArray(data)) throw new Error("Invalid scoring criteria response");
  
        setCustomCriteria(data.filter(c => c.criteria && c.criteria.trim() !== ""));


        const ccData = {};
        data.forEach((criteria, index) => {
          ccData[`cc${index + 1}`] = criteria.criteria || "";
        });

        setFormData((prev) => ({ ...prev, ...ccData }));
  
      } catch (err) {
        console.error("Failed to fetch scoring criteria:", err);
      }
    };
  
    fetchCriteria();
  }, [unitId]);

  const requiredFields = [
    "ppId",
    "durationHrs",
    "criticalRefDate",
    "remarks",
    "workflowStage",
    "assessmentType",
    "scheduleImpact",
    "engageLevel",
    "competency",
  ];

  useEffect(() => {
    if (details) {
      setFormData({
        ppId: details.ppId || "",
        durationHrs: details.durationHrs || "",
        criticalRefDate: details.criticalRefDate
        ? new Date(details.criticalRefDate).toISOString().split("T")[0]
        : "",
        remarks: details.remarks || "",
        workflowStage: details.workflowStage || "",
        assessmentType: details.assessmentType || "",
        scheduleImpact: details.scheduleImpact || "",
        engageLevel: details.engageLevel || "",
        competency: details.competency || "",
        attainedScore: details.attainedScore ?? null,
        maxScore: details.maxScore ?? null,
        assessmentBlockId: details.assessmentBlockId || null,
        unitId: details.unitId || null,
        candidate_id: details.candidate_id || null,
        task: details.task || "",

        mc1: details.mc1 || "",
        mc2: details.mc2 || "",
        mc3: details.mc3 || "",
        mc4: details.mc4 || "",
        mc5: details.mc5 || "",
        mc6: details.mc6 || "",
        mc7: details.mc7 || "",
        mc8: details.mc8 || "",
        mc9: details.mc9 || "",
        mc10: details.mc10 || "",
        mc11: details.mc11 || "",
        mc12: details.mc12 || "",
        mc13: details.mc13 || "",
        mc14: details.mc14 || "",
        mc15: details.mc15 || "",
        mc16: details.mc16 || "",
        mc17: details.mc17 || "",
        mc18: details.mc18 || "",
        mc19: details.mc19 || "",
        mc20: details.mc20 || "",
        // Custom criteria cc1 - cc20
        cc1: details.cc1 || "",
        cc2: details.cc2 || "",
        cc3: details.cc3 || "",
        cc4: details.cc4 || "",
        cc5: details.cc5 || "",
        cc6: details.cc6 || "",
        cc7: details.cc7 || "",
        cc8: details.cc8 || "",
        cc9: details.cc9 || "",
        cc10: details.cc10 || "",
        cc11: details.cc11 || "",
        cc12: details.cc12 || "",
        cc13: details.cc13 || "",
        cc14: details.cc14 || "",
        cc15: details.cc15 || "",
        cc16: details.cc16 || "",
        cc17: details.cc17 || "",
        cc18: details.cc18 || "",
        cc19: details.cc19 || "",
        cc20: details.cc20 || "",
      });
    }
  }, [details]);

  // Set local scoring system from unit data when component mounts or unit changes
  useEffect(() => {
    if (environment === "Workforce" && unit?.scoringSystem) {
      setScoringSystem(unit.scoringSystem);
    }
  }, [unit]);


  const isSubmitDisabled = (() => {
    // Check required fields common for both environments
    const requiredMissing = requiredFields.some(
      (field) => !formData[field] || formData[field].toString().trim() === ""
    );
    if (requiredMissing) return true;
  
    if (environment === "Classroom") {
      return (
        formData.attainedScore === null ||
        formData.attainedScore === "" ||
        formData.maxScore === null ||
        formData.maxScore === ""
      );
    }
  
    if (environment === "Workforce") {
      // Check if at least one MC or CC has a valid numeric value (not empty, not null, not undefined, not NaN)
      let hasAtLeastOneValue = false;
  
      for (let i = 1; i <= 20; i++) {
        const mcValue = formData[`mc${i}`];
        const ccValue = formData[`cc${i}`];
        
        // Convert to number and check if it's a valid number
        const mcNum = parseFloat(mcValue);
        const ccNum = parseFloat(ccValue);
        
        const mcHasValue = !isNaN(mcNum) && mcValue !== "" && mcValue !== null && mcValue !== undefined;
        const ccHasValue = !isNaN(ccNum) && ccValue !== "" && ccValue !== null && ccValue !== undefined;
        
        if (mcHasValue || ccHasValue) {
          hasAtLeastOneValue = true;
          break; // Found at least one value, no need to check further
        }
      }
  
      return !hasAtLeastOneValue; // disable if none have value
    }
  
    return false;
  })();

  const handleSubmit = async () => {
    if (!formData.assessmentBlockId || !formData.unitId) {
      setError("Missing unitId or assessmentBlockId.");
      return;
    }
  
    // Validate against critical date range
    if (!validateCriticalDate(formData.criticalRefDate)) return;


    try {
      setLoading(true);
      setFormStatus("Processing...");
  
      const payload = {
        ...formData,
        unitId: parseInt(formData.unitId), 
        candidate_id: parseInt(formData.candidate_id), 
        durationHrs: formData.durationHrs ? parseFloat(formData.durationHrs) : null,
        attainedScore: formData.attainedScore ? parseInt(formData.attainedScore) : null,
        maxScore: formData.maxScore ? parseInt(formData.maxScore) : null,
        criticalRefDate: formData.criticalRefDate
          ? new Date(formData.criticalRefDate).toISOString() 
          : null,
      };

      // Convert empty strings to null for MC and CC fields
      for (let i = 1; i <= 20; i++) {
        payload[`mc${i}`] = formData[`mc${i}`] === "" ? null : parseFloat(formData[`mc${i}`]);
        payload[`cc${i}`] = formData[`cc${i}`] === "" ? null : parseFloat(formData[`cc${i}`]);
      }

      let attained = null;
      let maxScoreCalculated = null;

      if (environment === "Workforce") {
        let maxAllowed = null;
        if (scoringSystem === "3-Point") maxAllowed = 3;
        if (scoringSystem === "5-Point") maxAllowed = 5;
    
        // Calculate Max Score
        let filledCount = 0;
        let total = 0;
    
        for (let i = 1; i <= 20; i++) {
          const rawMc = formData[`mc${i}`];
          // Only process if not empty string
          if (rawMc !== "" && rawMc !== null) {
            const mcVal = parseFloat(rawMc);
            if (isNaN(mcVal)) {
              toast.error(`Invalid value found in MC${i}. Please enter a valid number.`);
              return;
            }
            if (mcVal < 0) {
              toast.error(`Negative value found in MC${i}. Please enter only positive values.`);
              return;
            }
            if (maxAllowed !== null && mcVal > maxAllowed) {
              toast.error(`MC${i} exceeds allowed maximum (${maxAllowed}).`);
              return;
            }
            total += mcVal;
            filledCount++;
          }
    
          const rawCc = formData[`cc${i}`];
          // Only process if not empty string
          if (rawCc !== "" && rawCc !== null) {
            const ccVal = parseFloat(rawCc);
            
            if (ccVal < 0) {
              toast.error(`Negative value found in CC${i}. Please enter only positive values.`);
              return;
            }
            if (maxAllowed !== null && ccVal > maxAllowed) {
              toast.error(`CC${i} exceeds allowed maximum (${maxAllowed}).`);
              return;
            }
            total += ccVal;
            filledCount++
          }
        }
    
        attained = total;
        maxScoreCalculated = maxAllowed * filledCount;
      
      }
  
      const response = await updateInsertScore(details.id, payload); 
      setFormStatus("Insert Score Updated");

      
      console.log("Successfully updated insert score.");
  
      if (onUpdate) onUpdate(response);
      onClose?.(); // Close the form if callback provided
    } catch (err) {
      console.error("Failed to update insert score:", err);
      setError("Failed to save insert score.");
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const fetchBlockInfo = async () => {
      if (!formData.unitId || !formData.candidate_id) return;
  
      try {
        setLoading(true);
        const blocks = await getAssessmentBlockByUnitAndCandidate(formData.unitId, formData.candidate_id);
  
        if (blocks?.length > 0) {
          
          // Extract PP IDs and sort ascending (numeric or string)
          const ppList = blocks
        .map((b) => b.ppId)
        .filter((pp) => pp !== undefined && pp !== null && pp !== "")
        .sort((a, b) => {
          const numA = parseInt(a, 10);
          const numB = parseInt(b, 10);

          // If both negative, sort descending
          if (numA < 0 && numB < 0) return numB - numA;
          // If both positive, sort ascending
          if (numA > 0 && numB > 0) return numA - numB;
          // Negatives come before positives
          if (numA < 0) return -1;
          if (numB < 0) return 1;

          // Fallback for strings
          return a.localeCompare(b);
        });

        setPpIds(ppList);

        } else {
          // setFormData((prev) => ({ ...prev, assessmentBlockId: "", ppId: "" }));
          setPpIds([]);
        }
      } catch (err) {
        console.error("Failed to fetch block info:", err);
        toast.error("Failed to load candidate block data.");
      } finally {
        setLoading(false);
      }
    };
  
    fetchBlockInfo();
  }, [formData.unitId, formData.candidate_id]);

  // Fetch Critical Reference Date by PP ID
  useEffect(() => {
    const fetchCriticalRefByPpId = async () => {
      if (!formData.unitId || !formData.candidate_id || !formData?.ppId) return;

      try {
        setLoading(true);
        const response = await getCriticalRefbyPpId(formData?.ppId, formData.unitId, formData.candidate_id);

        console.log("ref check: ->", response);
        // Ensure response exists and has startDate
        if (response && response.startDate) {
          setCriticalRange({
            start: new Date(response.startDate),
            end: response.endDate ? new Date(response.endDate) : null, // endDate might be null
          });
        } else {
          // No critical range for this PP ID
          setCriticalRange(null);
        }
      } catch (err) {
        console.error("Failed to fetch critical ref:", err);
        toast.error("Failed to load critical date range.");
        setCriticalRange(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCriticalRefByPpId();
  }, [formData.unitId, formData.candidate_id, formData?.ppId]);

  // Validation before submit
  const validateCriticalDate = (inputDateStr) => {
    if (!criticalRange || !inputDateStr) return true; // nothing to validate

    const inputDate = new Date(inputDateStr);
    const startDate = criticalRange.start;
    const endDate = criticalRange.end;

    if (inputDate < startDate) {
      toast.error(`Critical Ref. Date cannot be before ${startDate.toLocaleDateString()}.`);
      return false;
    }

    if (endDate && inputDate > endDate) {
      toast.error(`Critical Ref. Date cannot be after ${endDate.toLocaleDateString()}.`);
      return false;
    }

    return true;
  };


  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2 text-black font-semibold text-sm">
          <Edit className="w-4 h-4" />
          Entity Editor
        </div>
      </div>

    {details && (
      <>
        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <form onSubmit={handleSubmit} className=" text-xs space-y-3 bg-white">
            <div className="grid grid-cols-[140px_1fr] items-center gap-x-2 gap-y-3 p-3">
              {/* PP ID */}
              <label className="text-gray-700 text-left">PP ID Callout:</label>
              <select
                value={formData.ppId}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("ppId", e.target.value)}
                className="border px-2 py-1 w-full"
              >
                <option value="" disabled>
                  Select PP ID
                </option>
                {ppIds.map((pp, i) => (
                  <option key={i} value={pp}>
                    {pp}
                  </option>
                ))}
              </select>

              {/* Duration */}
              <label className="text-gray-700 text-left">Duration (Days):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.durationHrs || ""}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("durationHrs", e.target.value)}
                className="border px-2 py-1 w-full"
              />

              {/* Critical Reference Date */}
              <label className="text-gray-700 text-left">Critical Ref. Date:</label>
              <input
                type="date"
                value={formData.criticalRefDate}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("criticalRefDate", e.target.value)}
                className="border px-2 py-1 w-full"
              />

              {/* Task Declaration */}
              <label className="text-gray-700 text-left">Task Declaration:</label>
              <input
                type="text"
                maxLength={50}
                value={formData.remarks}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("remarks", e.target.value)}
                className="border px-2 py-1 w-full"
              />

              {/* Workflow Stage */}
              <label className="text-gray-700 text-left">Workflow Stage:</label>
              <select
                value={formData.workflowStage}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("workflowStage", e.target.value)}
                className="border px-2 py-1 w-full"
              >
                <option value="">Select Stage</option>
                {workflowStages.map((stage, i) => (
                  <option key={i} value={stage}>
                    {stage}
                  </option>
                ))}
              </select>

              {/* Assessment Type */}
              <label className="text-gray-700 text-left">Assessment Type:</label>
              <select
                value={formData.assessmentType}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("assessmentType", e.target.value)}
                className="border px-2 py-1 w-full"
              >
                <option value="">Select Assessment Type</option>
                {assessmentTypes.map((type, i) => (
                  <option key={i} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* Schedule Impact */}
              <label className="text-gray-700 text-left">Schedule Impact:</label>
              <select
                value={formData.scheduleImpact}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("scheduleImpact", e.target.value)}
                className="border px-2 py-1 w-full"
              >
                <option value="">Select Schedule Impact</option>
                {scheduleImpacts.map((impact, i) => (
                  <option key={i} value={impact}>
                    {impact}
                  </option>
                ))}
              </select>

              {/* Engage Level */}
              <label className="text-gray-700 text-left">Engage Level:</label>
              <select
                value={formData.engageLevel || ""}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("engageLevel", e.target.value)}
                className="border px-2 py-1 w-full"
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

              {/* Competency */}
              <label className="text-gray-700 text-left">Competency:</label>
              <select
                value={formData.competency || ""}
                onFocus={() => setFormStatus("Editing...")}
                onBlur={() => setFormStatus("Ready...")}
                onChange={(e) => handleChange("competency", e.target.value)}
                className="border px-2 py-1 w-full"
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

              {environment === "Workforce" && (
                <div className="col-span-2 w-full grid grid-cols-[140px_1fr] gap-x-2 gap-y-2">
                  {/* Main Criteria (MC1 - MC20) */}
                  {MAIN_CRITERIA.map((criteria, index) => {
                    const fieldKey = `mc${index + 1}`;
                    return (
                      <React.Fragment key={fieldKey}>
                        <label className="text-left text-gray-700">
                          {criteria.label} ({criteria.name}):
                        </label>
                        <input
                          step="0.01"
                          min="0"
                          type="number"
                          onBlur={(e) => {
                            const val = e.target.value;
                            handleChange(fieldKey, val === "" ? "" : parseFloat(val).toFixed(2));
                          }}
                          value={formData[fieldKey]}
                          onChange={(e) => handleChange(fieldKey, e.target.value)}
                          className="border px-2 py-1 w-full"
                        />
                      </React.Fragment>
                    );
                  })}

                  {/* Custom Criteria (CC1 - CC20) */}
                  {customCriteria.length > 0 &&
                    customCriteria.map((criteria, index) => {
                      const fieldKey = `cc${index + 1}`;
                      return (
                        <React.Fragment key={fieldKey}>
                          <label className="text-left text-gray-700 whitespace-nowrap pr-2">
                            CC{index + 1} ({criteria.criteria}):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            onBlur={(e) => {
                              const val = e.target.value;
                              handleChange(fieldKey, val === "" ? "" : parseFloat(val).toFixed(2));
                            }}
                            value={formData[fieldKey]}
                            onChange={(e) => handleChange(fieldKey, e.target.value)}
                            className="border px-2 py-1 w-full"
                          />
                        </React.Fragment>
                      );
                    })}
                </div>
              )}


              {environment === "Classroom" && (
                <>
                  <label className="text-gray-700 text-left">Attained Score:</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.attainedScore || ""}
                    onFocus={() => setFormStatus("Editing...")}
                    onBlur={() => setFormStatus("Ready...")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        attainedScore: e.target.value,
                      }))
                    }
                    className="border px-2 py-1 w-full"
                  />

                  <label className="text-gray-700 text-left">Maximum Score:</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxScore || ""}
                    onFocus={() => setFormStatus("Editing...")}
                    onBlur={() => setFormStatus("Ready...")}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxScore: e.target.value,
                      }))
                    }
                    className="border px-2 py-1 w-full"
                  />
                </>
              )}
            </div>

            {/* Button */}
            <div className="border-t border-gray-200 p-2 bg-gray-50 pr-3">
              <div className="flex justify-end  ">
                <button
                  type="button"
                  disabled={isSubmitDisabled || loading}
                  onClick={handleSubmit}
                  className={`px-4 py-1 text-sm transition-colors ${
                    isSubmitDisabled || loading
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "bg-gray-200 hover:bg-gray-300"
                  }`}
                >
                  Edit
                </button>
              </div>
            </div>
          </form>
        </div>
      </>
    )}
  </div>


  );
}
