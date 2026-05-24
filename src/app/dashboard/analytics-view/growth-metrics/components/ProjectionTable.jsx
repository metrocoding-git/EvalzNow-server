"use client";
import { createProjection, getProjection, updateProjection, updateProjectionPoints } from "@/services/projectionService";
import React, { useState, useMemo, useEffect } from "react";


// This script is used to calculate the values in the Growth Projection table for the Tabulations of Candidate Analysis
//------------------------------------------------------------------------------------------------------
//spline 2nd derivative at x2
const calculateZ2 = (m1, m2, m3, x1, x2, x3, x4) => {
  let numerator =
    m3 * x2 +
    m2 * x3 -
    m3 * x3 +
    2 * m2 * x4 +
    2 * m1 * x2 -
    2 * m1 * x4 -
    3 * m2 * x2;
  let denominator = 4 * (x1 * x2 + x3 * x4 - x1 * x4) - Math.pow(x2 + x3, 2);
  let result = 6 * (numerator / denominator);
  return result;
};

//spline 2nd derivative at x3
const calculateZ3 = (m1, m2, m3, x1, x2, x3, x4) => {

  let numerator =
    m2 * x2 +
    m1 * x3 -
    m1 * x2 +
    2 * m2 * x1 +
    2 * m3 * x3 -
    2 * m3 * x1 -
    3 * m2 * x3;
  let denominator = 4 * (x1 * x2 + x3 * x4 - x1 * x4) - Math.pow(x2 + x3, 2);
  let result = 6 * (numerator / denominator);
  return result;
};

const calculateLinearExtrapolation = (m3, x, x4, y4) => {
  let result = m3 * (x - x4) + y4;
  return result;
};

const calculateC3 = (a3, b3, x, x3, x4) => {
  let result =
    a3 * Math.pow(x - x4, 2) * (x - x3) + b3 * (x - x4) * Math.pow(x - x3, 2);
  return result;
};

export function calculateProjectionValues(
  y1, //Growth differentials for ΔRRN/ΔPRN/ΔARN of selected performance points
  y2,
  y3,
  y4,
  x1, //Daycounts associated with selected performance points
  x2,
  x3,
  x4,
  dayCount //daycount target beyond performance point PP3 selection
) {

  let data = [];

  let m1 = (y2 - y1) / (x2 - x1); //piecewise linear slopes
  let m2 = (y3 - y2) / (x3 - x2);
  let m3 = (y4 - y3) / (x4 - x3);
  let z2 = calculateZ2(m1, m2, m3, x1, x2, x3, x4); //spline 2nd derivative at x2
  let z3 = calculateZ3(m1, m2, m3, x1, x2, x3, x4); //spline 2nd derivative at x3
  let a1 = z2 / (6 * (x1 - x2)); //cubic coefficients
  let a2 = (2 * z2 + z3) / (6 * (x2 - x3));
  let a3 = z3 / (3 * (x3 - x4));
  let b1 = (2 * z2) / (6 * (x2 - x1));
  let b2 = (2 * z3 + z2) / (6 * (x3 - x2));
  let b3 = z3 / (6 * (x4 - x3));
  let l3 = calculateLinearExtrapolation(m3, x3 + dayCount, x4, y4); //Final piecewise segment before course termination
  let c3 = calculateC3(a3, b3, x3 + dayCount, x3, x4); //Final cubic correction before course termination
  let s3 = l3 + c3; //natural spline before course termination

  // s3 is the overshoot value for ΔRRN/ΔPRN/ΔARN
  // l3 is the undershoot value for ΔRRN/ΔPRN/ΔARN

  data.push(
    parseFloat(l3), // numeric undershoot
    parseFloat(s3)  // numeric overshoot
  );
  return data;
  

  // return {
  //   l3,
  //   s3,
  // };
}

export default function ProjectionTable({ visible, onClose, unitId, candidateId, projectionData = [] }) {
  if (!visible) return null;

  const columns = [
    "Callout",
    "PP ID",
    "RRN",
    "PRN",
    "ARN",
    "IC",
    "ΔRRN",
    "ΔPRN",
    "ΔARN",
    "Day Count",
  ];

  const [loading, setLoading] = useState(false);
  const [existingSessionId, setExistingSessionId] = useState(null);

  const [rows, setRows] = useState([
    { Callout: "First PP Selection", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Second PP Selection", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Third PP Selection", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Projection Termination Point", PP_ID: "-", RRN: "-", PRN: "-", ARN: "-", IC: "-", ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Overshoot", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Undershoot", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Average", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Overshoot ", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Undershoot ", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
    { Callout: "Average ", PP_ID: 0, RRN: 0, PRN: 0, ARN: 0, IC: 0, ΔRRN: 0, ΔPRN: 0, ΔARN: 0, DayCount: 0 },
  ]);

  const safeNum = (val) => (isNaN(parseFloat(val)) ? 0 : parseFloat(val));

  const allPpIds = useMemo(
    () =>
      Array.from(new Set(projectionData.map((d) => Number(d.ppId))))
        .filter((id) => id > 0)
        .sort((a, b) => a - b),
    [projectionData]
  );

  const handlePPChange = (idx, value) => {
    const selectedData = projectionData.find((d) => Number(d.ppId) === Number(value));

    setRows((prev) => {
      const updated = prev.map((row, i) => {
        if (i === idx && selectedData) {
          return {
            ...row,
            PP_ID: Number(value),
            RRN: selectedData.RR ?? 0,
            PRN: selectedData.PR ?? 0,
            ARN: selectedData.AR ?? 0,
            IC: selectedData.IC ?? "",
            ΔRRN: selectedData["ΔRR"] ?? 0,
            ΔPRN: selectedData["ΔPR"] ?? 0,
            ΔARN: selectedData["ΔAR"] ?? 0,
            DayCount: selectedData.dayCount ?? 0,
          };
        }
        if (i === idx && Number(value) === 0) {
          return {
            ...row,
            PP_ID: 0,
            RRN: 0,
            PRN: 0,
            ARN: 0,
            IC: 0,
            ΔRRN: 0,
            ΔPRN: 0,
            ΔARN: 0,
            DayCount: 0,
          };
        }
        return row;
      });

      // If changing First PP, clear Second and Third if they are invalid
    if (idx === 0 && value > 0) {
      const firstPP = Number(value);
      const secondPP = Number(updated[1].PP_ID);
      const thirdPP = Number(updated[2].PP_ID);
      
      // If Second PP is less than or equal to First PP, clear it
      if (secondPP > 0 && secondPP <= firstPP) {
        updated[1] = {
          ...updated[1],
          PP_ID: 0,
          RRN: 0,
          PRN: 0,
          ARN: 0,
          IC: 0,
          ΔRRN: 0,
          ΔPRN: 0,
          ΔARN: 0,
          DayCount: 0,
        };
      }
      
      // If Third PP is less than or equal to First PP, clear it
      if (thirdPP > 0 && thirdPP <= firstPP) {
        updated[2] = {
          ...updated[2],
          PP_ID: 0,
          RRN: 0,
          PRN: 0,
          ARN: 0,
          IC: 0,
          ΔRRN: 0,
          ΔPRN: 0,
          ΔARN: 0,
          DayCount: 0,
        };
      }
    }

    // If changing Second PP, clear Third if it's invalid
    if (idx === 1 && value > 0) {
      const secondPP = Number(value);
      const thirdPP = Number(updated[2].PP_ID);
      
      // If Third PP is less than or equal to Second PP, clear it
      if (thirdPP > 0 && thirdPP <= secondPP) {
        updated[2] = {
          ...updated[2],
          PP_ID: 0,
          RRN: 0,
          PRN: 0,
          ARN: 0,
          IC: 0,
          ΔRRN: 0,
          ΔPRN: 0,
          ΔARN: 0,
          DayCount: 0,
        };
      }
    }

    // Rest of your existing projection calculation code...
    const third = updated[2];
    const terminationRowIndex = 3;
    updated[terminationRowIndex] = {
      ...updated[terminationRowIndex],
      PP_ID: "-",
      RRN: "-",
      PRN: "-",
      ARN: "-",
      IC: "-",
      ΔRRN: 0,
      ΔPRN: 0,
      ΔARN: 0,
      DayCount: (third.DayCount ?? 0) + 31,
    };

      const first = updated[0];
      const second = updated[1];
      const dayCount = 15;

      // 15-day projections (undershoot & overshoot)
      const [underRRN, overRRN] = calculateProjectionValues(
        first.ΔRRN, second.ΔRRN, third.ΔRRN, third.ΔRRN,
        first.DayCount, second.DayCount, third.DayCount, third.DayCount + dayCount,
        dayCount
      );
      const [underPRN, overPRN] = calculateProjectionValues(
        first.ΔPRN, second.ΔPRN, third.ΔPRN, third.ΔPRN,
        first.DayCount, second.DayCount, third.DayCount, third.DayCount + dayCount,
        dayCount
      );
      const [underARN, overARN] = calculateProjectionValues(
        first.ΔARN, second.ΔARN, third.ΔARN, third.ΔARN,
        first.DayCount, second.DayCount, third.DayCount, third.DayCount + dayCount,
        dayCount
      );

      // Update Overshoot (row 4)
      updated[4] = {
        ...updated[4],
        PP_ID: `${dayCount} days`,
        DayCount: third.DayCount + 15,
        ΔRRN: overRRN.toFixed(3),
        ΔPRN: overPRN.toFixed(3),
        ΔARN: overARN.toFixed(3),
        RRN: (safeNum(third.RRN) + safeNum(overRRN)).toFixed(3),
        PRN: (safeNum(third.PRN) + safeNum(overPRN)).toFixed(3),
        ARN: (safeNum(third.ARN) + safeNum(overARN)).toFixed(3),
      };

      // Update Undershoot (row 5)
      updated[5] = {
        ...updated[5],
        PP_ID: `${dayCount} days`,
        DayCount: third.DayCount + 15,
        ΔRRN: underRRN.toFixed(3),
        ΔPRN: underPRN.toFixed(3),
        ΔARN: underARN.toFixed(3),
        RRN: (safeNum(third.RRN) + safeNum(underRRN)).toFixed(3),
        PRN: (safeNum(third.PRN) + safeNum(underPRN)).toFixed(3),
        ARN: (safeNum(third.ARN) + safeNum(underARN)).toFixed(3),
      };

      // ------------- FIXED: 15-day Average (use mean of undershoot & overshoot) -------------
      // Δ averages
      const avgDeltaRRN_15 = ((parseFloat(overRRN) + parseFloat(underRRN)) / 2);
      const avgDeltaPRN_15 = ((parseFloat(overPRN) + parseFloat(underPRN)) / 2);
      const avgDeltaARN_15 = ((parseFloat(overARN) + parseFloat(underARN)) / 2);

      // RRN/PRN/ARN averages: mean of overshoot final and undershoot final
      const overshootRow15 = updated[4];
      const undershootRow15 = updated[5];

      const avgRRN_15 = (safeNum(overshootRow15.RRN) + safeNum(undershootRow15.RRN)) / 2;
      const avgPRN_15 = (safeNum(overshootRow15.PRN) + safeNum(undershootRow15.PRN)) / 2;
      const avgARN_15 = (safeNum(overshootRow15.ARN) + safeNum(undershootRow15.ARN)) / 2;

      updated[6] = {
        ...updated[6],
        PP_ID: `${dayCount} days`,
        DayCount: third.DayCount + 15,
        ΔRRN: avgDeltaRRN_15.toFixed(3),
        ΔPRN: avgDeltaPRN_15.toFixed(3),
        ΔARN: avgDeltaARN_15.toFixed(3),
        RRN: avgRRN_15.toFixed(3),
        PRN: avgPRN_15.toFixed(3),
        ARN: avgARN_15.toFixed(3),
      };

      // ---------------- 30-day projections ----------------
      const dayCount30 = 30;

      const [underRRN30, overRRN30] = calculateProjectionValues(
        first.ΔRRN, second.ΔRRN, third.ΔRRN, third.ΔRRN,
        first.DayCount, second.DayCount, third.DayCount, third.DayCount + dayCount30,
        dayCount30
      );
      const [underPRN30, overPRN30] = calculateProjectionValues(
        first.ΔPRN, second.ΔPRN, third.ΔPRN, third.ΔPRN,
        first.DayCount, second.DayCount, third.DayCount, third.DayCount + dayCount30,
        dayCount30
      );
      const [underARN30, overARN30] = calculateProjectionValues(
        first.ΔARN, second.ΔARN, third.ΔARN, third.ΔARN,
        first.DayCount, second.DayCount, third.DayCount, third.DayCount + dayCount30,
        dayCount30
      );

      // Prev overshoot/undershoot (15-day) used to compute final RRN/PRN/ARN for 30-day overshoot/undershoot
      const prevOvershoot15 = updated[4];
      const prevUndershoot15 = updated[5];

      // Overshoot (30 days) - row 7
      updated[7] = {
        ...updated[7],
        PP_ID: `${dayCount30} days`,
        DayCount: third.DayCount + 30,
        ΔRRN: overRRN30.toFixed(3),
        ΔPRN: overPRN30.toFixed(3),
        ΔARN: overARN30.toFixed(3),
        RRN: (safeNum(prevOvershoot15.RRN) + safeNum(overRRN30)).toFixed(3),
        PRN: (safeNum(prevOvershoot15.PRN) + safeNum(overPRN30)).toFixed(3),
        ARN: (safeNum(prevOvershoot15.ARN) + safeNum(overARN30)).toFixed(3),
      };

      // Undershoot (30 days) - row 8
      updated[8] = {
        ...updated[8],
        PP_ID: `${dayCount30} days`,
        DayCount: third.DayCount + 30,
        ΔRRN: underRRN30.toFixed(3),
        ΔPRN: underPRN30.toFixed(3),
        ΔARN: underARN30.toFixed(3),
        RRN: (safeNum(prevUndershoot15.RRN) + safeNum(underRRN30)).toFixed(3),
        PRN: (safeNum(prevUndershoot15.PRN) + safeNum(underPRN30)).toFixed(3),
        ARN: (safeNum(prevUndershoot15.ARN) + safeNum(underARN30)).toFixed(3),
      };

      // ---------------- FIXED: 30-day Average (mean of undershoot & overshoot) ----------------
      const avgDeltaRRN_30 = ((parseFloat(overRRN30) + parseFloat(underRRN30)) / 2);
      const avgDeltaPRN_30 = ((parseFloat(overPRN30) + parseFloat(underPRN30)) / 2);
      const avgDeltaARN_30 = ((parseFloat(overARN30) + parseFloat(underARN30)) / 2);

      const overshootRow30 = updated[7];
      const undershootRow30 = updated[8];

      const avgRRN_30 = (safeNum(overshootRow30.RRN) + safeNum(undershootRow30.RRN)) / 2;
      const avgPRN_30 = (safeNum(overshootRow30.PRN) + safeNum(undershootRow30.PRN)) / 2;
      const avgARN_30 = (safeNum(overshootRow30.ARN) + safeNum(undershootRow30.ARN)) / 2;

      updated[9] = {
        ...updated[9],
        PP_ID: `${dayCount30} days`,
        DayCount: third.DayCount + 30,
        ΔRRN: avgDeltaRRN_30.toFixed(3),
        ΔPRN: avgDeltaPRN_30.toFixed(3),
        ΔARN: avgDeltaARN_30.toFixed(3),
        RRN: avgRRN_30.toFixed(3),
        PRN: avgPRN_30.toFixed(3),
        ARN: avgARN_30.toFixed(3),
      };

      return updated;
    });
  };

  const validatePPSelection = (idx, newValue, currentRows) => {
    const firstPP = Number(currentRows[0].PP_ID);
    const secondPP = Number(currentRows[1].PP_ID);
    const thirdPP = Number(currentRows[2].PP_ID);
    
    const newPP = Number(newValue);
    
    if (newPP === 0) return true; // Allow clearing selection
    
    // First PP: Cannot be greater than or equal to Second or Third
    if (idx === 0) {
      if (secondPP > 0 && newPP >= secondPP) return false;
      if (thirdPP > 0 && newPP >= thirdPP) return false;
    }
    
    // Second PP: Must be greater than First and less than Third
    if (idx === 1) {
      if (firstPP > 0 && newPP <= firstPP) return false;
      if (thirdPP > 0 && newPP >= thirdPP) return false;
    }
    
    // Third PP: Must be greater than First and Second
    if (idx === 2) {
      if (firstPP > 0 && newPP <= firstPP) return false;
      if (secondPP > 0 && newPP <= secondPP) return false;
    }
    
    return true;
  };

  const availableByIndex = useMemo(() => {
    const firstPP = Number(rows[0].PP_ID);
    const secondPP = Number(rows[1].PP_ID);
    const thirdPP = Number(rows[2].PP_ID);
  
    return rows.map((row, idx) => {
      if (idx >= 3) return [];
  
      const availablePpIds = allPpIds.filter(id => {
        // First PP Selection: Show ppIds less than both Second and Third (if selected)
        if (idx === 0) {
          if (secondPP > 0 && id >= secondPP) return false;
          if (thirdPP > 0 && id >= thirdPP) return false;
          return true;
        }
        
        // Second PP Selection: Show ppIds greater than First AND less than Third
        if (idx === 1) {
          if (firstPP > 0 && id <= firstPP) return false;
          if (thirdPP > 0 && id >= thirdPP) return false;
          return true;
        }
        
        // Third PP Selection: Show ppIds greater than Second (if selected), otherwise greater than First
        if (idx === 2) {
          if (secondPP > 0) {
            return id > secondPP;
          }
          if (firstPP > 0) {
            return id > firstPP;
          }
          return true;
        }
        
        return true;
      });
  
      return availablePpIds;
    });
  }, [rows, allPpIds]);
  useEffect(() => {
    const fetchProjectionData = async () => {
      try {
        setLoading(true);
        const response = await getProjection(unitId, candidateId);
  
        if (response && Array.isArray(response) && response.length > 0) {
          const latestSession = response[0]; // use most recent session
          const savedPoints = latestSession.points || [];
  
          setExistingSessionId(latestSession.id);

          if (savedPoints.length > 0) {
            setRows((prevRows) =>
              prevRows.map((r, idx) => {
                const matched = savedPoints[idx];
                if (matched) {
                  return {
                    ...r,
                    PP_ID: matched.ppId ?? r.PP_ID,
                    Callout: matched.callout ?? r.Callout,
                    RRN: parseFloat(matched.RRN ?? r.RRN),
                    PRN: parseFloat(matched.PRN ?? r.PRN),
                    ARN: parseFloat(matched.ARN ?? r.ARN),
                    IC: matched.IC ?? r.IC,
                    ΔRRN: parseFloat(matched.deltaRRN ?? r["ΔRRN"]),
                    ΔPRN: parseFloat(matched.deltaPRN ?? r["ΔPRN"]),
                    ΔARN: parseFloat(matched.deltaARN ?? r["ΔARN"]),
                    DayCount: parseFloat(matched.dayCount ?? r.DayCount),
                  };
                }
                return r;
              })
            );
          }
        } else {
          setExistingSessionId(null);
          console.log("ℹ️ No previous projection found — starting new.");
        }
      } catch (error) {
        console.error("❌ Failed to fetch projection:", error);
      } finally {
        setLoading(false);
      }
    };
  
    if (unitId && candidateId) {
      fetchProjectionData();
    }
  }, [unitId, candidateId]);



  


  // ✅ Create or Update Projection API call
const handleSubmit = async () => {
  try {
    setLoading(true);

    // Filter out only valid points (ignore rows with "-")
    const points = rows
      .filter((r) => typeof r.DayCount === "number" && r.DayCount > 0)
      .map((r, index) => ({
        ppId: String(r.PP_ID || `AUTO-${index + 1}`),
        callout: r.Callout,
        RRN: safeNum(r.RRN),
        PRN: safeNum(r.PRN),
        ARN: safeNum(r.ARN),
        IC: r.IC || "",
        deltaRRN: safeNum(r["ΔRRN"]),
        deltaPRN: safeNum(r["ΔPRN"]),
        deltaARN: safeNum(r["ΔARN"]),
        dayCount: r.DayCount,
      }));

    const payload = {
      unitId,
      candidateId,
      points,
    };

    console.log("📤 Sending payload:", payload);

    let response;

    // ✅ If session exists, UPDATE; otherwise CREATE
    if (existingSessionId) {
      console.log(`🔄 Updating existing session ID: ${existingSessionId}`);
      response = await updateProjection(existingSessionId, payload);
      alert("✅ Projection updated successfully!");
    } else {
      console.log("🆕 Creating new projection session");
      response = await createProjection(payload);
      alert("✅ Projection created successfully!");
      
      // Store the new session ID for future updates
      if (response?.session?.id) {
        setExistingSessionId(response.session.id);
      }
    }

    console.log("✅ Projection API response:", response);

    onClose(); // close modal
  } catch (error) {
    console.error("❌ Error submitting projection:", error);
    alert("Failed to save projection session.");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-11/12 max-w-5xl p-4 overflow-auto max-h-[90vh]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold">Projection Table</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">
            X
          </button>
        </div>

        <div className="w-full overflow-auto border border-gray-200 rounded-lg">
          <table className="w-full whitespace-nowrap text-center text-xs divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-2 py-1 border border-gray-300 font-semibold text-gray-700"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => {
                const availablePpIds = idx < 3 ? availableByIndex[idx] : [];

                return (
                  <tr key={idx} className="hover:bg-gray-50 transition-colors">
                    <td className="px-2 py-1 border border-gray-300">{row.Callout}</td>
                    <td className="px-2 py-1 border border-gray-300">
                      {idx < 3 ? (
                        <select
                          className="border rounded px-1 py-0.5 w-full text-xs text-center"
                          value={row.PP_ID}
                          onChange={(e) => handlePPChange(idx, Number(e.target.value))}
                        >
                          <option value={0}>Select</option>
                          {availablePpIds.map((id) => (
                            <option key={id} value={id}>
                              {id}
                            </option>
                          ))}
                        </select>
                      ) : (
                        row.PP_ID
                      )}
                    </td>

                    <td className="px-2 py-1 border border-gray-300">{row.RRN}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.PRN}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.ARN}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.IC}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.ΔRRN}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.ΔPRN}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.ΔARN}</td>
                    <td className="px-2 py-1 border border-gray-300">{row.DayCount}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end items-center my-2">
        
          <button onClick={handleSubmit} className="text-gray-700 hover:bg-gray-300 bg-gray-200 p-1 rounded">
            Submit 
          </button>
        </div>
      </div>
    </div>
  );
}