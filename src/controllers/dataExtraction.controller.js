const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');

// GET Insert Scores by Unit ID
exports.getInsertScoresByUnitId = async (req, res) => {
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

      res.status(200).json(grouped);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error fetching insert scores by blockId', error: error.message });
    }
};


// GET Insert Scores by Client ID
exports.getInsertScoresByClientId = async (req, res) => {
    try {
      const { clientId } = req.params;
  
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }
  
      // 🔹 Fetch all units for this client
      const units = await Unit.findAll({
        where: { clientId },
        attributes: ["id", "unitName", "unitStartDate", "unitEndDate", "unitType", "environment", "signatureProfile"],
        raw: true
      });
  
      if (!units.length) {
        return res.status(404).json({ message: "No units found for this client" });
      }
  
      const clientData = {
        clientId,
        units: []
      };
  
      // 🔹 Process each unit
      for (const unit of units) {
        const unitId = unit.id;
  
        // Fetch all insert scores for this unit
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
  
        if (!scores.length) {
          clientData.units.push({ ...unit, candidates: [] });
          continue;
        }
  
        const grouped = {
          unit: { ...unit },
          candidates: []
        };
  
        scores.forEach(row => {
          // candidate level
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
  
        // extract candidate IDs for this unit
        const candidateIds = grouped.candidates.map(c => c.candidateId);
  
        // fetch competency ratios for this unit
        const mockReq = {
          query: {
            unitId: unitId,
            candidate_id: candidateIds.join(",")
          }
        };
        
        let competencyData = null;
        const mockRes = {
          status(code) { this.statusCode = code; return this; },
          json(data) { competencyData = data; return this; }
        };
        await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
  
        // attach results to candidates
        const competencyByCandidate = {};
        (competencyData?.results || []).forEach(r => {
          if (!competencyByCandidate[r.candidateId]) {
            competencyByCandidate[r.candidateId] = [];
          }
          competencyByCandidate[r.candidateId].push(r);
        });
        grouped.candidates.forEach(candidate => {
          candidate.competencyResults = competencyByCandidate[candidate.candidateId] || [];
        });
  
        clientData.units.push(grouped);
      }
  
      res.status(200).json(clientData);
  
    } catch (error) {
      console.error("Error fetching insert scores by clientId:", error);
      res.status(500).json({ message: 'Error fetching insert scores by clientId', error: error.message });
    }
  };
