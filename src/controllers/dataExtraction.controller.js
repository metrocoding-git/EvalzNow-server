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
  var areasub = 0;

  for (var i = 0; i < xArray.length; i++) {
    if (i <= xArray.length - 2 && yArray[i] != 0 && yArray[i + 1] != 0) {
      areasub +=
        (yArray[i] + yArray[i + 1]) / 2;
    } else {
      continue;
    }
  }

  return parseFloat(areasub).toFixed(3);
} 


function calculateCognitiveLoadPerLobe(neuroRmsData) {
  const lobeMap = {};
  const sortedData = [...neuroRmsData].sort((a, b) => a.ppId - b.ppId);

  // Build cumulative RMS arrays per lobe
  sortedData.forEach(({ ppId, lobes }) => {
    Object.entries(lobes).forEach(([lobeName, values]) => {
      if (!lobeMap[lobeName]) {
        lobeMap[lobeName] = {
          ppIds: [],
          rms: [],
          deltaRms: []
        };
      }

      lobeMap[lobeName].ppIds.push(ppId);
      lobeMap[lobeName].rms.push(values.RMS);
      lobeMap[lobeName].deltaRms.push(values.deltaRMS);
    });
  });

  const result = {};

  Object.entries(lobeMap).forEach(([lobeName, arrays]) => {
    result[lobeName] = {
      proficiency: [],
      growth: []
    };

    //  Compute cognitive load PER PP (cumulative)
    for (let i = 0; i < arrays.ppIds.length; i++) {
      const xSlice = arrays.ppIds.slice(0, i + 1);
      const rmsSlice = arrays.rms.slice(0, i + 1);
      const deltaSlice = arrays.deltaRms.slice(0, i + 1);

      result[lobeName].proficiency.push({
        ppId: arrays.ppIds[i],
        value: xSlice.length < 2 ? "0.000" : cognitiveNS(xSlice, rmsSlice)
      });

      result[lobeName].growth.push({
        ppId: arrays.ppIds[i],
        value: xSlice.length < 2 ? "0.000" : cognitiveNS(xSlice, deltaSlice)
      });
    }
  });

  return result;
}


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
          candidate.competencyResults = competencyByCandidate[candidate.candidateId] || [];
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
      
      const needAssessmentByCandidate = {};

      // Group by candidateId
      needAssessments.forEach(na => {
        if (!needAssessmentByCandidate[na.candidateId]) {
          needAssessmentByCandidate[na.candidateId] = [];
        }

        needAssessmentByCandidate[na.candidateId].push({
          ppId: na.ppId,
          benchmarkIds: JSON.parse(na.benchmarkIds || '[]'),
          bIds: JSON.parse(na.bIds || '[]'),
          observation: na.observation
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
        candidate.competencyResults =
          competencyByCandidate[candidate.candidateId] || [];
      });

      // ---------------------------
      // Need Assessments
      // ---------------------------
      const needAssessments = await needAssessment.findAll({
        where: { unitId },
        attributes: ['candidateId', 'ppId', 'benchmarkIds', 'bIds', 'observation']
      });

      const needAssessmentByCandidate = {};
      needAssessments.forEach(na => {
        if (!needAssessmentByCandidate[na.candidateId]) {
          needAssessmentByCandidate[na.candidateId] = [];
        }

        needAssessmentByCandidate[na.candidateId].push({
          ppId: na.ppId,
          benchmarkIds: JSON.parse(na.benchmarkIds || '[]'),
          bIds: JSON.parse(na.bIds || '[]'),
          observation: na.observation
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
        candidate.competencyResults = competencyData?.results || [];
      });

      // Need Assessments
      const needAssessments = await needAssessment.findAll({
        where: { unitId, candidateId },
        attributes: ['candidateId', 'ppId', 'benchmarkIds', 'bIds', 'observation']
      });
      grouped.candidates.forEach(candidate => {
        candidate.needAssessments = needAssessments.map(na => ({
          ppId: na.ppId,
          benchmarkIds: JSON.parse(na.benchmarkIds || '[]'),
          bIds: JSON.parse(na.bIds || '[]'),
          observation: na.observation
        }));
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

