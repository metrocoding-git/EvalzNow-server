
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
/*
  weibull_cdf.js
  Name: Weibull Distribution (CDF + Reliability)
  Purpose: Plot CDF F(t) and Reliability R(t) on same chart with vertical line at t=η.
  CDF: F(t) = 1 - exp(-(t/η)^β)
  Reliability: R(t) = exp(-(t/η)^β)

	beta (shape parameter) -- user can specify any number, XX.XX > 0
    eta (scale parameter) -- this is the average of the data
	Need a vertical line at the eta value and at 0.700
	
//	Weibull Distribution for RR of all selected candidates in the unit
//	Weibull Distribution for PR of all selected candidates in the unit
//	Weibull Distribution for AR of all selected candidates in the unit
//	Weibull Distribution for XEQ of all selected candidates in the unit
//	Weibull Distribution for ∆GEQ of all selected candidates in the unit
//	Please plot Cumulative Distribution Function (CDF) and Reliability Function (RF) on the same chart
//	For CDF, X axis = t and Y axis = F
//	For RF, X axis = t and Y axis = R

*/

// Quick test (uncomment to run in console):
// const sample = [2.5, 1.2, 0.3, 0.74, 0.56, 0.9, 0.105, 0.115, 0.1];
// const result = calculateDistribution({ data: sample, beta: 1.5, step: 0.05, end: 400 });
// console.log('[weibull cdf] beta:', result.params.beta, 'eta:', result.params.eta);
// console.table(result.table.slice(0, 10));


// Standalone helpers for Weibull CDF + Reliability
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
  function weibullCdf(t, beta, eta) {
    if (t < 0) return 0;
    return 1 - Math.exp(-Math.pow(t / eta, beta));
  }
  function weibullReliability(t, beta, eta) {
    if (t < 0) return 1;
    return Math.exp(-Math.pow(t / eta, beta));
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
    const cdf = x.map((t) => weibullCdf(t, beta, eta));
    const rel = x.map((t) => weibullReliability(t, beta, eta));
    const table = x.map((t, i) => ({ t: parseFloat(t.toFixed(4)), F: parseFloat(cdf[i].toFixed(4)), R: parseFloat(rel[i].toFixed(4)) }));
    return { x, y: cdf, mean: null, variance: null, params: { beta, eta, step }, table, name: 'Weibull CDF + Reliability', rel };
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
  
  exports.getWeibullCDFDistributionData = async (req, res) => {
    try {
      const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;
  
      if (!unitId || !candidate_id) {
        return res.status(400).json({ message: "unitId and candidate_id are required" });
      }
  
      // Prepare mock request for existing controller
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
        status(code) {
          this.statusCode = code;
          return this;
        },
        json(data) {
          competencyData = data;
          return this;
        }
      };
  
      // Get competency data
      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
  
      if (!competencyData || !competencyData.results || competencyData.results.length === 0) {
        return res.status(404).json({ message: "No competency data found" });
      }
  
      const allResults = competencyData.results;
      
      // Extract arrays for each metric
      const rrArray = extractFieldValues(allResults, "RRN");
      const prArray = extractFieldValues(allResults, "PRN");
      const arArray = extractFieldValues(allResults, "ARN");
      const xepArray = extractFieldValues(allResults, "XEP");
      const deltaGEQArray = extractFieldValues(allResults, "GEQ"); // Using GEQ field for deltaGEQ
      
      // Check if we have any valid data
      if (rrArray.length === 0 && prArray.length === 0 && arArray.length === 0 && 
          xepArray.length === 0 && deltaGEQArray.length === 0) {
        return res.status(404).json({ message: "No valid numeric data found in the results" });
      }
      
      // Calculate distributions for each array
      const distributions = {};
      
      if (rrArray.length > 0) {
        distributions.RR = calculateDistribution({ data: rrArray, step: 0.05 });
      }
      
      if (prArray.length > 0) {
        distributions.PR = calculateDistribution({ data: prArray, step: 0.05 });
      }
      
      if (arArray.length > 0) {
        distributions.AR = calculateDistribution({ data: arArray, step: 0.05 });
      }
      
      if (xepArray.length > 0) {
        distributions.XEP = calculateDistribution({ data: xepArray, step: 0.05 });
      }
      
      if (deltaGEQArray.length > 0) {
        distributions.deltaGEQ = calculateDistribution({ data: deltaGEQArray, step: 0.05 });
      }
      
      // Return the response
      res.status(200).json({
        distributions,
        sourceData: {
          rrArray,
          prArray,
          arArray,
          xepArray,
          deltaGEQArray,
          summary: {
            RRN: { count: rrArray.length, values: rrArray },
            PRN: { count: prArray.length, values: prArray },
            ARN: { count: arArray.length, values: arArray },
            XEP: { count: xepArray.length, values: xepArray },
            deltaGEQ: { count: deltaGEQArray.length, values: deltaGEQArray }
          }
        }
      });
  
    } catch (error) {
      console.error("Error in getWeibullCDFDistributionData:", error);
      res.status(500).json({
        message: "Error computing Weibull distribution",
        error: error.message
      });
    }
  };

  
  
  
