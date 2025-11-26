const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

/*
  beta.js
  Name: Beta Distribution (α, β from pattern counts)
  Purpose: Tabular-only Beta PDF. Table returns { x, y } only.
  Formula: f(x) = x^{α-1} (1-x)^{β-1} / B(α,β), 0<x<1
  α = count('S') + 1, β = count('U') + 1 where patternSymbols ∈ {'S','U'}

  This distribution is for STA/P and STA/G Only
  Count the Stable ('S') and the Unstable ('U') based on candidate selections
  
*/

// Quick test (uncomment to run in console):
// const patternSymbols = ['S','U','U','S','U','S','S','S','U','U','U','U','U','U','U','U','S','S','S','U'];
// const result = calculateDistribution({ step: 0.02, patternSymbols });
// console.log('[beta] alpha:', result.params.alpha.toFixed(4), 'beta:', result.params.beta.toFixed(4));
// console.table(result.table.slice(0, 10));

// Standalone helpers for Beta
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
  function betaPdf(x, a, b) {
    if (x <= 0 || x >= 1) return 0;
    const B = (gamma(a) * gamma(b)) / gamma(a + b);
    return (Math.pow(x, a - 1) * Math.pow(1 - x, b - 1)) / B;
  }
  // No plotting – tabular only
  
  function calculateDistribution(params = {}) {
    // α, β are derived from stability pattern counts: α = (#S) + 1, β = (#U) + 1
    let alpha;
    let beta;
    const step = 0.02; // fixed step size
  
    // Stability symbols required per spec
    const patternSymbols = Array.isArray(params.patternSymbols) && params.patternSymbols.length
      ? params.patternSymbols
      : null;
    if (!patternSymbols) {
      return { x: [], y: [], mean: null, variance: null, params: { alpha, beta, step, error: 'patternSymbols array is required' }, table: [], name: 'Beta Distribution' };
    }
    const sCount = patternSymbols.filter(s => String(s).toUpperCase() === 'S').length;
    const uCount = patternSymbols.length - sCount;
    alpha = (sCount) + 1;
    beta = (uCount) + 1;
  
    // Generate x over [0,1] using fixed step increments
    const x = generateRange(0, 1, step);
    const y = x.map((xi) => betaPdf(xi, alpha, beta));
  
    const table = x.map((xi, i) => ({ x: parseFloat(xi.toFixed(4)), y: parseFloat(y[i].toFixed(4)) }));
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / (Math.pow(alpha + beta, 2) * (alpha + beta + 1));
  
    return { x, y, mean, variance, params: { alpha, beta, step, patternSymbols: patternSymbols.slice() }, table, name: 'Beta Distribution' };
  }


  exports.getBetaDistributionData = async (req, res) => {
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

        // Process STAG and STAP values
        const processStabilityValues = (key) => {
            return allResults
                .map(r => {
                    const value = r[key];
                    if (value === null || value === undefined) return null;
                    
                    const stringValue = String(value).toUpperCase();
                    if (stringValue === 'STABLE') return 'S';
                    if (stringValue === 'UNSTABLE') return 'U';
                    return null;
                })
                .filter(v => v !== null);
        };

        // Extract stability patterns
        const stagPatterns = processStabilityValues("STAG");
        const stapPatterns = processStabilityValues("STAP");

        // Calculate distributions
        const stagDistribution = stagPatterns.length > 0 ? calculateDistribution({ patternSymbols: stagPatterns }) : null;
        const stapDistribution = stapPatterns.length > 0 ? calculateDistribution({ patternSymbols: stapPatterns }) : null;

        // Prepare response
        const response = {
            distributions: {
                STAG: stagDistribution,
                STAP: stapDistribution
            },
            sourceData: {
                counts: {
                    totalResults: allResults.length,
                    STAG: stagPatterns.length,
                    STAP: stapPatterns.length
                },
                extractedValues: {
                    STAG: stagPatterns,
                    STAP: stapPatterns
                },
                statistics: {
                    STAG: stagDistribution ? {
                        alpha: stagDistribution.params.alpha,
                        beta: stagDistribution.params.beta,
                        stableCount: stagDistribution.params.alpha - 1,
                        unstableCount: stagDistribution.params.beta - 1,
                        mean: stagDistribution.mean,
                        variance: stagDistribution.variance
                    } : null,
                    STAP: stapDistribution ? {
                        alpha: stapDistribution.params.alpha,
                        beta: stapDistribution.params.beta,
                        stableCount: stapDistribution.params.alpha - 1,
                        unstableCount: stapDistribution.params.beta - 1,
                        mean: stapDistribution.mean,
                        variance: stapDistribution.variance
                    } : null
                }
            }
        };

        res.status(200).json(response);

    } catch(error) {
        console.error("Error in getBetaDistributionData:", error);
        res.status(500).json({ 
            message: "Error computing beta distribution", 
            error: error.message 
        });
    }
};