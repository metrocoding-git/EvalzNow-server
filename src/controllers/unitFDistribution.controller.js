const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getUnitById } = require('./unit.controller');
/*
  f_distribution_1.js
  Name: F Distribution (Variant: df1=1)
  Purpose: Compute and plot F PDF with α=5% right-tail critical value.
  Formula (PDF): f(x) = ( (d1/d2)^{d1/2} x^{d1/2 - 1} ) / ( B(d1/2, d2/2) (1 + (d1/d2) x)^{(d1+d2)/2} )
  Vertical line: Fc (α=0.05)
  YouTube ref: F critical region

need to determine the average of the selected candidate data first

  s1 data of selected candidates = [Avg RR, Avg PR, Avg XEQ, Avg XCP, Avg XBP];
  s2 data of selected candidates = [Avg ∆RR, Avg ∆PR, ∆GEQ];
  Need Vertical line: at Fc
*/

// Quick test (uncomment to run in console):
// const s1 = [1,2,3,4];
// const s2 = [5,6,7,8,4,5];
// const result = calculateDistribution({ s1, s2, step: 0.02 });
// console.log('[F] df1,df2:', result.params.df1, result.params.df2, 'Fc:', result.params.fc.toFixed(4), 'F:', result.params.fStatistic?.toFixed(4));
// console.table(result.table.slice(0, 10));

// Standalone helpers for F distribution
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
function fPdf(x, d1, d2) {
  if (x <= 0) return 0;
  const a = d1 / 2, b = d2 / 2;
  const B = (gamma(a) * gamma(b)) / gamma(a + b);
  const r = d1 / d2;
  return (Math.pow(r, a) * Math.pow(x, a - 1)) / (B * Math.pow(1 + r * x, a + b));
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
  // Derive df and variances strictly from samples provided by caller
  const s1 = Array.isArray(params.s1) ? params.s1 : null;
  const s2 = Array.isArray(params.s2) ? params.s2 : null;
  if (!s1 || !s2 || s1.length < 2 || s2.length < 2) {
    return { x: [], y: [], mean: null, variance: null, params: { error: 's1 and s2 arrays (length >= 2) are required' }, table: [], name: 'F Distribution' };
  }
  const n1 = s1.length, n2 = s2.length;
  const df1 = Math.max(1, n1 - 1);
  const df2 = Math.max(1, n2 - 1);
  const mean = (arr) => arr.reduce((a,b)=>a+b,0) / (arr.length || 1);
  const varianceSample = (arr) => {
    if (!arr || arr.length < 2) return 0;
    const m = mean(arr);
    return arr.reduce((acc,v)=>acc+(v-m)*(v-m),0) / (arr.length - 1);
  };
  const s1Var = varianceSample(s1);
  const s2Var = varianceSample(s2);
  const step = params.step ?? 0.02;
  const end = 10;
  const x = generateRange(0.001, end, step);
  const y = x.map((xi) => fPdf(xi, df1, df2));

  const pdf = (v) => fPdf(v, df1, df2);
  const fc = inverseCdfByBisection(pdf, 0, end, 0.95);

  const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));

  const distMean = df2 > 2 ? df2 / (df2 - 2) : Infinity;
  const distVariance = (df2 > 4)
    ? (2 * df2 * df2 * (df1 + df2 - 2)) / (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4))
    : Infinity;

  // Optional F-statistic if variances provided
  const fStatistic = s2Var > 0 ? (s1Var / s2Var) : null;

  return {
    x, y,
    mean: distMean,
    variance: distVariance,
    params: { df1, df2, step, fc, fStatistic, s1Var, s2Var, n1, n2 },
    table,
    name: 'F Distribution (df1 derived)'
  };
}
  

function calculateDistributionTPRM(params = {}) {
  // Derive df and variances strictly from samples provided by caller
  const s1 = Array.isArray(params.s1) ? params.s1 : null;
  const s2 = Array.isArray(params.s2) ? params.s2 : null;
  if (!s1 || !s2 || s1.length < 2 || s2.length < 2) {
    return { x: [], y: [], mean: null, variance: null, params: { error: 's1 and s2 arrays (length >= 2) are required' }, table: [], name: 'F Distribution' };
  }
  const n1 = s1.length, n2 = s2.length;
  const df1 = Math.max(1, n1 - 1);
  const df2 = Math.max(1, n2 - 1);
  const mean = (arr) => arr.reduce((a,b)=>a+b,0) / (arr.length || 1);
  const varianceSample = (arr) => {
    if (!arr || arr.length < 2) return 0;
    const m = mean(arr);
    return arr.reduce((acc,v)=>acc+(v-m)*(v-m),0) / (arr.length - 1);
  };
  const s1Var = varianceSample(s1);
  const s2Var = varianceSample(s2);
  const step = params.step ?? 0.02;
  const end = 10; // reasonable range for visualization
  const x = generateRange(0.001, end, step);
  const y = x.map((xi) => fPdf(xi, df1, df2));

  const pdf = (v) => fPdf(v, df1, df2);
  // Right-tail alpha=5% → CDF=0.95
  const fc = inverseCdfByBisection(pdf, 0, end, 0.95);

  const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));

  // Mean exists for df2 > 2
  const distMean = df2 > 2 ? df2 / (df2 - 2) : Infinity;
  const distVariance = (df2 > 4)
    ? (2 * df2 * df2 * (df1 + df2 - 2)) / (df1 * (df2 - 2) * (df2 - 2) * (df2 - 4))
    : Infinity;

  const fStatistic = s2Var > 0 ? (s1Var / s2Var) : null;

  return {
    x, y,
    mean: distMean,
    variance: distVariance,
    params: { df1, df2, step, fc, fStatistic, s1Var, s2Var, n1, n2 },
    table,
    name: 'F Distribution (df1 derived)'
  };
}
  
exports.getFDistributionData = async (req, res) => {
    try {
        const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;

        if (!unitId || !candidate_id) {
            return res.status(400).json({ message: "unitId and candidate_id are required" });
        }

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

        // Determine unit type from unit data (more reliable than competency data)
        const unitType = unitData.unitType;
        
        if (!unitType) {
            return res.status(400).json({ message: "No unitType found in unit data" });
        }

        // Helper function to calculate average of valid numeric values
        const calculateAverage = (values) => {
            const validValues = values.filter(v => v !== null && v !== undefined && !isNaN(v));
            if (validValues.length === 0) return null;
            return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
        };

        // Collect values from the actual field names in your response
        const collect = (key) =>
            allResults
                .map(r => {
                    const value = r[key];
                    // Handle null/undefined values and convert to number
                    return value !== null && value !== undefined ? Number(value) : null;
                })
                .filter(v => v !== null && !isNaN(v));

        // Extract arrays using the correct field names
        const rrArray = collect("RRN");
        const prArray = collect("PRN");
        const arArray = collect("ARN");
        const deltaRRArray = collect("deltaRRN");
        const deltaPRArray = collect("deltaPRN");
        const deltaARArray = collect("deltaARN");
        const deltaGEQArray = collect("GEQ");
        const xeqArray = collect("XEQ");
        const xcpArray = collect("XCP");
        const xbpArray = collect("XBP");
        
        // Calculate averages for s1 values
        const avgRR = calculateAverage(rrArray);
        const avgPR = calculateAverage(prArray);
        const avgAR = calculateAverage(arArray);
        const avgDeltaRR = calculateAverage(deltaRRArray);
        const avgDeltaPR = calculateAverage(deltaPRArray);
        const avgDeltaAR = calculateAverage(deltaARArray);
        const avgDeltaGEQ = calculateAverage(deltaGEQArray);
        const avgXEQ = calculateAverage(xeqArray);
        const avgXCP = calculateAverage(xcpArray);
        const avgXBP = calculateAverage(xbpArray);

        let s1 = [];
        let s2 = [];
        let distributionFunction = null;
        let distributionName = '';

       
       

        if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
            // For CICO_TP: Use RR, PR, deltaRR, deltaPR
            s1 = [avgRR, avgPR, avgXEQ, avgXCP, avgXBP].filter(val => val !== null);
            s2 = [avgDeltaRR, avgDeltaPR, avgDeltaGEQ].slice(0, s1.length);
            distributionFunction = calculateDistributionCICO_TP;
            distributionName = 'Chi-Square (k=4) - CICO/TP';
        } else if (unitType === "Third Parameter") {
            // For TPRM: Use RR, PR, AR, deltaRR, deltaPR, deltaAR
            s1 = [avgRR, avgPR, avgAR, avgDeltaRR, avgDeltaPR, avgDeltaAR].filter(val => val !== null);
            s2 = [avgDeltaRR, avgDeltaPR, , avgAR, avgDeltaGEQ].slice(0, s1.length);
            distributionFunction = calculateDistributionTPRM;
            distributionName = 'Chi-Square (k=6) - TPRM';
        } else {
            return res.status(400).json({ message: `Unknown unit type: ${unitType}` });
        }

        // Ensure s1 and s2 arrays have the same length
        if (s1.length !== s2.length) {
            // Trim s2 to match s1 length
            s2 = s2.slice(0, s1.length);
        }

        // Calculate the distribution
        const distribution = distributionFunction({
            s1,
            s2,
            step: 0.1
        });

        // Prepare response
        const response = {
            unitType,
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
                XEQ: avgXEQ,
                XCP: avgXCP,
                XBP: avgXBP,
                deltaRR: avgDeltaRR,
                deltaPR: avgDeltaPR,
                deltaAR: avgDeltaAR,
                deltaGEQ: avgDeltaGEQ
            },
            s1Values: s1,
            s2Values: s2,
            sourceData: {
                counts: {
                    totalResults: allResults.length,
                    RR: rrArray.length,
                    PR: prArray.length,
                    AR: arArray.length,
                    deltaRR: deltaRRArray.length,
                    deltaPR: deltaPRArray.length,
                    deltaAR: deltaARArray.length
                },
                extractedValues: {
                    RR: rrArray,
                    PR: prArray,
                    AR: arArray,
                    deltaRR: deltaRRArray,
                    deltaPR: deltaPRArray,
                    deltaAR: deltaARArray
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
  
  // (plotDistribution removed)
  
  
  