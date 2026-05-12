import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAssessmentBlockByUnitId } from "@/services/assessmentBlockManagerService";
import { getScoreByUnitGroup } from "@/services/insertScoreService";
import { useUnit } from "@/context/UnitContext";

// Define competency types and their corresponding columns
const competencyTypes = {
  'Communicative I/O': [
    { attained: "Attained Listening Score", max: "Maximum Listening Score", dataKey: "Listening",  },
    { attained: "Attained Reading Score", max: "Maximum Reading Score", dataKey: "Reading" },
    { attained: "Attained Speaking Score", max: "Maximum Speaking Score", dataKey: "Speaking" },
    { attained: "Attained Writing Score", max: "Maximum Writing Score", dataKey: "Writing" }
  ],
  'Theory & Practice': [
    { attained: "Attained Theory Score", max: "Maximum Theory Score", dataKey: "Theory" },
    { attained: "Attained Practice Score", max: "Maximum Practice Score", dataKey: "Practice" }
  ],
  'Third Parameter': [
    { attained: "Attained Receptive Variable Score", max: "Maximum Receptive Variable Score", dataKey: "Receptive" },
    { attained: "Attained Productive Variable Score", max: "Maximum Productive Variable Score", dataKey: "Productive" },
    { attained: "Attained Acuity Variable Score", max: "Maximum Acuity Variable Score", dataKey: "Acuity" }
  ]
};

const MasterPpIdBinTable = ({ data }) => {

  // Sort data by absolute ppId value, with negative values first
  const sortedData = [...data].sort((a, b) => {
    const absA = Math.abs(a.ppId);
    const absB = Math.abs(b.ppId);
    if (a.ppId < 0 && b.ppId > 0) return -1;
    if (a.ppId > 0 && b.ppId < 0) return 1;
    return absA - absB;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [assessmentBlocks, setAssessmentBlocks] = useState([]);

  // const searchParams = useSearchParams();
  const { selectedUnitId, setSelectedUnitId } = useUnit();
  const unitId = selectedUnitId;

  useEffect(() => {
    const fetchBlocks = async () => {
      if (!unitId) return;
      try {
        setLoading(true);
        const blocks = await getScoreByUnitGroup(unitId);
        // Ensure it's always an array
        setAssessmentBlocks(Array.isArray(blocks) ? blocks : [blocks]);
      } catch (err) {
        console.error("Failed to fetch blocks:", err);
        setError("Failed to load blocks");
      } finally {
        setLoading(false);
      }
    };
    fetchBlocks();
  }, [unitId]);

  // Sort by ppId
  const sortedBlocks = [...assessmentBlocks].sort((a, b) => {
    const numA = Number(a.ppId);
    const numB = Number(b.ppId);

    // Negatives first
    if (numA < 0 && numB > 0) return -1;
    if (numA > 0 && numB < 0) return 1;

    // Within negatives: descending (-1, -2, -3)
    if (numA < 0 && numB < 0) return numB - numA;

    // Within positives: ascending (1, 2, 3)
    return numA - numB;
  });

  

  // Determine current competencies based on unitType
  const currentUnitType = sortedBlocks[0]?.unitType || "";
  const currentCompetencies = competencyTypes[currentUnitType] || [];

  // Transform rows before rendering
  const transformedBlocks = sortedBlocks.map((row) => {
    const newRow = { ...row };

    // Decide by competency
    if (row.unitType === "Theory & Practice") {
      if (row.competency === "Theory") {
        newRow.attainedTheory = row.totalAttained;
        newRow.maxTheory = row.totalMax;
      }
      if (row.competency === "Practice") {
        newRow.attainedPractice = row.totalAttained;
        newRow.maxPractice = row.totalMax;
      }
    }

    if (row.unitType === "Communicative I/O") {
      if (row.competency === "Listening") {
        newRow.attainedListening = row.totalAttained;
        newRow.maxListening = row.totalMax;
      }
      if (row.competency === "Reading") {
        newRow.attainedReading = row.totalAttained;
        newRow.maxReading = row.totalMax;
      }
      if (row.competency === "Speaking") {
        newRow.attainedSpeaking = row.totalAttained;
        newRow.maxSpeaking = row.totalMax;
      }
      if (row.competency === "Writing") {
        newRow.attainedWriting = row.totalAttained;
        newRow.maxWriting = row.totalMax;
      }
    }

    if (row.unitType === "Third Parameter") {
      if (row.competency === "Receptive") {
        newRow.attainedReceptive = row.totalAttained;
        newRow.maxReceptive = row.totalMax;
      }
      if (row.competency === "Productive") {
        newRow.attainedProductive = row.totalAttained;
        newRow.maxProductive = row.totalMax;
      }
      if (row.competency === "Acuity") {
        newRow.attainedAcuity = row.totalAttained;
        newRow.maxAcuity = row.totalMax;
      }
    }

    return newRow;
  });


  // Helper function to generate abbreviation
const abbreviateLabel = (label) => {
  if (!label) return "";
  return label
    .split(" ")
    .map(word => word[0]?.toUpperCase())
    .join("");
};



  return (
    <div className="overflow-x-auto border-1 border-gray-200 shadow-sm h-full">
      <table className="w-full table-auto text-sm text-left border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Master PP ID Callout</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Unit Name</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Unit ID</th>
            <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">Unit Type</th>


            {currentCompetencies.map((comp, idx) => (
              <React.Fragment key={idx}>
                <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{abbreviateLabel(comp.attained)}</th>
                <th className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{abbreviateLabel(comp.max)}</th>
              </React.Fragment>
            ))}

          </tr>
        </thead>
        <tbody>
          {transformedBlocks.map((row, index) => (
            <tr key={index}>
              <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.ppId}</td>
              <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.unitName}</td>
              <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.unitId}</td>
              <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">{row.unitType}</td>

              {currentCompetencies.map((comp, index) => (
                <React.Fragment key={index}>
                  <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">
                    {row[comp.attained] !== undefined && row[comp.attained] !== null
                      ? Number(row[comp.attained]).toFixed(2)
                      : ""}
                  </td>
                  <td className="whitespace-nowrap text-center border-1 border-gray-400 px-2 py-1">
                    {row[comp.max] !== undefined && row[comp.max] !== null
                      ? Number(row[comp.max]).toFixed(2)
                      : ""}
                  </td>
                </React.Fragment>
              ))}

            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MasterPpIdBinTable;