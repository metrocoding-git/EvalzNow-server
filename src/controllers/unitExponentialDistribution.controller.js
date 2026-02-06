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
      const {
        unitId,
        candidate_id,
        ppIdFrom,
        ppIdTo,
        criticalRefDateFrom,
        criticalRefDateTo
      } = req.query;
  
      if (!unitId || !candidate_id) {
        return res.status(400).json({
          message: "unitId and candidate_id are required"
        });
      }
  
      // Mock legacy request
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
  
      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
  
      if (!competencyData || !Array.isArray(competencyData.averages)) {
        return res.status(404).json({
          message: "No averaged competency data found"
        });
      }
  
      const averages = competencyData.averages;
  
      // Helper to safely collect numeric values
      const collect = (key) =>
        averages
          .map(a => {
            const v = a[key];
            return v !== null && v !== undefined ? Number(v) : null;
          })
          .filter(v => v !== null && !isNaN(v));
  
      // --- Extract PER-CANDIDATE AVERAGES ---
      const rrArray = collect("RRN");
      const prArray = collect("PRN");
      const arArray = collect("ARN");
      const xeqArray = collect("XEP");
      const deltaGEQArray = collect("GEQ");
  
      // Debug (optional)
      console.log("Averaged arrays:");
      console.log("RR:", rrArray);
      console.log("PR:", prArray);
      console.log("AR:", arArray);
      console.log("XEQ:", xeqArray);
      console.log("deltaGEQ:", deltaGEQArray);
  
      // --- Distributions ---
      const rrDistribution = rrArray.length
        ? calculateDistribution({ data: rrArray, step: 0.05 })
        : null;
  
      const prDistribution = prArray.length
        ? calculateDistribution({ data: prArray, step: 0.05 })
        : null;
  
      const arDistribution = arArray.length
        ? calculateDistribution({ data: arArray, step: 0.05 })
        : null;
  
      const xeqDistribution = xeqArray.length
        ? calculateDistribution({ data: xeqArray, step: 0.05 })
        : null;
  
      const deltaGEQDistribution = deltaGEQArray.length
        ? calculateDistribution({ data: deltaGEQArray, step: 0.05 })
        : null;
  
      res.status(200).json({
        distributions: {
          RR: rrDistribution,
          PR: prDistribution,
          AR: arDistribution,
          XEQ: xeqDistribution,
          deltaGEQ: deltaGEQDistribution
        },
        sourceData: {
          candidateCount: averages.length,
          extractedAverages: {
            RR: rrArray,
            PR: prArray,
            AR: arArray,
            XEQ: xeqArray,
            deltaGEQ: deltaGEQArray
          }
        }
      });
  
    } catch (error) {
      console.error("Error in getExponetialDistributionData:", error);
      res.status(500).json({
        message: "Error computing exponential distribution",
        error: error.message
      });
    }
  };
  
  // (plotDistribution removed)
  
  
  