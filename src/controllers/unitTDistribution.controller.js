const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

/*
  t_distribution.js
  Name: Student's t Distribution
  Purpose: Compute and plot t PDF with 95% confidence (two-sided) markers.
  Formula: f(x) = Γ((ν+1)/2) / (√(νπ) Γ(ν/2)) * (1 + x^2/ν)^(-(ν+1)/2)
  Vertical lines: ±tcrit {0.975, df}
  YouTube ref: t-distribution with confidence intervals

// Vertical lines: ±tcrit {0.975}
// Please pass the following data through the main function separately
//
//	T Distribution for RR of all selected candidates in the unit
//	T Distribution for PR of all selected candidates in the unit
//	T Distribution for AR of all selected candidates in the unit
//	T Distribution for XEQ of all selected candidates in the unit
//	T Distribution for ∆RR of all selected candidates in the unit
//	T Distribution for ∆PR of all selected candidates in the unit
//	T Distribution for ∆AR of all selected candidates in the unit
//	T Distribution for ∆GEQ of all selected candidates in the unit
//
// Please plot x (Z-Score) on the X-Axis
// Please plot y (T distribution calc) on the Y-Axis
*/

// Quick test (uncomment to run in console):
// const sample = [5, 7, 6, 8, 6, 9, 7, 5, 6, 8];
// const result = calculateDistribution({ data: sample, step: 0.05 });
// console.log('[t] df:', result.params.df);
// console.log('[t] tCrit (0.975):', result.params.tCrit.toFixed(4));
// console.table(result.table.slice(0, 10));

// Standalone helpers for t distribution
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
function tPdf(x, df) {
  const v = df;
  const a = gamma((v + 1) / 2);
  const b = Math.sqrt(v * Math.PI) * gamma(v / 2);
  const c = Math.pow(1 + (x * x) / v, -((v + 1) / 2));
  return (a / b) * c;
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

function calculateDistribution(params = {}) {
  let df = params.df;
  if (Array.isArray(params.data) && params.data.length) {
    df = df ?? Math.max(1, params.data.length - 1);
  }
  df = df ?? 10;
  const step = params.step ?? 0.05;
  const start = -5;
  const end = 5;
  const x = generateRange(start, end, step);
  const y = x.map((xi) => tPdf(xi, df));

  // 95% two-sided critical value: CDF = 0.975
  const pdf = (v) => tPdf(v, df);
  const tCrit = inverseCdfByBisection(pdf, -10, 10, 0.975);

  const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));
  const variance = df > 2 ? df / (df - 2) : Infinity;

  return {
    x,
    y,
    mean: 0,
    variance,
    params: { df, step, tCrit },
    table,
    name: "t Distribution",
  };
}


exports.getTDistributionData = async (req, res) => {
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

    // 🔍 Detect if PP-level filtering is meaningful
    const hasPpFilter = candidatePpList.some(
      x => x.ppId !== null && x.ppId !== undefined && x.ppId !== ""
    );

    let sourceRows = [];

    if (hasPpFilter) {
      // ✅ PP-level T-distribution
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
      // ✅ Candidate-average T-distribution
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

    // --- DISTRIBUTIONS (T uses same input arrays) ---
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
        // XCP: xcpDistribution,
        // XBP: xbpDistribution,

        deltaGEQ: deltaGEQDistribution
      },
      sourceStats: {
        rowsUsed: sourceRows.length,
        usedAverages: !hasPpFilter
      }
    });

  } catch (error) {
    console.error("Error in getTDistributionData:", error);
    res.status(500).json({
      message: "Error computing T distribution",
      error: error.message
    });
  }
};

  
  // (plotDistribution removed)
  
  
  