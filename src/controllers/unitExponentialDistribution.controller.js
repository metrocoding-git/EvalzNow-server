const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

/*
  exponential.js
  Name: Exponential Distribution (PDF)
  Purpose: Compute and plot exponential PDF. λ = 1 / mean(data)
  Formula: f(x) = λ e^{-λx}
  Vertical line: mean = 1/λ
  YouTube ref: Exponential decay visualization

//	Exp Distribution for RR of all selected candidates in the unit
//	Exp Distribution for PR of all selected candidates in the unit
//	Exp Distribution for AR of all selected candidates in the unit
//	Exp Distribution for XEQ of all selected candidates in the unit
//	Exp Distribution for ∆GEQ of all selected candidates in the unit
*/

// Quick test (uncomment to run in console):
// const sample = [2.3, 1.7, 3.1, 0.9, 2.6, 1.4, 3.7, 1.2, 2.0];
// const result = calculateDistribution({ data: sample, step: 0.05 });
// console.log('[exponential] mean:', result.mean.toFixed(4), 'lambda:', result.params.lambda.toFixed(4));
// console.table(result.table.slice(0, 10));

// Standalone helpers for Exponential
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
  function exponentialPdf(x, lambda) {
    if (x < 0) return 0;
    return lambda * Math.exp(-lambda * x);
  }
  // No plotting – tabular only
  
  function calculateDistribution(params = {}) {
    const data = params.data;
    const fallbackMean = params.meanValue ?? 5; // dummy consistent default
    const mu = Array.isArray(data) && data.length ? meanFn(data) : fallbackMean;
    const lambda = 1 / mu;
    const step = params.step ?? 0.05;
    // Spec says 0 to 10λ; ensure reasonable extent
    const end = Math.max(10 * lambda, 10 / lambda);
    const x = generateRange(0, end, step);
    const y = x.map((xi) => exponentialPdf(xi, lambda));
  
    const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));
  
    return {
      x,
      y,
      mean: mu,
      variance: mu * mu,
      params: { lambda, step },
      table,
      name: 'Exponential Distribution',
    };
  }
  

  exports.getExponetialDistributionData = async (req, res) => {
    try {
        const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;

        if (!unitId || !candidate_id) {
            return res.status(400).json({ message: "unitId and candidate_id are required" });
        }

        // Create mock req for existing function
        const mockReq = {
            query: {
                unitId,
                candidate_id,
                ppIdFrom: ppIdFrom || null,
                ppIdTo: ppIdTo || null,
                criticalRefDateFrom: criticalRefDateFrom || null,
                criticalRefDateTo: criticalRefDateTo || null
            }
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
        
        if (!competencyData || !competencyData.results) {
            return res.status(404).json({ message: "No competency data found" });
        }

        const allResults = competencyData.results;

        // Collect values from the actual field names in your response
        const collect = (key) =>
            allResults
                .map(r => {
                    const value = r[key];
                    // Handle null/undefined values and convert to number
                    return value !== null && value !== undefined ? Number(value) : null;
                })
                .filter(v => v !== null && !isNaN(v));

        // Extract arrays using the correct field names from your response
        const rrArray = collect("RRN");        // RR values
        const prArray = collect("PRN");        // PR values  
        const arArray = collect("ARN");        // AR values (appears to be null in your data)
        
        const xeqArray = collect("XEP");       // XEQ values
        const deltaGEQArray = collect("GEQ");  // deltaGEQ values

        // Log the extracted arrays for debugging
        // console.log('Extracted arrays:');
        // console.log('RR:', rrArray);
        // console.log('PR:', prArray);
        // console.log('AR:', arArray);
        // console.log('XEQ:', xeqArray);
        // console.log('deltaGEQ:', deltaGEQArray);

        // Calculate distributions
        const rrDistribution = rrArray.length > 0 ? calculateDistribution({ data: rrArray, step: 0.05 }) : null;
        const prDistribution = prArray.length > 0 ? calculateDistribution({ data: prArray, step: 0.05 }) : null;
        const arDistribution = arArray.length > 0 ? calculateDistribution({ data: arArray, step: 0.05 }) : null;
        const xeqDistribution = xeqArray.length > 0 ? calculateDistribution({ data: xeqArray, step: 0.05 }) : null;
        const deltaGEQDistribution = deltaGEQArray.length > 0 ? calculateDistribution({ data: deltaGEQArray, step: 0.05 }) : null;

        // Prepare response
        const response = {
            distributions: {
                RR: rrDistribution,
                PR: prDistribution,
                AR: arDistribution,
                XEQ: xeqDistribution,
                deltaGEQ: deltaGEQDistribution
            },
            sourceData: {
                counts: {
                    totalResults: allResults.length,
                    RR: rrArray.length,
                    PR: prArray.length,
                    AR: arArray.length,
                    XEQ: xeqArray.length,
                    deltaGEQ: deltaGEQArray.length
                },
                extractedValues: {
                    RR: rrArray,
                    PR: prArray,
                    AR: arArray,
                    XEQ: xeqArray,
                    deltaGEQ: deltaGEQArray
                }
            }
        };

        res.status(200).json(response);

    } catch(error) {
        console.error("Error in getExponetialDistributionData:", error);
        res.status(500).json({ 
            message: "Error computing exponential distribution", 
            error: error.message 
        });
    }
};
  // (plotDistribution removed)
  
  
  