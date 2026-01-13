const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

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
        return res.status(400).json({ message: "unitId and candidatePpList required" });
      }
  
      // Build candidate_id string to send to legacy controller
      const candidateIds = candidatePpList.map(x => x.candidateId).join(",");

      // Create mock req for existing function
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
  
      // Build lookup for filtering
      const ppMap = new Map();
      candidatePpList.forEach(({ candidateId, ppId }) => {
        ppMap.set(`${candidateId}_${ppId}`, true);
      });
  
      const results = allResults.filter(r =>
        ppMap.has(`${r.candidateId}_${r.ppId}`)
      );
  
      // Collect values only from filtered results
      const collect = (k) =>
        results.map(r => Number(r[k])).filter(v => !isNaN(v));

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

        const deltaGEQArray = collect("GEQ"); // if deltaGEQ uses GEQ field


        // if (mockRes.statusCode >= 400) {
        //     return res.status(mockRes.statusCode).json(competencyData);
        // }

        // // Now you have the competency data, process it for distribution
        // console.log("Competency data received:", competencyData);
        
        // Your distribution logic here using competencyData
        // For example:
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
          sourceData: competencyData
      });
      

    } catch(error) {
        console.error("Error in getUnitDistributionData:", error);
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