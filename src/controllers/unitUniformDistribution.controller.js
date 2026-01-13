
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
/*
  uniform.js
  Name: Uniform Distribution (a=0, b=1)
  Purpose: Tabular-only output on [0,1] with discrete stability overlay.
  Output rows: { x, stable } where stable ∈ {0,1} (0=unstable, 1=stable)

  This distribution is for STA/P and STA/G Only
  Form the Stable ('S') and the Unstable ('U') arrays based on candidate selections from top to bottom
  
*/


// Quick test (uncomment to run in console):
// const patternSymbols = ['S','U','U','S','U','S','S','S'];
// const result = calculateDistribution({ a: 0, b: 1, step: 0.02, patternSymbols });
// console.log('[uniform] a,b:', result.params.a, result.params.b);
// console.table(result.table.slice(0, 10));

// Standalone helpers for Uniform
function generateRange(start, end, step = 1) {
    const arr = [];
    const nSteps = Math.floor((end - start) / step);
    for (let i = 0; i <= nSteps; i++) arr.push(Number((start + i * step).toFixed(10)));
    if (arr.length === 0 || arr[arr.length - 1] < end) arr.push(Number(end.toFixed(10)));
    return arr;
  }
  // No plotting – tabular only
  
  function calculateDistribution(params = {}) {
    const a = params.a ?? 0;
    const b = params.b ?? 1;
    const step = params.step ?? 0.02;
  
    // Stability pattern: must be provided by caller (e.g., ['S','U','U','S','U','S','S','S'])
    const patternSymbols = Array.isArray(params.patternSymbols) && params.patternSymbols.length
      ? params.patternSymbols
      : null;
    if (!patternSymbols) {
      const meanTmp = (a + b) / 2;
      const varTmp = Math.pow(b - a, 2) / 12;
      return { x: [], mean: meanTmp, variance: varTmp, params: { a, b, step, error: 'patternSymbols array is required' }, table: [], name: 'Uniform Distribution' };
    }
    const symToNum = (s) => (String(s).toUpperCase() === 'S' ? 1 : 0);
    const patternNums = patternSymbols.map(symToNum);
  
    // Align x to the pattern length exactly (no repetition)
    const n = patternNums.length;
    let x;
    if (n <= 1) {
      x = [a];
    } else {
      const dx = (b - a) / (n - 1);
      x = Array.from({ length: n }, (_, i) => Number((a + i * dx).toFixed(10)));
    }
    const stability = patternNums;
  
    const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), stable: stability[i] }));
    const mean = (a + b) / 2;
    const variance = Math.pow(b - a, 2) / 12;
    return { x, mean, variance, params: { a, b, step, patternSymbols: patternSymbols.slice() }, table, name: 'Uniform Distribution' };
  }
  

  
  exports.getUniformDistributionData = async (req, res) => {
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

        await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

        if (!competencyData || !competencyData.results) {
            return res.status(404).json({ message: "No competency data found" });
        }

        const allResults = competencyData.results;

        // -----------------------------------------
        // FUNCTION TO CONVERT STAG / STAP VALUES
        // -----------------------------------------
        const extractPattern = (key) => {
            return allResults
                .map(r => {
                    const val = r[key];
                    if (!val) return null;

                    const v = String(val).toUpperCase();
                    if (v === "STABLE") return "S";
                    if (v === "UNSTABLE") return "U";
                    return null;
                })
                .filter(v => v !== null);
        };

        // -----------------------------------------
        // CREATE SEPARATE ARRAYS FOR STAG AND STAP
        // -----------------------------------------
        const stagArray = extractPattern("STAG"); // e.g. ['S','U','S','S']
        const stapArray = extractPattern("STAP"); // e.g. ['U','U','S']

        // -----------------------------------------
        // PASS EACH ARRAY TO calculateDistribution
        // -----------------------------------------
        const stagDistribution =
            stagArray.length > 0 ? calculateDistribution({ patternSymbols: stagArray }) : null;

        const stapDistribution =
            stapArray.length > 0 ? calculateDistribution({ patternSymbols: stapArray }) : null;

        // -----------------------------------------
        // RESPONSE OBJECT — UNIFORM ONLY (NO ALPHA/BETA)
        // -----------------------------------------
        const response = {
            distributions: {
                STAG: stagDistribution,
                STAP: stapDistribution
            },
            sourceData: {
                counts: {
                    totalResults: allResults.length,
                    STAG: stagArray.length,
                    STAP: stapArray.length
                },
                extractedValues: {
                    STAG: stagArray,
                    STAP: stapArray
                },
                statistics: {
                    STAG: stagDistribution ? {
                        mean: stagDistribution.mean,
                        variance: stagDistribution.variance
                    } : null,
                    STAP: stapDistribution ? {
                        mean: stapDistribution.mean,
                        variance: stapDistribution.variance
                    } : null
                }
            }
        };

        return res.status(200).json(response);

    } catch (error) {
        console.error("Error in getUniformDistributionData:", error);
        res.status(500).json({
            message: "Error computing uniform distribution",
            error: error.message
        });
    }
};

  
  
  