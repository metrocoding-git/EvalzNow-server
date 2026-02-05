const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

/*
  normal.js
  Name: Normal Distribution
  Purpose: Compute and plot the Normal PDF with mean and sigma markers.
  Formula: f(x) = (1/(σ√(2π))) * e^{- (x-μ)^2 / (2σ^2)}
  Vertical lines: μ, ±1σ, ±2σ, ±3σ (color-coded)
  YouTube ref: Standard normal curve visualization with sigma regions

// z represents the increment, we need a vertical line at -3.0, -2.0, -1.0, 0, 1.0, 2.0, 3.0
// Please pass the following data through the main function separately
//
//	Normal Distribution for RR of all selected candidates in the unit
//	Normal Distribution for PR of all selected candidates in the unit
//	Normal Distribution for AR of all selected candidates in the unit
//	Normal Distribution for XEQ of all selected candidates in the unit
//	Normal Distribution for XCP of all selected candidates in the unit
//	Normal Distribution for XBP of all selected candidates in the unit
//	Normal Distribution for ∆RR of all selected candidates in the unit
//	Normal Distribution for ∆PR of all selected candidates in the unit
//	Normal Distribution for ∆AR of all selected candidates in the unit
//	Normal Distribution for ∆GEQ of all selected candidates in the unit
//
// Please plot x (Z-Score) on the X-Axis
// Please plot y (standard distribution calc) on the Y-Axis
*/

// Quick test (uncomment to run in console):
// const sample = [12, 10, 11, 13, 12, 14, 9, 11, 12, 15];
// const result = calculateDistribution({ data: sample, step: 0.05 });
// console.log('[normal] mean (μ):', result.mean.toFixed(4));
// console.log('[normal] std (σ):', Math.sqrt(result.variance).toFixed(4));
// console.log('[normal] rows:', result.table.length);
// console.table(result.table.slice(0, 10));

// Standalone helpers for Normal
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
function varFn(arr) {
  if (!arr || arr.length < 2) return 0;
  const m = meanFn(arr);
  return arr.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (arr.length - 1);
}
function normalPdf(x, mu = 0, sigma = 1) {
  const c = 1 / (sigma * Math.sqrt(2 * Math.PI));
  const z = (x - mu) / sigma;
  return c * Math.exp(-0.5 * z * z);
}

function calculateDistribution(params = {}) {
  // If data provided and no explicit mu/sigma, compute from data
  let mu = params.mu;
  let sigma = params.sigma;
  if (Array.isArray(params.data) && params.data.length) {
    const m = meanFn(params.data);
    const v = varFn(params.data);
    mu = mu ?? m;
    sigma = sigma ?? Math.sqrt(v);
  }
  mu = mu ?? 0;
  sigma = sigma ?? 1;
  // Console log the mean as requested
  try {
    // Use fixed 4 decimals for readability
    // eslint-disable-next-line no-console
    console.log('[normal] mean (μ):', Number(mu.toFixed(4)));
    // eslint-disable-next-line no-console
    console.log('[normal] standard deviation (σ):', Number(sigma.toFixed(4)));
  } catch (_) { /* noop */ }
  const step = params.step ?? 0.05;
  // Standardized z-grid as requested: -3.5 → +3.5 in 0.05 increments
  const z = generateRange(-3.5, 3.5, step);
  const x = z.map((zi) => mu + zi * sigma);
  const y = x.map((xi) => normalPdf(xi, mu, sigma));

  // Table includes z, x, y; round to requested precision (x,y to 4dp; z to 2dp)
  const table = z.map((zi, i) => ({
    z: parseFloat(zi.toFixed(2)),
    x: parseFloat(x[i].toFixed(4)),
    y: parseFloat(y[i].toFixed(4)),
  }));

  return {
    x,
    y,
    mean: mu,
    variance: sigma * sigma,
    params: { mu, sigma, step },
    table,
    name: 'Normal Distribution',
    z,
  };
}

exports.getNormalDistributionData = async (req, res) => {
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

    // 🔍 Do we actually need PP filtering?
    const hasPpFilter = candidatePpList.some(
      x => x.ppId !== null && x.ppId !== undefined && x.ppId !== ""
    );

    let sourceRows = [];

    if (hasPpFilter) {
      // ✅ PP-level distributions
      const ppMap = new Map();
      candidatePpList.forEach(({ candidateId, ppId }) => {
        if (ppId !== null && ppId !== undefined && ppId !== "") {
          ppMap.set(`${candidateId}_${ppId}`, true);
        }
      });

      sourceRows = allResults.filter(r =>
        ppMap.has(`${r.candidateId}_${r.ppId}`)
      );

    } else {
      // ✅ Candidate-level averages
      sourceRows = allAverages;
    }

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

    console.log("Averaged arrays:");
    console.log("RR:", rrArray);
    console.log("PR:", prArray);
    console.log("AR:", arArray);
    console.log("delta RR:", deltaRRArray);
    console.log(" detla PR:", deltaPRArray);
    console.log("delta AR:", deltaARArray);
    console.log("XEQ:", xeqArray);
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
      mode: hasPpFilter ? "PP_LEVEL" : "CANDIDATE_AVERAGE",
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
        usedAverages: !hasPpFilter
      }
    });

  } catch (error) {
    console.error("Error in getNormalDistributionData:", error);
    res.status(500).json({
      message: "Error computing unit distribution",
      error: error.message
    });
  }
};


// Example distribution calculation function
// function calculateDistribution(results) {
//     // Your distribution logic here
//     // For example, group by IC (Interaction Class)
//     const distribution = {};
    
//     results.forEach(item => {
//         const ic = item.IC || 'Unknown';
//         if (!distribution[ic]) {
//             distribution[ic] = 0;
//         }
//         distribution[ic]++;
//     });
    
//     return distribution;
// }