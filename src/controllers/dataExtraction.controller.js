const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;
const needAssessment = db.CandidateNeedAssessment;
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getNeuroScienceRmsValues } = require('./neuroScience.controller');

/// <param name="xArray">array data - covers the range of Performance Point IDs (+PP ID only)</param>
/// <param name="yArray">array data - represents the RMS for each +PP ID.</param>
function cognitiveNS(xArray, yArray) {
  let areasub = 0;

  for (let i = 0; i < xArray.length - 1; i++) {
    if (yArray[i] !== 0 && yArray[i + 1] !== 0) {
      areasub += (yArray[i] + yArray[i + 1]) / 2;
    }
  }

  return (areasub / 100).toFixed(3);
}
 


function calculateCognitiveLoadPerLobe(neuroRmsData) {
  const result = {};

  // Sort PP once
  const sorted = [...neuroRmsData].sort((a, b) => a.ppId - b.ppId);

  sorted.forEach((row, index) => {
    Object.entries(row.lobes).forEach(([lobeName, values]) => {
      if (!result[lobeName]) {
        result[lobeName] = {
          proficiency: [],
          growth: []
        };
      }

      // ---- PROFICIENCY ----
      const profSlice = sorted
        .slice(0, index + 1)
        .map(r => r.lobes[lobeName]?.RMS ?? 0);

      const profValue =
        profSlice.length < 2
          ? "0.000"
          : cognitiveNS(
              sorted.slice(0, index + 1).map(r => r.ppId),
              profSlice
            );

      result[lobeName].proficiency.push({
        ppId: row.ppId,
        value: profValue
      });

      // ---- GROWTH ----
      const growthSlice = sorted
        .slice(0, index + 1)
        .map(r => r.lobes[lobeName]?.deltaRMS ?? 0);

      const growthValue =
        growthSlice.length < 2
          ? "0.000"
          : cognitiveNS(
              sorted.slice(0, index + 1).map(r => r.ppId),
              growthSlice
            );

      result[lobeName].growth.push({
        ppId: row.ppId,
        value: growthValue
      });
    });
  });

  return result;
}

const formatCompetencyNumbers = (competency) => {
  // Fields that should have 3 decimal places
  const threeDecimalFields = [
    'XLR', 'XRR', 'XSR', 'XWR', 'XTR', 'XPR',
    'XRVSR', 'XPVSR', 'XAVSR',
    'RRN', 'PRN', 'ARN',
    'XEP', 'XCP', 'XBP',
    'MSIP',
    'deltaRRN', 'deltaPRN', 'deltaARN',
    'GEQ',
    'RRGT1', 'PRGT1', 'ARGT1',
    'RRGT2', 'PRGT2', 'ARGT2',
    'RRGT3', 'PRGT3', 'ARGT3',
    'RRGT4', 'PRGT4', 'ARGT4',
    'RRGT5', 'PRGT5', 'ARGT5',
    'Productivity_CSD', 'Productivity_USD'
  ];

  const formatted = { ...competency };

  threeDecimalFields.forEach(field => {
    if (formatted[field] !== undefined && formatted[field] !== null && formatted[field] !== '-') {
      const num = parseFloat(formatted[field]);
      if (!isNaN(num)) {
        formatted[field] = num.toFixed(3);
      }
    }
  });

  return formatted;
};


// GET Insert Scores by Unit ID
exports.getDataExtractionByUnitId = async (req, res) => {
    try {
      const { unitId } = req.params;
  
      const scores = await InsertScore.findAll({
        where: { unitId },
        include: [
          { model: AssessmentBlockManager, as: 'assessmentBlock' },
          { model: Unit, as: 'unit' },
          { model: Candidate, as: 'candidate' }
        ],
        order: [
          ['candidate_id', 'ASC'],
          ['ppId', 'ASC'],
          ['criticalRefDate', 'ASC']
        ]
      });
      
      const grouped = {
        unit: null,
        candidates: []
      };
      
      scores.forEach(row => {
        // set unit once
        if (!grouped.unit) {
          grouped.unit = {
            unitId: row.unit.id,
            unitName: row.unit.unitName,
            unitStartDate: row.unit.unitStartDate,
            unitEndDate: row.unit.unitEndDate,
            unitType: row.unit.unitType,
            environment: row.unit.environment,
            signatureProfile: row.unit.signatureProfile
          };
        }
      
        // candidate level
        let candidate = grouped.candidates.find(
          c => c.candidateId === row.candidate.id
        );
      
        if (!candidate) {
          candidate = {
            candidateId: row.candidate.id,
            candidateCode: row.candidate.candidateId,
            firstName: row.candidate.firstName,
            lastName: row.candidate.lastName,
            nationality: row.candidate.nationality,
            gender: row.candidate.gender,
            ethnicity: row.candidate.ethnicity,
            income: row.candidate.income,
            religion: row.candidate.religion,
            maritalStatus: row.candidate.maritalStatus,
            jobType: row.candidate.jobType,
            dateOfBirth: row.candidate.dateOfBirth,
            candidateStartDate: row.candidate.startDate,
            specialIdNo: row.candidate.specialIdNo,
            pps: [],
            competencyResults: []  
          };
      
          grouped.candidates.push(candidate);
        }
      
        // PP level
        let pp = candidate.pps.find(p => p.ppId === row.ppId);
      
        if (!pp) {
          pp = {
            ppId: row.ppId,
            shortDescription: row.assessmentBlock?.shortDescription,
            periodType: row.assessmentBlock?.periodType,
            delivery: row.assessmentBlock?.delivery,
          };
      
          candidate.pps.push(pp);
        } 
      });

      const sortPpIds = (a, b) => {
        // both negative
        if (a.ppId < 0 && b.ppId < 0) {
          return Math.abs(a.ppId) - Math.abs(b.ppId);
        }
      
        // one negative, one positive
        if (a.ppId < 0 && b.ppId > 0) return -1;
        if (a.ppId > 0 && b.ppId < 0) return 1;
      
        // both positive
        return a.ppId - b.ppId;
      };

      grouped.candidates.forEach(candidate => {
        candidate.pps.sort(sortPpIds);
      });

      //  extract candidate IDs
      const candidateIds = grouped.candidates.map(c => c.candidateId);

      //  Fetch competency ratios for all candidates in one go
      const mockReq = {
          query: {
              unitId: grouped.unit.unitId,
              candidate_id: candidateIds.join(",")
          }
      };
      
      let competencyData = null;
      
      const mockRes = {
          status(code) { this.statusCode = code; return this; },
          json(data) { competencyData = data; return this; }
      };
      
      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

      //  Group results by candidateId
      const competencyByCandidate = {};
      (competencyData?.results || []).forEach(r => {
          if (!competencyByCandidate[r.candidateId]) {
              competencyByCandidate[r.candidateId] = [];
          }
          competencyByCandidate[r.candidateId].push(r);
      });

      //  Attach only results to each candidate
      grouped.candidates.forEach(candidate => {
        candidate.competencyResults = (competencyByCandidate[candidate.candidateId] || [])
          .map(c => formatCompetencyNumbers(c)); // ✅ Apply formatting here
      });


      // Fetch need assessments for the unit
      const needAssessments = await needAssessment.findAll({
        where: { unitId },
        attributes: [
          'candidateId',
          'ppId',
          'benchmarkIds',
          'bIds',
          'observation'
        ]
      });
      
      const safeParse = (value) => {
        try {
          if (!value) return [];
          if (typeof value === "string") return JSON.parse(value);
          if (Array.isArray(value)) return value;
          return [];
        } catch (err) {
          console.error("Invalid JSON:", value);
          return [];
        }
      };
      
      const needAssessmentByCandidate = {};

      // Group by candidateId
      needAssessments.forEach(na => {
        if (!needAssessmentByCandidate[na.candidateId]) {
          needAssessmentByCandidate[na.candidateId] = [];
        }
      
        const benchmarkIds = safeParse(na.benchmarkIds);
        const bIds = safeParse(na.bIds);
        const observation = na.observation?.trim() || "";
      
        //  STATUS LOGIC
        let status = "Open";
      
        if (benchmarkIds.length > 0 && observation) {
          status = "Closed";
        } else if (
          (benchmarkIds.length > 0 && !observation) ||
          (benchmarkIds.length === 0 && observation)
        ) {
          status = "Pending";
        }
      
        needAssessmentByCandidate[na.candidateId].push({
          ppId: na.ppId,
          benchmarkIds,
          bIds,
          observation,
          status 
        });
      });

      // Attach to candidates
      grouped.candidates.forEach(candidate => {
        candidate.needAssessments =
          needAssessmentByCandidate[candidate.candidateId] || [];
      });


      // Neuro Science Rms value extraction
      for (const candidate of grouped.candidates) {

        const neuroReq = {
          params: {
            unitId: grouped.unit.unitId,
            candidateId: candidate.candidateId
          },
          query: {} // optional filters if needed later
        };
      
        let neuroData = null;

        const neuroRes = {
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(payload) {
            neuroData = payload;
            return this;
          }
        };

        await getNeuroScienceRmsValues(neuroReq, neuroRes);

        // console.log("nuero science RMS: ", neuroRes, neuroData);
      
        // Attach only valid results
        if (neuroData?.data?.length) {
          const cognitiveLoad = calculateCognitiveLoadPerLobe(neuroData.data);
        
          candidate.neuroScienceRms = {
            count: neuroData.count,
            data: neuroData.data,
            cognitiveLoad
          };
        } else {
          candidate.neuroScienceRms = {
            count: 0,
            data: [],
            cognitiveLoad: {}
          };
        }
        
      }

      res.status(200).json(grouped);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching insert scores by blockId', error: error.message });
    }
};


exports.getDataExtractionByClientId = async (req, res) => {
  try {
    const { clientId } = req.params;

    if (!clientId) {
      return res.status(400).json({ message: "clientId is required" });
    }

    // Fetch all units for client
    const units = await Unit.findAll({
      where: { clientId },
      attributes: [
        "id",
        "unitId",
        "unitName",
        "unitStartDate",
        "unitEndDate",
        "unitType",
        "environment",
        "signatureProfile"
      ],
      raw: true
    });

    if (!units.length) {
      return res.status(404).json({ message: "No units found for this client" });
    }

    const clientData = {
      clientId,
      units: []
    };

    // Process each unit
    for (const unit of units) {
      const unitId = unit.id;

      const scores = await InsertScore.findAll({
        where: { unitId },
        include: [
          { model: AssessmentBlockManager, as: 'assessmentBlock' },
          { model: Unit, as: 'unit' },
          { model: Candidate, as: 'candidate' }
        ],
        order: [
          ['candidate_id', 'ASC'],
          ['ppId', 'ASC'],
          ['criticalRefDate', 'ASC']
        ]
      });

      const grouped = {
        unit: { ...unit },
        candidates: []
      };

      if (!scores.length) {
        clientData.units.push(grouped);
        continue;
      }

      // ---------------------------
      // Candidate + PP grouping
      // ---------------------------
      scores.forEach(row => {
        let candidate = grouped.candidates.find(
          c => c.candidateId === row.candidate.id
        );

        if (!candidate) {
          candidate = {
            candidateId: row.candidate.id,
            candidateCode: row.candidate.candidateId,
            firstName: row.candidate.firstName,
            lastName: row.candidate.lastName,
            nationality: row.candidate.nationality,
            gender: row.candidate.gender,
            ethnicity: row.candidate.ethnicity,
            income: row.candidate.income,
            religion: row.candidate.religion,
            maritalStatus: row.candidate.maritalStatus,
            jobType: row.candidate.jobType,
            dateOfBirth: row.candidate.dateOfBirth,
            candidateStartDate: row.candidate.startDate,
            specialIdNo: row.candidate.specialIdNo,
            pps: [],
            competencyResults: []
          };
          grouped.candidates.push(candidate);
        }

        let pp = candidate.pps.find(p => p.ppId === row.ppId);
        if (!pp) {
          pp = {
            ppId: row.ppId,
            shortDescription: row.assessmentBlock?.shortDescription,
            periodType: row.assessmentBlock?.periodType,
            delivery: row.assessmentBlock?.delivery
          };
          candidate.pps.push(pp);
        }
      });

      const sortPpIds = (a, b) => {
        // both negative
        if (a.ppId < 0 && b.ppId < 0) {
          return Math.abs(a.ppId) - Math.abs(b.ppId);
        }
      
        // one negative, one positive
        if (a.ppId < 0 && b.ppId > 0) return -1;
        if (a.ppId > 0 && b.ppId < 0) return 1;
      
        // both positive
        return a.ppId - b.ppId;
      };

      grouped.candidates.forEach(candidate => {
        candidate.pps.sort(sortPpIds);
      });

      // ---------------------------
      // Competency ratios
      // ---------------------------
      const candidateIds = grouped.candidates.map(c => c.candidateId);

      const mockReq = {
        query: {
          unitId,
          candidate_id: candidateIds.join(",")
        }
      };

      let competencyData = null;
      const mockRes = {
        status(code) { this.statusCode = code; return this; },
        json(data) { competencyData = data; return this; }
      };

      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

      const competencyByCandidate = {};
      (competencyData?.results || []).forEach(r => {
        if (!competencyByCandidate[r.candidateId]) {
          competencyByCandidate[r.candidateId] = [];
        }
        competencyByCandidate[r.candidateId].push(r);
      });

      grouped.candidates.forEach(candidate => {
        const rawResults = competencyByCandidate[candidate.candidateId] || [];
      
        candidate.competencyResults = rawResults.map(result =>
          formatCompetencyNumbers(result)
        );
      });
      
      

      // ---------------------------
      // Need Assessments
      // ---------------------------
      const needAssessments = await needAssessment.findAll({
        where: { unitId },
        attributes: ['candidateId', 'ppId', 'benchmarkIds', 'bIds', 'observation']
      });

      const safeParse = (value) => {
        try {
          if (!value) return [];
          if (typeof value === "string") return JSON.parse(value);
          if (Array.isArray(value)) return value;
          return [];
        } catch (err) {
          console.error("Invalid JSON:", value);
          return [];
        }
      };
      
      const needAssessmentByCandidate = {};

      // Group by candidateId
      needAssessments.forEach(na => {
        if (!needAssessmentByCandidate[na.candidateId]) {
          needAssessmentByCandidate[na.candidateId] = [];
        }
      
        const benchmarkIds = safeParse(na.benchmarkIds);
        const bIds = safeParse(na.bIds);
        const observation = na.observation?.trim() || "";
      
        //  STATUS LOGIC
        let status = "Open";
      
        if (benchmarkIds.length > 0 && observation) {
          status = "Closed";
        } else if (
          (benchmarkIds.length > 0 && !observation) ||
          (benchmarkIds.length === 0 && observation)
        ) {
          status = "Pending";
        }
      
        needAssessmentByCandidate[na.candidateId].push({
          ppId: na.ppId,
          benchmarkIds,
          bIds,
          observation,
          status 
        });
      });

      grouped.candidates.forEach(candidate => {
        candidate.needAssessments =
          needAssessmentByCandidate[candidate.candidateId] || [];
      });

      // ---------------------------
      // Neuro Science RMS + Cognitive Load
      // ---------------------------
      for (const candidate of grouped.candidates) {
        const neuroReq = {
          params: {
            unitId,
            candidateId: candidate.candidateId
          },
          query: {}
        };

        let neuroData = null;
        const neuroRes = {
          status(code) { this.statusCode = code; return this; },
          json(payload) { neuroData = payload; return this; }
        };

        await getNeuroScienceRmsValues(neuroReq, neuroRes);

        if (neuroData?.data?.length) {
          candidate.neuroScienceRms = {
            count: neuroData.count,
            data: neuroData.data,
            cognitiveLoad: calculateCognitiveLoadPerLobe(neuroData.data)
          };
        } else {
          candidate.neuroScienceRms = {
            count: 0,
            data: [],
            cognitiveLoad: {}
          };
        }
      }

      clientData.units.push(grouped);
    }

    res.status(200).json(clientData);

  } catch (error) {
    console.error("Error fetching insert scores by clientId:", error);
    res.status(500).json({
      message: 'Error fetching insert scores by clientId',
      error: error.message
    });
  }
};


exports.getDataExtractionByCandidateId = async (req, res) => {
  try {
    const { clientId, candidateId } = req.params;

    if (!clientId || !candidateId) {
      return res.status(400).json({ message: "clientId and candidateId are required" });
    }

    // Fetch all units for the client
    const units = await Unit.findAll({
      where: { clientId },
      attributes: [
        "id",
        "unitId",
        "unitName",
        "unitStartDate",
        "unitEndDate",
        "unitType",
        "environment",
        "signatureProfile"
      ],
      raw: true
    });

    if (!units.length) {
      return res.status(404).json({ message: "No units found for this client" });
    }

    const clientData = {
      clientId,
      units: []
    };

    for (const unit of units) {
      const unitId = unit.id;

      // Fetch InsertScore only for the given candidateId
      const scores = await InsertScore.findAll({
        where: { unitId, candidate_id: candidateId },
        include: [
          { model: AssessmentBlockManager, as: 'assessmentBlock' },
          { model: Unit, as: 'unit' },
          { model: Candidate, as: 'candidate' }
        ],
        order: [
          ['candidate_id', 'ASC'],
          ['ppId', 'ASC'],
          ['criticalRefDate', 'ASC']
        ]
      });

      const grouped = {
        unit: { ...unit },
        candidates: []
      };

      if (!scores.length) {
        clientData.units.push(grouped);
        continue;
      }

      // Candidate + PP grouping
      scores.forEach(row => {
        let candidate = grouped.candidates.find(c => c.candidateId === row.candidate.id);

        
        if (!candidate) {
          candidate = {
            candidateId: row.candidate.id,
            candidateCode: row.candidate.candidateId,
            firstName: row.candidate.firstName,
            lastName: row.candidate.lastName,
            nationality: row.candidate.nationality,
            gender: row.candidate.gender,
            ethnicity: row.candidate.ethnicity,
            income: row.candidate.income,
            religion: row.candidate.religion,
            maritalStatus: row.candidate.maritalStatus,
            jobType: row.candidate.jobType,
            dateOfBirth: row.candidate.dateOfBirth,
            candidateStartDate: row.candidate.startDate,
            specialIdNo: row.candidate.specialIdNo,
            pps: [],
            competencyResults: []
          };
          grouped.candidates.push(candidate);
        }

        let pp = candidate.pps.find(p => p.ppId === row.ppId);
        if (!pp) {
          pp = {
            ppId: row.ppId,
            shortDescription: row.assessmentBlock?.shortDescription,
            periodType: row.assessmentBlock?.periodType,
            delivery: row.assessmentBlock?.delivery
          };
          candidate.pps.push(pp);
        }
      });

      const sortPpIds = (a, b) => {
        // both negative
        if (a.ppId < 0 && b.ppId < 0) {
          return Math.abs(a.ppId) - Math.abs(b.ppId);
        }
      
        // one negative, one positive
        if (a.ppId < 0 && b.ppId > 0) return -1;
        if (a.ppId > 0 && b.ppId < 0) return 1;
      
        // both positive
        return a.ppId - b.ppId;
      };

      grouped.candidates.forEach(candidate => {
        candidate.pps.sort(sortPpIds);
      });
      
      // Competency ratios
      const mockReq = {
        query: {
          unitId,
          candidate_id: candidateId
        }
      };
      let competencyData = null;
      const mockRes = {
        status(code) { this.statusCode = code; return this; },
        json(data) { competencyData = data; return this; }
      };
      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
      grouped.candidates.forEach(candidate => {
        candidate.competencyResults = (competencyData?.results || [])
          .map(c => formatCompetencyNumbers(c));
      });
      

      // Need Assessments
      const needAssessments = await needAssessment.findAll({
        where: { unitId, candidateId },
        attributes: ['candidateId', 'ppId', 'benchmarkIds', 'bIds', 'observation']
      }); 
      
      const safeParse = (value) => {
        try {
          if (!value) return [];
          if (typeof value === "string") return JSON.parse(value);
          if (Array.isArray(value)) return value;
          return [];
        } catch (err) {
          console.error("Invalid JSON:", value);
          return [];
        }
      };
      
      grouped.candidates.forEach(candidate => {
        candidate.needAssessments = needAssessments.map(na => {
          const benchmarkIds = safeParse(na.benchmarkIds);
          const bIds = safeParse(na.bIds);
          const observation = na.observation?.trim() || "";
      
          // 
          let status = "Open";
      
          if (benchmarkIds.length > 0 && observation) {
            status = "Closed";
          } else if (
            (benchmarkIds.length > 0 && !observation) ||
            (benchmarkIds.length === 0 && observation)
          ) {
            status = "Pending";
          }
      
          return {
            ppId: na.ppId,
            benchmarkIds,
            bIds,
            observation,
            status
          };
        });
      });

      // Neuro Science RMS + Cognitive Load
      for (const candidate of grouped.candidates) {
        const neuroReq = {
          params: { unitId, candidateId },
          query: {}
        };
        let neuroData = null;
        const neuroRes = {
          status(code) { this.statusCode = code; return this; },
          json(payload) { neuroData = payload; return this; }
        };
        await getNeuroScienceRmsValues(neuroReq, neuroRes);

        if (neuroData?.data?.length) {
          candidate.neuroScienceRms = {
            count: neuroData.count,
            data: neuroData.data,
            cognitiveLoad: calculateCognitiveLoadPerLobe(neuroData.data)
          };
        } else {
          candidate.neuroScienceRms = {
            count: 0,
            data: [],
            cognitiveLoad: {}
          };
        }
      }

      clientData.units.push(grouped);
    }

    res.status(200).json(clientData);

  } catch (error) {
    console.error("Error fetching data by clientId & candidateId:", error);
    res.status(500).json({
      message: 'Error fetching data by clientId & candidateId',
      error: error.message
    });
  }
};

