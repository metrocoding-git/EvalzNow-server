
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
        // ✅ Updated: Receive data via req.body like getBetaDistributionData
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

        // ✅ Check if we need PP filtering (same logic as beta distribution)
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

        // ✅ Extract stability patterns from filtered source rows
        const extractPattern = (key) => {
            return sourceRows
                .map(r => {
                    const val = r[key];
                    if (val === null || val === undefined) return null;

                    const v = String(val).toUpperCase();
                    if (v === "STABLE") return "S";
                    if (v === "UNSTABLE") return "U";
                    return null;
                })
                .filter(v => v !== null);
        };

        // ✅ Create separate arrays for STAG and STAP from filtered data
        const stagArray = extractPattern("STAG"); // e.g. ['S','U','S','S']
        const stapArray = extractPattern("STAP"); // e.g. ['U','U','S']

        console.log("Extracted STAG pattern:", stagArray);
        console.log("Extracted STAP pattern:", stapArray);

        // ✅ Calculate uniform distributions (if data exists)
        const stagDistribution = stagArray.length > 0 
            ? calculateDistribution({ patternSymbols: stagArray }) 
            : null;

        const stapDistribution = stapArray.length > 0 
            ? calculateDistribution({ patternSymbols: stapArray }) 
            : null;

        // ✅ Prepare response (similar structure to beta distribution)
        const response = {
            mode: hasPpFilter ? "PP_LEVEL" : "CANDIDATE_AVERAGE",
            distributions: {
                STAG: stagDistribution,
                STAP: stapDistribution
            },
            sourceStats: {
                rowsUsed: sourceRows.length,
                usedAverages: !hasPpFilter,
                patternCounts: {
                    STAG: stagArray.length,
                    STAP: stapArray.length
                }
            },
            statistics: {
                STAG: stagDistribution ? {
                    mean: stagDistribution.mean,
                    variance: stagDistribution.variance,
                    a: stagDistribution.params.a,
                    b: stagDistribution.params.b,
                    stableCount: stagArray.filter(s => s === 'S').length,
                    unstableCount: stagArray.filter(s => s === 'U').length,
                    totalPatterns: stagArray.length,
                    stableRatio: stagArray.filter(s => s === 'S').length / stagArray.length
                } : null,
                STAP: stapDistribution ? {
                    mean: stapDistribution.mean,
                    variance: stapDistribution.variance,
                    a: stapDistribution.params.a,
                    b: stapDistribution.params.b,
                    stableCount: stapArray.filter(s => s === 'S').length,
                    unstableCount: stapArray.filter(s => s === 'U').length,
                    totalPatterns: stapArray.length,
                    stableRatio: stapArray.filter(s => s === 'S').length / stapArray.length
                } : null
            },
            patterns: {
                STAG: stagArray,
                STAP: stapArray
            }
        };

        res.status(200).json(response);

    } catch(error) {
        console.error("Error in getUniformDistributionData:", error);
        res.status(500).json({ 
            message: "Error computing uniform distribution", 
            error: error.message 
        });
    }
};

  
  
  