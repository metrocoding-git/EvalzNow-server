
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
  
  
  
  exports.getWeibullCDFDistributionData = async (req, res) => {
    try {
        const { 
            unitId, 
            candidate_id, 
            ppIdFrom, 
            ppIdTo, 
            criticalRefDateFrom, 
            criticalRefDateTo, 
            beta = 1.5,  
            key = 'RR'   
        } = req.query;

        if (!unitId || !candidate_id) {
            return res.status(400).json({ message: "unitId and candidate_id are required" });
        }

        if (!key) {
            return res.status(400).json({ message: "key parameter is required (RR, PR, AR, XEQ, deltaGEQ, etc.)" });
        }

        // Step 1: Get competency data
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

        // Step 2: Map keys
        const keyMap = {
            "RR": "RRN",
            "PR": "PRN",
            "AR": "ARN",
            "XEQ": "XEP",
            "deltaGEQ": "GEQ",
            "deltaRR": "deltaRRN",
            "deltaPR": "deltaPRN",
            "deltaAR": "deltaARN",
            "XCP": "XCP",
            "XBP": "XBP"
        };

        const fieldName = keyMap[key] || key;

        // Step 3: Extract numeric values
        const values = allResults
            .map(r => r[fieldName])
            .filter(v => v !== null && v !== undefined && !isNaN(Number(v)))
            .map(Number);

        if (values.length === 0) {
            return res.status(404).json({ 
                message: `No valid numeric data found for key: ${key}`,
                field: fieldName
            });
        }

        // Step 4: Calculate η using mean
        const eta = meanFn(values);

        // Step 5: Compute Weibull Distribution using your helper
        const weibull = calculateDistribution({
            data: values,
            beta: parseFloat(beta),
            eta: eta,
            step: 0.02,
            end: 1.0
        });

        // Step 6: Compute statistics
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        const avgValue = meanFn(values);
        const variance = values.length > 1
            ? values.reduce((sum, v) => sum + Math.pow(v - avgValue, 2), 0) / values.length
            : 0;

        // Step 7: Prepare clean response
        res.status(200).json({
            key,
            parameters: {
                beta: parseFloat(beta),
                eta,
                step: weibull.params.step,
                end: weibull.params.end,
                t_eta: eta,
                t_0_700: 0.700
            },
            statistics: {
                mean: avgValue,
                variance,
                min: minValue,
                max: maxValue,
                count: values.length
            },
            distribution: weibull.table.map(row => ({
                t: row.t,
                CDF: row.F,
                Reliability: row.R
            })),
            rawValues: values,
            candidates: {
                count: allResults.length,
                candidateIds: [...new Set(allResults.map(r => r.candidateId))],
                ppIds: [...new Set(allResults.map(r => r.ppId))]
            }
        });

    } catch (error) {
        console.error("Error in getWeibullCDFDistributionData:", error);
        res.status(500).json({ 
            message: "Error computing Weibull CDF distribution", 
            error: error.message
        });
    }
};
