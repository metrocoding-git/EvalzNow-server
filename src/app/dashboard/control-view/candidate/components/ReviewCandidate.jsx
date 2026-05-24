import { getUnitByCandidateId } from "@/services/unitRosterService";
import React, { useEffect, useState } from "react";

export default function ReviewCandidate({ candidate }) {
  if (!candidate) {
    return (
      <div className="p-4 text-gray-600">
        No candidate selected for review.
      </div>
    );
  }

  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);


   // Fetch all units by candidate ID
   useEffect(() => {
    const fetchUnitByCandidatesId = async () => {
      try {
        setLoading(true);
        const data = await getUnitByCandidateId(candidate.id);

        console.log("units", data);
        // Ensure it's an array, otherwise fallback
        if (Array.isArray(data)) {
          setUnits(data);
        } else {
          setUnits([]);
        }
      } catch (err) {
        console.error("Failed to fetch candidates:", err);
        setError("Failed to load units. Showing mock data instead.");
      } finally {
        setLoading(false);
      }
    };

    fetchUnitByCandidatesId();
  }, [candidate.id]);


  // Mock unit data (simulate DB response)
  const mockUnits = [
    { id: "U001", name: "Unit Alpha", status: "Active" },
    { id: "U002", name: "Unit Beta", status: "Inactive" },
    { id: "U003", name: "Unit Gamma", status: "Active" },
  ];

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">
      Review: {candidate.lastName?.trim()} {candidate.firstName}{" "}
      {candidate.candidateId}
      </h2>

      <div className="border-t border-gray-200 pt-2">
        <h3 className="text-md font-medium text-gray-800 mb-2">
          Connected Units
        </h3>
        <ul className="space-y-2">

          {units.length === 0 && !loading && (
            <li className="text-gray-500">No units found.</li>
          )}

          
          {units.map((unit) => (
            <li
              key={unit.id}
              className="p-3 bg-gray-100 border border-gray-300 shadow-sm"
            >
              <div className="text-sm text-gray-600">
                Unit ID: {unit.unitId}
              </div>
              <div className="font-semibold">{unit.unitName}</div>

              <div className="text-sm text-gray-600">Status: {unit.status}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
