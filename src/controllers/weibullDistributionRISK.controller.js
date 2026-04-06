const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
/*
  weibull_risk.js
  Name: Weibull Hazard (Risk) Function
  Purpose: Plot hazard h(t) = f(t) / R(t) = (β/η) (t/η)^{β-1}

	beta (shape parameter) -- user can specify any number, XX.XX > 0
    eta (scale parameter) -- this is the average of the data
	Need a vertical line at the eta value and at 0.700
	
//	Weibull Distribution for RR of all selected candidates in the unit
//	Weibull Distribution for PR of all selected candidates in the unit
//	Weibull Distribution for AR of all selected candidates in the unit
//	Weibull Distribution for XEQ of all selected candidates in the unit
//	Weibull Distribution for ∆GEQ of all selected candidates in the unit
//	Please plot Hazard Risk Function (HRF)
//	For HRF, X axis = t and Y axis = h
*/

// Quick test (uncomment to run in console):
// const sample = [2.5, 1.2, 0.3, 0.74, 0.56, 0.9, 0.105, 0.115, 0.1];
// const result = calculateDistribution({ data: sample, beta: 1.5, step: 0.05, end: 400 });
// console.log('[weibull hazard] beta:', result.params.beta, 'eta:', result.params.eta);
// console.table(result.table.slice(0, 10));

// Standalone helpers for Weibull Hazard
function generateRange(start, end, step = 1) {
  const arr = [];
  const nSteps = Math.floor((end - start) / step);
  for (let i = 0; i <= nSteps; i++) arr.push(Number((start + i * step).toFixed(10)));
  if (arr.length === 0 || arr[arr.length - 1] < end) arr.push(Number(end.toFixed(10)));
  return arr;
}
function meanFn(arr) {
  if (!arr || arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function weibullPdf(t, beta, eta) {
  if (t < 0) return 0;
  const z = Math.pow(t / eta, beta - 1);
  return (beta / eta) * z * Math.exp(-Math.pow(t / eta, beta));
}
function weibullReliability(t, beta, eta) {
  if (t < 0) return 1;
  return Math.exp(-Math.pow(t / eta, beta));
}
function weibullHazard(t, beta, eta) {
  const r = weibullReliability(t, beta, eta);
  if (r === 0) return 0;
  return weibullPdf(t, beta, eta) / r;
}

function calculateDistribution(params = {}) {
  const beta = params.beta ?? 1.5;
  let eta = params.eta;
  if (!eta && Array.isArray(params.data) && params.data.length) {
    eta = meanFn(params.data);
  }
  eta = eta ?? (params.meanValue ?? 100);
  const step = params.step ?? (eta / 100);
  const end = params.end ?? (4 * eta);
  const x = generateRange(0, end, step);
  const y = x.map((t) => weibullHazard(t, beta, eta));
  const table = x.map((t, i) => ({ t: parseFloat(t.toFixed(4)), h: parseFloat(y[i].toFixed(4)) }));
  return { x, y, mean: null, variance: null, params: { beta, eta, step }, table, name: 'Weibull Hazard' };
}
  
  
   // Helper function to extract specific field values from results
function extractFieldValues(results, fieldName) {
    return results
      .map(r => {
        const value = r[fieldName];
        // Convert to number if it's not null/undefined
        return value !== null && value !== undefined ? Number(value) : null;
      })
      .filter(v => v !== null && !isNaN(v)); // Remove null/undefined and NaN values
  }
  
  exports.getWeibullRiskDistributionData = async (req, res) => {
    try {
        // ✅ Updated: Receive data via req.body like getWeibullPDFDistributionData
        const { candidatePpList, unitId, beta } = req.body;

        if (!unitId || !Array.isArray(candidatePpList)) {
            return res.status(400).json({
                message: "unitId and candidatePpList required"
            });
        }

        // ✅ Extract candidate IDs from the list
        const candidateIds = candidatePpList
            .map(x => x.candidateId)
            .join(",");

        // ✅ Check if we need PP filtering (same logic as Weibull PDF)
        const hasPpFilter = candidatePpList.some(
            x => x.ppId !== null && x.ppId !== undefined && x.ppId !== ""
        );

        // ✅ Build query parameters for competency data fetch
        const queryParams = {
            unitId,
            candidate_id: candidateIds
        };

        // Step 1: Get competency data
        const mockReq = {
            query: queryParams
        };

        let competencyData = null;

        const mockRes = {
            status(code) {
                this.statusCode = code;
                return this;
            },
            json(data) {
                competencyData = data;
                return this;
            }
        };

        await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

        const allResults = competencyData.results || [];
        const allAverages = competencyData.averages || [];

        // Process each candidate individually
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

        // ✅ Safe collector function (same as Weibull PDF)
        const collect = (k) =>
            sourceRows
                .map(r => {
                    const v = r[k];
                    return v !== null && v !== undefined ? Number(v) : null;
                })
                .filter(v => v !== null && !isNaN(v));

        // ✅ BUILD ARRAYS for Weibull Risk (same metrics as Weibull PDF)
        const rrArray = collect("RRN");
        const prArray = collect("PRN");
        const arArray = collect("ARN");
        const xepArray = collect("XEP");
        const deltaGEQArray = collect("GEQ"); // Using GEQ field for deltaGEQ

        console.log("Weibull Risk arrays:");
        console.log("RR:", rrArray);
        console.log("PR:", prArray);
        console.log("AR:", arArray);
        console.log("XEP:", xepArray);
        console.log("deltaGEQ:", deltaGEQArray);

        // Check if we have any valid data
        if (rrArray.length === 0 && prArray.length === 0 && arArray.length === 0 &&
            xepArray.length === 0 && deltaGEQArray.length === 0) {
            return res.status(404).json({ message: "No valid numeric data found in the results" });
        }

        // ✅ Use provided beta or default to 1.5
        const betaValue = beta ? Number(beta) : 1.5;

        // ✅ Calculate Weibull Risk (Hazard) distributions for each metric
        const distributions = {};

        if (rrArray.length > 0) {
            distributions.RR = calculateDistribution({
                data: rrArray,
                beta: betaValue,
                step: 0.05
            });
        }

        if (prArray.length > 0) {
            distributions.PR = calculateDistribution({
                data: prArray,
                beta: betaValue,
                step: 0.05
            });
        }

        if (arArray.length > 0) {
            distributions.AR = calculateDistribution({
                data: arArray,
                beta: betaValue,
                step: 0.05
            });
        }

        if (xepArray.length > 0) {
            distributions.XEP = calculateDistribution({
                data: xepArray,
                beta: betaValue,
                step: 0.05
            });
        }

        if (deltaGEQArray.length > 0) {
            distributions.deltaGEQ = calculateDistribution({
                data: deltaGEQArray,
                beta: betaValue,
                step: 0.05
            });
        }

        // ✅ Prepare response (similar structure to Weibull PDF)
        res.status(200).json({
            mode: hasPpFilter ? "PP_LEVEL" : "CANDIDATE_AVERAGE",
            parameters: {
                beta: betaValue,
                eta: {
                    RR: distributions.RR?.params?.eta ?? null,
                    PR: distributions.PR?.params?.eta ?? null,
                    AR: distributions.AR?.params?.eta ?? null,
                    XEP: distributions.XEP?.params?.eta ?? null,
                    deltaGEQ: distributions.deltaGEQ?.params?.eta ?? null
                  },
                description: "Weibull shape parameter (β)",
            },
            distributions: {
                RR: distributions.RR,
                PR: distributions.PR,
                AR: distributions.AR,
                XEP: distributions.XEP,
                deltaGEQ: distributions.deltaGEQ
            },
            sourceStats: {
                rowsUsed: sourceRows.length,
                usedAverages: !hasPpFilter,
                metricCounts: {
                    RR: rrArray.length,
                    PR: prArray.length,
                    AR: arArray.length,
                    XEP: xepArray.length,
                    deltaGEQ: deltaGEQArray.length
                }
            },
            // ✅ Include Weibull Risk-specific information
            weibullInfo: {
                formula: {
                    Hazard: "h(t) = f(t) / R(t) = (β/η) (t/η)^{β-1}",
                    PDF: "f(t) = (β/η) (t/η)^{β-1} exp(-(t/η)^β)",
                    Reliability: "R(t) = exp(-(t/η)^β)",
                    eta: "η (scale parameter) = mean of data",
                    beta: "β (shape parameter) = provided or default 1.5"
                },
                interpretation: {
                    Hazard: "Instantaneous failure rate at time t",
                    eta: "Scale parameter η = characteristic life",
                    beta_interpretation: {
                        "β < 1": "Decreasing hazard rate (infant mortality)",
                        "β = 1": "Constant hazard rate (exponential distribution)",
                        "β > 1": "Increasing hazard rate (wear-out failures)"
                    }
                }
            }
        });

    } catch (error) {
        console.error("Error in getWeibullRiskDistributionData:", error);
        res.status(500).json({
            message: "Error computing Weibull Risk (Hazard) distribution",
            error: error.message
        });
    }
};