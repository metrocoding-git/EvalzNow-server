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
  if (!isFinite(start) || !isFinite(end) || !isFinite(step) || step <= 0) {
    return [];
  }

  const maxSteps = 10000;
  const nSteps = Math.min(
    Math.floor((end - start) / step),
    maxSteps
  );

  const arr = [];
  for (let i = 0; i <= nSteps; i++) {
    arr.push(Number((start + i * step).toFixed(10)));
  }

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
    const { candidatePpList, unitId } = req.body;

    if (!unitId || !Array.isArray(candidatePpList)) {
      return res.status(400).json({
        message: "unitId and candidatePpList required"
      });
    }

    const candidateIds = candidatePpList
      .map(x => x.candidateId)
      .join(",");

    const mockReq = {
      query: {
        unitId,
        candidate_id: candidateIds
      }
    };

    let competencyData = null;

    const mockRes = {
      status(code) { this.statusCode = code; return this; },
      json(data) { competencyData = data; return this; }
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

    // --- Safe collector ---
    const collect = (k) =>
      sourceRows
        .map(r => {
          const v = r[k];
          return v !== null && v !== undefined ? Number(v) : null;
        })
        .filter(v => v !== null && !isNaN(v));

    // --- BUILD ARRAYS ---
    const rrArray = collect("RRN");
    const prArray = collect("PRN");
    const arArray = collect("ARN");

    const deltaRRArray = collect("deltaRRN");
    const deltaPRArray = collect("deltaPRN");
    const deltaARArray = collect("deltaARN");

    const xeqArray = collect("XEP");
    const xcpArray = collect("XCP");
    const xbpArray = collect("XBP");

    const deltaGEQArray = collect("GEQ");

    console.log("Collected arrays:");
    console.log("RR:", rrArray);
    console.log("PR:", prArray);
    console.log("AR:", arArray);
    console.log("delta RR:", deltaRRArray);
    console.log("delta PR:", deltaPRArray);
    console.log("delta AR:", deltaARArray);
    console.log("XEQ:", xeqArray);
    console.log("XCP:", xcpArray);
    console.log("XBP:", xbpArray);
    console.log("deltaGEQ:", deltaGEQArray);

    // --- DISTRIBUTIONS ---
    const rrDistribution = calculateDistribution({ data: rrArray, step: 0.05 });
    const prDistribution = calculateDistribution({ data: prArray, step: 0.05 });
    const arDistribution = calculateDistribution({ data: arArray, step: 0.05 });

    const deltaRRDistribution = calculateDistribution({ data: deltaRRArray, step: 0.05 });
    const deltaPRDistribution = calculateDistribution({ data: deltaPRArray, step: 0.05 });
    const deltaARDistribution = calculateDistribution({ data: deltaARArray, step: 0.05 });

    const xeqDistribution = calculateDistribution({ data: xeqArray, step: 0.05 });
    const xcpDistribution = calculateDistribution({ data: xcpArray, step: 0.05 });
    const xbpDistribution = calculateDistribution({ data: xbpArray, step: 0.05 });

    const deltaGEQDistribution = calculateDistribution({ data: deltaGEQArray, step: 0.05 });

    res.status(200).json({
      mode: "MIXED", // Can be mix of PP-level and candidate averages
      distributions: {
        RR: rrDistribution,
        PR: prDistribution,
        AR: arDistribution,

        deltaRR: deltaRRDistribution,
        deltaPR: deltaPRDistribution,
        deltaAR: deltaARDistribution,

        XEQ: xeqDistribution,
        XCP: xcpDistribution,
        XBP: xbpDistribution,

        deltaGEQ: deltaGEQDistribution
      },
      sourceStats: {
        rowsUsed: sourceRows.length,
        breakdown: candidatePpList.map(({ candidateId, ppId }) => ({
          candidateId,
          ppId: ppId !== null && ppId !== undefined && ppId !== "" ? ppId : "Average",
          found: sourceRows.some(r => 
            r.candidateId === String(candidateId) && 
            (ppId !== null && ppId !== undefined && ppId !== "" ? r.ppId === ppId : r.ppId === "Average")
          )
        }))
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
  
  
  