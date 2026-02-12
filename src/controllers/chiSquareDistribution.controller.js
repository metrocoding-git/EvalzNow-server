const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getUnitById } = require('./unit.controller');
/*
  chi_square_4.js
  Name: Chi-Square Distribution (k = 4)
  Purpose: Compute and plot Chi-Square PDF with α=5% critical value.
  Formula: f(x) = 1/(2^{k/2} Γ(k/2)) x^{k/2-1} e^{-x/2}
  Vertical line: Xc (α = 0.05) right-tail critical value
  YouTube ref: Chi-square critical regions demonstration

	Must determine the average of the selected candidate data first.

  observed and expected values should have the same length
  observed value = PP ID score
  observed data of selected candidates = [Avg RR, Avg PR, Avg ∆RR, Avg ∆PR];
  expected Value = Threshold
  expected data of selected candidates = [Thres RR, Thres PR, Thres ∆RR, Thres ∆PR];
  Need Vertical line: at Xc and at X^2 values

*/

// Quick test (uncomment to run in console):
// const observed = [25, 17, 19, 21];
// const expected = [20.5, 20.5, 20.5, 20.5];
// const result = calculateDistribution({ observed, expected, step: 0.1 });
// console.log('[chi-square k=4] df:', result.params.df, 'Xc:', result.params.xc.toFixed(4), 'X^2:', result.params.x2Statistic?.toFixed(4));
// console.table(result.table.slice(0, 10));

// Standalone helpers for Chi-Square
function generateRange(start, end, step = 1) {
  const arr = [];
  const nSteps = Math.floor((end - start) / step);
  for (let i = 0; i <= nSteps; i++) arr.push(Number((start + i * step).toFixed(10)));
  if (arr.length === 0 || arr[arr.length - 1] < end) arr.push(Number(end.toFixed(10)));
  return arr;
}
function gamma(z) {
  const g = 7;
  const p = [0.99999999999980993,676.5203681218851,-1259.1392167224028,771.32342877765313,-176.61502916214059,12.507343278686905,-0.13857109526572012,9.9843695780195716e-6,1.5056327351493116e-7];
  if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  z -= 1; let x = p[0];
  for (let i = 1; i < p.length; i++) x += p[i] / (z + i);
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}
function chiSquarePdf(x, k) {
  if (x <= 0) return 0;
  const c = 1 / (Math.pow(2, k / 2) * gamma(k / 2));
  return c * Math.pow(x, k / 2 - 1) * Math.exp(-x / 2);
}
function integrateSimpson(f, a, b, n = 1024) {
  if (n % 2 !== 0) n += 1;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    s += f(x) * (i % 2 === 0 ? 2 : 4);
  }
  return (h / 3) * s;
}
function inverseCdfByBisection(pdf, lower, upper, target, tol = 1e-5, maxIter = 80) {
  let lo = lower, hi = upper, mid = 0;
  const cdf = (x) => integrateSimpson(pdf, lower, x);
  for (let i = 0; i < maxIter; i++) {
    mid = (lo + hi) / 2;
    const cm = cdf(mid);
    if (Math.abs(cm - target) < tol) return mid;
    if (cm < target) lo = mid; else hi = mid;
  }
  return mid;
}
  // No plotting – tabular only
  function calculateDistributionCICO_TP(params = {}) {
    const k = 4;
    const step = params.step ?? 0.1;
    const end = k + 6 * Math.sqrt(2 * k);
    const x = generateRange(0, end, step);
    const y = x.map((xi) => chiSquarePdf(xi, k));
  
    // Right-tail alpha=5% → CDF = 0.95
    const pdf = (v) => chiSquarePdf(v, k);
    const xc = inverseCdfByBisection(pdf, 0, end, 0.95);
  
    // If observed/expected provided, compute X^2 statistic
    let x2Statistic = null;
    let df = k - 1;
    if (Array.isArray(params.observed) && Array.isArray(params.expected) && params.observed.length === params.expected.length) {
      const n = params.observed.length;
      df = n - 1;
      x2Statistic = 0;
      for (let i = 0; i < n; i++) {
        const o = params.observed[i];
        const e = params.expected[i];
        if (e > 0) x2Statistic += ((o - e) * (o - e)) / e;
      }
    }
  
    const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));
    const mean = k;
    const variance = 2 * k;
  
    return {
      x,
      y,
      mean,
      variance,
      params: { k, step, xc, x2Statistic, df },
      table,
      name: 'Chi-Square (k=4)',
    };
  }

  function calculateDistributionTPRM(params = {}) {
    const k = 6;
    const step = params.step ?? 0.1;
    const end = k + 6 * Math.sqrt(2 * k);
    const x = generateRange(0, end, step);
    const y = x.map((xi) => chiSquarePdf(xi, k));
  
    // Right-tail alpha=5% → CDF = 0.95
    const pdf = (v) => chiSquarePdf(v, k);
    const xc = inverseCdfByBisection(pdf, 0, end, 0.95);
  
    // If observed/expected provided, compute X^2 statistic
    let x2Statistic = null;
    let df = k - 1;
    if (Array.isArray(params.observed) && Array.isArray(params.expected) && params.observed.length === params.expected.length) {
      const n = params.observed.length;
      df = n - 1;
      x2Statistic = 0;
      for (let i = 0; i < n; i++) {
        const o = params.observed[i];
        const e = params.expected[i];
        if (e > 0) x2Statistic += ((o - e) * (o - e)) / e;
      }
    }
  
    const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));
    const mean = k;
    const variance = 2 * k;
  
    return {
      x,
      y,
      mean,
      variance,
      params: { k, step, xc, x2Statistic, df },
      table,
      name: 'Chi-Square (k=6)',
    };
  }

  
  
// exports.getChiDistributionData = async (req, res) => {
//     try {
//         const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;

//         if (!unitId || !candidate_id) {
//             return res.status(400).json({ message: "unitId and candidate_id are required" });
//         }

//         // Step 1: Get unit data to fetch threshold values
//         let unitData;
//         try {
//             const unitReq = { params: { id: unitId } };
//             const unitRes = {
//                 status: function(code) {
//                     this.statusCode = code;
//                     return this;
//                 },
//                 json: function(data) {
//                     unitData = data;
//                     return this;
//                 }
//             };
//             await getUnitById(unitReq, unitRes);
            
//             if (!unitData) {
//                 return res.status(404).json({ message: "Unit not found" });
//             }
//         } catch (unitError) {
//             console.error("Error fetching unit data:", unitError);
//             return res.status(500).json({ message: "Error fetching unit threshold data" });
//         }

//         // Step 2: Get competency data
//         const mockReq = {
//             query: {
//                 unitId,
//                 candidate_id,
//                 ppIdFrom: ppIdFrom || null,
//                 ppIdTo: ppIdTo || null,
//                 criticalRefDateFrom: criticalRefDateFrom || null,
//                 criticalRefDateTo: criticalRefDateTo || null
//             }
//         };

//         let competencyData = null;

//         const mockRes = {
//             status: function(code) {
//                 this.statusCode = code;
//                 return this;
//             },
//             json: function(data) {
//                 competencyData = data;
//                 return this;
//             }
//         };

//         await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
        
//         if (!competencyData || !competencyData.results) {
//             return res.status(404).json({ message: "No competency data found" });
//         }

//         const allResults = competencyData.results;

//         // Determine unit type from unit data (more reliable than competency data)
//         const unitType = unitData.unitType;
        
//         if (!unitType) {
//             return res.status(400).json({ message: "No unitType found in unit data" });
//         }

//         // Helper function to calculate average of valid numeric values
//         const calculateAverage = (values) => {
//             const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
//             if (validValues.length === 0) return null;
//             return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
//         };

//         // Collect values from the actual field names in your response
//         const collect = (key) =>
//             allResults
//                 .map(r => {
//                     const value = r[key];
//                     // Handle null/undefined values and convert to number
//                     return value !== null && value !== undefined ? Number(value) : null;
//                 })
//                 .filter(v => v !== null && !isNaN(v));

//         // Extract arrays using the correct field names
//         const rrArray = collect("RRN");
//         const prArray = collect("PRN");
//         const arArray = collect("ARN");
//         const deltaRRArray = collect("deltaRRN");
//         const deltaPRArray = collect("deltaPRN");
//         const deltaARArray = collect("deltaARN");

//         console.log("Extracted values - RR:", rrArray, "PR:", prArray, "AR:", arArray, "deltaRR:", deltaRRArray, "deltaPR:", deltaPRArray, "deltaAR:", deltaARArray);

//         // Calculate averages for observed values
//         const avgRR = calculateAverage(rrArray);
//         const avgPR = calculateAverage(prArray);
//         const avgAR = calculateAverage(arArray);
//         const avgDeltaRR = calculateAverage(deltaRRArray);
//         const avgDeltaPR = calculateAverage(deltaPRArray);
//         const avgDeltaAR = calculateAverage(deltaARArray);

//         console.log("Averages - RR:", avgRR, "PR:", avgPR, "AR:", avgAR, "deltaRR:", avgDeltaRR, "deltaPR:", avgDeltaPR, "deltaAR:", avgDeltaAR);
        
//         let observed = [];
//         let expected = [];
//         let distributionFunction = null;
//         let distributionName = '';

//         // Get threshold values from unit data
//         const thresRR = 0; // As per requirement, set to 0
//         const thresPR = 0; // As per requirement, set to 0
//         const thresAR = 0; // As per requirement, set to 0
//         const thresDeltaRR = unitData.ΔRRN ? Number(unitData.ΔRRN) : 0;
//         const thresDeltaPR = unitData.ΔPRN ? Number(unitData.ΔPRN) : 0;
//         const thresDeltaAR = unitData.ΔARN ? Number(unitData.ΔARN) : 0;

//         if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
//             // For CICO_TP: Use RR, PR, deltaRR, deltaPR
//             observed = [avgRR, avgPR, avgDeltaRR, avgDeltaPR].filter(val => val !== null);
//             expected = [thresRR, thresPR, thresDeltaRR, thresDeltaPR].slice(0, observed.length);
//             distributionFunction = calculateDistributionCICO_TP;
//             distributionName = 'Chi-Square (k=4) - CICO/TP';
//         } else if (unitType === "Third Parameter") {
//             // For TPRM: Use RR, PR, AR, deltaRR, deltaPR, deltaAR
//             observed = [avgRR, avgPR, avgAR, avgDeltaRR, avgDeltaPR, avgDeltaAR].filter(val => val !== null);
//             expected = [thresRR, thresPR, thresAR, thresDeltaRR, thresDeltaPR, thresDeltaAR].slice(0, observed.length);
//             distributionFunction = calculateDistributionTPRM;
//             distributionName = 'Chi-Square (k=6) - TPRM';
//         } else {
//             return res.status(400).json({ message: `Unknown unit type: ${unitType}` });
//         }

//         // Ensure observed and expected arrays have the same length
//         if (observed.length !== expected.length) {
//             // Trim expected to match observed length
//             expected = expected.slice(0, observed.length);
//         }

//         // Calculate the distribution
//         const distribution = distributionFunction({
//             observed,
//             expected,
//             step: 0.1
//         });

//         // Prepare response
//         const response = {
//             unitType,
//             unitThresholds: {
//                 RR: thresRR,
//                 PR: thresPR,
//                 AR: thresAR,
//                 deltaRR: thresDeltaRR,
//                 deltaPR: thresDeltaPR,
//                 deltaAR: thresDeltaAR
//             },
//             distribution: {
//                 name: distributionName,
//                 table: distribution.table,
//                 parameters: distribution.params,
//                 mean: distribution.mean,
//                 variance: distribution.variance
//             },
//             averages: {
//                 RR: avgRR,
//                 PR: avgPR,
//                 AR: avgAR,
//                 deltaRR: avgDeltaRR,
//                 deltaPR: avgDeltaPR,
//                 deltaAR: avgDeltaAR
//             },
//             observedValues: observed,
//             expectedValues: expected,
//             sourceData: {
//                 counts: {
//                     totalResults: allResults.length,
//                     RR: rrArray.length,
//                     PR: prArray.length,
//                     AR: arArray.length,
//                     deltaRR: deltaRRArray.length,
//                     deltaPR: deltaPRArray.length,
//                     deltaAR: deltaARArray.length
//                 },
//                 extractedValues: {
//                     RR: rrArray,
//                     PR: prArray,
//                     AR: arArray,
//                     deltaRR: deltaRRArray,
//                     deltaPR: deltaPRArray,
//                     deltaAR: deltaARArray
//                 }
//             }
//         };

//         res.status(200).json(response);

//     } catch(error) {
//         console.error("Error in getChiDistributionData:", error);
//         res.status(500).json({ 
//             message: "Error computing chi-square distribution", 
//             error: error.message 
//         });
//     }
// };


exports.getChiDistributionData = async (req, res) => {
  try {
      // ✅ Updated: Receive data via req.body like getNormalDistributionData
      const { candidatePpList, unitId } = req.body;

      if (!unitId || !Array.isArray(candidatePpList)) {
          return res.status(400).json({ 
              message: "unitId and candidatePpList are required" 
          });
      }

      // ✅ Extract candidate IDs from the list
      const candidateIds = candidatePpList
          .map(x => x.candidateId)
          .join(",");

      // ✅ Check if we need PP filtering (same logic as normal distribution)
      const hasPpFilter = candidatePpList.some(
          x => x.ppId !== null && x.ppId !== undefined && x.ppId !== ""
      );

      // ✅ Build query parameters for competency data fetch
      let queryParams = {
          unitId,
          candidate_id: candidateIds
      };

      // ✅ Add date filters if provided (preserving existing functionality)
      // if (dateFilter) {
      //     if (dateFilter.criticalRefDateFrom) {
      //         queryParams.criticalRefDateFrom = dateFilter.criticalRefDateFrom;
      //     }
      //     if (dateFilter.criticalRefDateTo) {
      //         queryParams.criticalRefDateTo = dateFilter.criticalRefDateTo;
      //     }
      //     if (dateFilter.ppIdFrom) {
      //         queryParams.ppIdFrom = dateFilter.ppIdFrom;
      //     }
      //     if (dateFilter.ppIdTo) {
      //         queryParams.ppIdTo = dateFilter.ppIdTo;
      //     }
      // }

      // Step 1: Get unit data to fetch threshold values
      let unitData;
      try {
          const unitReq = { params: { id: unitId } };
          const unitRes = {
              status: function(code) {
                  this.statusCode = code;
                  return this;
              },
              json: function(data) {
                  unitData = data;
                  return this;
              }
          };
          await getUnitById(unitReq, unitRes);
          
          if (!unitData) {
              return res.status(404).json({ message: "Unit not found" });
          }
      } catch (unitError) {
          console.error("Error fetching unit data:", unitError);
          return res.status(500).json({ message: "Error fetching unit threshold data" });
      }

      // Step 2: Get competency data
      const mockReq = {
          query: queryParams
      };

      let competencyData = null;

      const mockRes = {
          status: function(code) {
              this.statusCode = code;
              return this;
          },
          json: function(data) {
              competencyData = data;
              return this;
          }
      };

      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

      const allResults = competencyData.results || [];
      const allAverages = competencyData.averages || [];
      
      if (!competencyData || !competencyData.results) {
          return res.status(404).json({ message: "No competency data found" });
      }

      const sourceRows = [];

    candidatePpList.forEach(({ candidateId, ppId }) => {
      if (ppId !== null && ppId !== undefined && ppId !== "") {
        // Fetch specific PP result for this candidate
        const ppResult = allResults.find(
          r => r.candidateId === String(candidateId) && r.ppId === ppId
        );
        if (ppResult) {
          sourceRows.push(ppResult);
        }
      } else {
        // Fetch average for this candidate
        const avgResult = allAverages.find(
          r => r.candidateId === String(candidateId)
        );
        if (avgResult) {
          sourceRows.push(avgResult);
        }
      }
    });

    console.log("Source rows selected:", sourceRows.length);
    console.log("Details:", sourceRows.map(r => ({ 
      candidateId: r.candidateId, 
      ppId: r.ppId 
    })));

    // --- Safe collector ---
    // const collect = (k) =>
    //   sourceRows
    //     .map(r => {
    //       const v = r[k];
    //       return v !== null && v !== undefined ? Number(v) : null;
    //     })
    //     .filter(v => v !== null && !isNaN(v));

      // ✅ Determine unit type from unit data
      const unitType = unitData.unitType;
      
      if (!unitType) {
          return res.status(400).json({ message: "No unitType found in unit data" });
      }

      // ✅ Helper function to calculate average of valid numeric values
      const calculateAverage = (values) => {
          const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
          if (validValues.length === 0) return null;
          return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
      };

      // ✅ Safe collector function (same as normal distribution)
      const collect = (key) =>
          sourceRows
              .map(r => {
                  const value = r[key];
                  return value !== null && value !== undefined ? Number(value) : null;
              })
              .filter(v => v !== null && !isNaN(v));

      // ✅ Extract arrays using the correct field names
      const rrArray = collect("RRN");
      const prArray = collect("PRN");
      const arArray = collect("ARN");
      const deltaRRArray = collect("deltaRRN");
      const deltaPRArray = collect("deltaPRN");
      const deltaARArray = collect("deltaARN");

      console.log("Source rows count:", sourceRows.length);
      console.log("Extracted values - RR:", rrArray, "PR:", prArray, "AR:", arArray);
      console.log("Extracted values - deltaRRN:", deltaRRArray, "deltaPRN:", deltaPRArray, "deltaARN:", deltaARArray);

      // ✅ Calculate averages for observed values
      const avgRR = calculateAverage(rrArray);
      const avgPR = calculateAverage(prArray);
      const avgAR = calculateAverage(arArray);
      const avgDeltaRR = calculateAverage(deltaRRArray);
      const avgDeltaPR = calculateAverage(deltaPRArray);
      const avgDeltaAR = calculateAverage(deltaARArray);

      console.log("Averages - RR:", avgRR, "PR:", avgPR, "AR:", avgAR);
      console.log("Averages - deltaRRN:", avgDeltaRR, "deltaPRN:", avgDeltaPR, "deltaARN:", avgDeltaAR);
      
      let observed = [];
      let expected = [];
      let distributionFunction = null;
      let distributionName = '';

      // ✅ Get threshold values from unit data
      const thresRR = 0; // As per requirement, set to 0
      const thresPR = 0; // As per requirement, set to 0
      const thresAR = 0; // As per requirement, set to 0
      const thresDeltaRR = unitData.ΔRRN ? Number(unitData.ΔRRN) : 0;
      const thresDeltaPR = unitData.ΔPRN ? Number(unitData.ΔPRN) : 0;
      const thresDeltaAR = unitData.ΔARN ? Number(unitData.ΔARN) : 0;

      // console.log("Averages - RR:", avgRR, "PR:", avgPR, "AR:", avgAR);
      console.log("Threshold - deltaRRN:", thresDeltaRR, "deltaPRN:", thresDeltaPR, "deltaARN:", thresDeltaAR);

      // ✅ Apply unit-type specific logic
      if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
          // For CICO_TP: Use RR, PR, deltaRR, deltaPR
          observed = [avgRR, avgPR, avgDeltaRR, avgDeltaPR].filter(val => val !== null);
          expected = [thresRR, thresPR, thresDeltaRR, thresDeltaPR].slice(0, observed.length);
          distributionFunction = calculateDistributionCICO_TP;
          distributionName = 'Chi-Square (k=4) - CICO/TP';
      } else if (unitType === "Third Parameter") {
          // For TPRM: Use RR, PR, AR, deltaRR, deltaPR, deltaAR
          observed = [avgRR, avgPR, avgAR, avgDeltaRR, avgDeltaPR, avgDeltaAR].filter(val => val !== null);
          expected = [thresRR, thresPR, thresAR, thresDeltaRR, thresDeltaPR, thresDeltaAR].slice(0, observed.length);
          distributionFunction = calculateDistributionTPRM;
          distributionName = 'Chi-Square (k=6) - TPRM';
      } else {
          return res.status(400).json({ message: `Unknown unit type: ${unitType}` });
      }

      // ✅ Ensure we have data for chi-square calculation
      if (observed.length === 0) {
          return res.status(400).json({ 
              message: "No valid data available for chi-square calculation" 
          });
      }

      // ✅ Ensure observed and expected arrays have the same length
      if (observed.length !== expected.length) {
          expected = expected.slice(0, observed.length);
      }

      // ✅ Calculate the chi-square distribution
      const distribution = distributionFunction({
          observed,
          expected,
          step: 0.1
      });

      // ✅ Prepare response
      const response = {
          mode: hasPpFilter ? "PP_LEVEL" : "CANDIDATE_AVERAGE",
          unitType,
          unitThresholds: {
              RR: thresRR,
              PR: thresPR,
              AR: thresAR,
              deltaRR: thresDeltaRR,
              deltaPR: thresDeltaPR,
              deltaAR: thresDeltaAR
          },
          distribution: {
              name: distributionName,
              table: distribution.table,
              parameters: distribution.params,
              mean: distribution.mean,
              variance: distribution.variance
          },
          averages: {
              RR: avgRR,
              PR: avgPR,
              AR: avgAR,
              deltaRR: avgDeltaRR,
              deltaPR: avgDeltaPR,
              deltaAR: avgDeltaAR
          },
          observedValues: observed,
          expectedValues: expected,
          sourceData: {
              counts: {
                  totalResults: sourceRows.length,
                  RR: rrArray.length,
                  PR: prArray.length,
                  AR: arArray.length,
                  deltaRR: deltaRRArray.length,
                  deltaPR: deltaPRArray.length,
                  deltaAR: deltaARArray.length
              },
              filtering: {
                  ppFilterApplied: hasPpFilter,
                  // dateFilterApplied: !!dateFilter
              }
          }
      };

      res.status(200).json(response);

  } catch(error) {
      console.error("Error in getChiDistributionData:", error);
      res.status(500).json({ 
          message: "Error computing chi-square distribution", 
          error: error.message 
      });
  }
};
  

  
  
  