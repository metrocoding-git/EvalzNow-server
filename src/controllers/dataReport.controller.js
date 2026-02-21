const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;
const needAssessment = db.CandidateNeedAssessment;
const UnitRoster = db.UnitRoster;
const LeaderMarks = db.LeaderMarks
const CandidateMarks = db.CandidateMarks;
const UnitImprovement = db.UnitImprovement;
const Client = db.Client
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const { getNeuroScienceRmsValues } = require('./neuroScience.controller');
const { getAssessmentChainData, getNeedAssessmentStatusSummary, getEffortBu } = require('./auxiliaryResultant.controller');
const { getUnitSuccessRatesByThreshold, getGlobalAnalyticsDataByUnit } = require('./globalAnalytics.controller');

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

const calculateRosterPercentages = (roster) => {
  const {
    presentCount = 0,
    excusedAbsences = 0,
    unexcusedAbsences = 0,
    excusedTardies = 0,
    unexcusedTardies = 0
  } = roster;

  const total =
    presentCount +
    excusedAbsences +
    unexcusedAbsences +
    excusedTardies +
    unexcusedTardies;

  if (!total) {
    return {
      present: 0,
      excusedAbsences: 0,
      unexcusedAbsences: 0,
      excusedTardies: 0,
      unexcusedTardies: 0
    };
  }

  return {
    present: +(presentCount / total ).toFixed(3),
    excusedAbsences: +(excusedAbsences / total).toFixed(3),
    unexcusedAbsences: +(unexcusedAbsences / total).toFixed(3),
    excusedTardies: +(excusedTardies / total).toFixed(3),
    unexcusedTardies: +(unexcusedTardies / total).toFixed(3)
  };
};

const calculateEngageLevelPercentages = (scores) => {
  const levels = ["High", "Medium", "Low", "N/A"];
  const total = scores.length;

  const counts = {
    High: 0,
    Medium: 0,
    Low: 0,
    "N/A": 0
  };

  scores.forEach(s => {
    const level = s.engageLevel ?? "N/A";
    if (counts[level] !== undefined) {
      counts[level]++;
    } else {
      counts["N/A"]++;
    }
  });

  const percentages = {};
  levels.forEach(level => {
    percentages[level] = total
      ? +(counts[level] / total).toFixed(3)
      : 0;
  });

  return {
    total,
    counts,
    percentages
  };
};

const calculateUnitTabulationAverages = (candidates, unitType, signatureProfile) => {
  const bucket = {};

  const EXCLUDE_KEYS = new Set([
    "candidateId",
    "ppId",
    "IC",
    "STAP",
    "STAG"
  ]);

  // 1️⃣ Collect all numeric values from candidate competencyAverages
  candidates.forEach(candidate => {
    const avgRow = candidate.competencyAverages?.[0];
    if (!avgRow) return;

    Object.entries(avgRow).forEach(([key, value]) => {
      if (EXCLUDE_KEYS.has(key)) return;
      if (value === null || typeof value !== "number") return;

      if (!bucket[key]) bucket[key] = [];
      bucket[key].push(value);
    });
  });

  // 2️⃣ Compute averages for each metric
  const averages = Object.entries(bucket).map(([metric, values]) => ({
    metric,
    value: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(3),
    candidatesCount: values.length
  }));

  // 3️⃣ Derived indicators: STAP and STAG
  const stapStatus = calculateAverageSTAP(averages, unitType);
  const stagStatus = calculateAverageSTAG(averages, unitType);
  const count = averages[0]?.candidatesCount ?? 0;

  averages.push(
    {
      metric: "STAP",
      value: stapStatus,
      candidatesCount: count
    },
    {
      metric: "STAG",
      value: stagStatus,
      candidatesCount: count
    }
  );

  // 4️⃣ Compute average IC and add it to tabulationAverages
  const getMetricValue = (name) => averages.find(a => a.metric === name)?.value ?? 0;
  const avgRR = getMetricValue("RRN");
  const avgPR = getMetricValue("PRN");
  const avgAR = getMetricValue("ARN");

  const avgIC = calculateInteractionClass(avgRR, avgPR, avgAR, unitType, signatureProfile);

  averages.push({
    metric: "IC",
    value: avgIC,
    candidatesCount: count
  });

  return averages;
};



// Case 1
function GetInteractionClassForCase1(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2));
  return GetInteractionClassAreaCase1(eqn);
}

// Case 2
function GetInteractionClassForCase2(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3));
  return GetInteractionClassAreaCase2(eqn);
}

// Case 3a
function GetInteractionClassForCase3a(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2));
  return GetInteractionClassAreaCase3a(eqn);
}

// Case 3b
function GetInteractionClassForCase3b(rr, pr) {
  const eqn = Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3));
  return GetInteractionClassAreaCase3b(eqn);
}

// Third Parameter (3D)
function GetInteractionClassForThird(rr, pr, ar) {
  const eqn = Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2));
  return GetInteractionClassAreaThird(eqn);
}

// --- Area lookup tables ---

function GetInteractionClassAreaCase1(eqn) {
  if (eqn < 0.6) return "0R0P";
  else if (eqn < 0.7) return "1R1P";
  else if (eqn < 0.8) return "2R2P";
  else if (eqn < 0.9) return "3R3P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

function GetInteractionClassAreaCase2(eqn) {
  if (eqn < 0.71138) return "0R0P";
  else if (eqn < 0.78837) return "1R1P";
  else if (eqn < 0.86177) return "2R2P";
  else if (eqn < 0.93217) return "3R3P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

function GetInteractionClassAreaCase3a(eqn) {
  if (eqn < 0.6) return "0R0P";
  else if (eqn < 0.7) return "0R1P";
  else if (eqn < 0.711379) return "0R2P";
  else if (eqn < 0.788374) return "1R2P";
  else if (eqn < 0.8) return "2R2P";
  else if (eqn < 0.86177) return "2R3P";
  else if (eqn < 0.9) return "3R3P";
  else if (eqn < 0.93217) return "3R4P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

function GetInteractionClassAreaCase3b(eqn) {
  if (eqn < 0.6) return "0R0P";
  else if (eqn < 0.7) return "1R0P";
  else if (eqn < 0.711379) return "2R0P";
  else if (eqn < 0.788374) return "2R1P";
  else if (eqn < 0.8) return "2R2P";
  else if (eqn < 0.86177) return "3R2P";
  else if (eqn < 0.9) return "3R3P";
  else if (eqn < 0.93217) return "4R3P";
  else if (eqn < 1.0) return "4R4P";
  else return "5R5P";
}

// function GetInteractionClassAreaThird(eqn) {
//   if (eqn < 0.6) return 0;
//   else if (eqn < 0.7) return 1;
//   else if (eqn < 0.8) return 2;
//   else if (eqn < 0.9) return 3;
//   else if (eqn < 1.0) return 4;
//   else return 5;
// }
function GetInteractionClassAreaThird(eqn) {
  if (eqn < 0.6) return '0R0P';
  else if (eqn >= 0.6 && eqn < 0.7) return '1R1P';
  else if (eqn >= 0.7 && eqn < 0.8) return '2R2P';
  else if (eqn >= 0.8 && eqn < 0.9) return '3R3P';
  else if (eqn >= 0.9 && eqn < 1.0) return '4R4P';
  else return '5R5P';
}

// --- Unified router function ---
function calculateInteractionClass(rr, pr, ar, unitType, signatureProfile) {
  const rrVal = rr ?? 0;
  const prVal = pr ?? 0;
  const arVal = ar ?? 0;

  if (unitType === "Third Parameter") {
    return GetInteractionClassForThird(rrVal, prVal, arVal);
  }

  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    switch (signatureProfile) {
      case "Case 1: Solid Balanced":
        return GetInteractionClassForCase1(rrVal, prVal);
      case "Case 2: Rigorous Balanced":
        return GetInteractionClassForCase2(rrVal, prVal);
      case "Case 3a: Productive-Weighted":
        return GetInteractionClassForCase3a(rrVal, prVal);
      case "Case 3b: Receptive-Weighed":
        return GetInteractionClassForCase3b(rrVal, prVal);
      default:
        return null;
    }
  }

  return null;
}
  
async function buildAssessmentSummary(unitId, candidateIds) {
  const req = {
    params: {
      unitId,
      candidate_id: candidateIds.map(String).join(",")
    }
  };

  let result = null;

  const res = {
    status() { return this; },
    json(data) { result = data; }
  };

  await getNeedAssessmentStatusSummary(req, res);
  return result;
}



  
exports.getDataReportByUnitCandidate = async (req, res) => {
    try {
      const { unitId, candidateId } = req.params;
  
      if (!unitId || !candidateId) {
        return res.status(400).json({
          message: "unitId and candidateId are required"
        });
      }
  
      // 1️⃣ Fetch SINGLE unit
      const unit = await Unit.findOne({
        where: { id: unitId },
        include: [
            {
              model: db.StaffLookup,
              as: "staffAssignments",
              include: [
                {
                  model: db.Staff,
                  as: "staff",
                  attributes: ["id", "lastName", "firstName"]
                }
              ]
            },
            {
                model: db.Benchmark,
                as: "benchmarks",
            }
        ],
        
      });
  
      if (!unit) {
        return res.status(404).json({ message: "Unit not found" });
      }

      const rosterData = await UnitRoster.findAll({ 
        where: { unitId, candidateId}
      });
  
      const unitRosterTotalCount = await UnitRoster.count({
        where: { unitId }
      });
      
      const unitRosterAll = await UnitRoster.findAll({
        where: { unitId }
      });
      
      // 2️⃣ Fetch scores for ONE unit + ONE candidate
      const scores = await InsertScore.findAll({
        where: {
          unitId,
          candidate_id: candidateId
        },
        include: [
          { model: AssessmentBlockManager, as: "assessmentBlock" },
          { model: Unit, as: "unit" },
          { model: Candidate, as: "candidate", include: [ {model: db.Irregularity, as: "irregularities"}, ] }
        ],
        order: [
          ["ppId", "ASC"],
          ["criticalRefDate", "ASC"]
        ]
      });


      const marks = await CandidateMarks.findAll({
        where: { unitId, candidateId },
        order: [["entryNumber", "ASC"]],
      });
  
      const response = {
        unit: {
          ...unit.toJSON(),
          candidates: []
        }
      };

      response.unit.rosterStats = {
        totalCount: unitRosterTotalCount
      };
      
  
      if (!scores.length) {
        return res.status(200).json(response);
      }
  
      // 3️⃣ Build candidate + PP structure
      const candidate = {
        candidateId: scores[0].candidate.id,
        candidateCode: scores[0].candidate.candidateId,
        firstName: scores[0].candidate.firstName,
        lastName: scores[0].candidate.lastName,
        nationality: scores[0].candidate.nationality,
        gender: scores[0].candidate.gender,
        ethnicity: scores[0].candidate.ethnicity,
        income: scores[0].candidate.income,
        religion: scores[0].candidate.religion,
        maritalStatus: scores[0].candidate.maritalStatus,
        jobType: scores[0].candidate.jobType,
        dateOfBirth: scores[0].candidate.dateOfBirth,
        candidateStartDate: scores[0].candidate.startDate,
        specialIdNo: scores[0].candidate.specialIdNo,
        pps: [],
        roster: [],
        scores: [],
        competencyResults: [],
        competencyAverages: [],
        competencyCumalative: [],
        competencycumulativeAverages: [],
        needAssessments: [],
        candidateMarks: [],
        assessmentChain: [],
        neuroScienceRms: {}
      };

      candidate.roster = rosterData.map(r => {
        const plain = r.toJSON();
      
        return {
          ...plain,
          percentages: calculateRosterPercentages(plain)
        };
      });
      

      candidate.scores = scores.map(s => s.toJSON());

      candidate.engageLevelStats = calculateEngageLevelPercentages(candidate.scores);

      candidate.candidateMarks = marks.map(m => m.toJSON());
  
      scores.forEach(row => {
        if (!candidate.pps.find(p => p.ppId === row.ppId)) {
          candidate.pps.sort((a, b) => {
            const aId = a.ppId;
            const bId = b.ppId;
          
            // negatives first
            if (aId < 0 && bId > 0) return -1;
            if (aId > 0 && bId < 0) return 1;
          
            // both negative → sort by absolute value
            if (aId < 0 && bId < 0) {
              return Math.abs(aId) - Math.abs(bId);
            }
          
            // both positive → normal ascending
            return aId - bId;
          }).push({
            ppId: row.ppId,
            shortDescription: row.assessmentBlock?.shortDescription,
            periodType: row.assessmentBlock?.periodType,
            delivery: row.assessmentBlock?.delivery
          });
        }
      });
  
      //  Competency ratios
      const mockReq = {
        query: { unitId, candidate_id: candidateId }
      };
      let competencyData = null;
  
      const mockRes = {
        status() { return this; },
        json(data) { competencyData = data; }
      };
  
      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
      candidate.competencyResults = competencyData?.results || [];
      candidate.competencyAverages = competencyData?.averages || [];
      candidate.competencyCumalative = competencyData?.cumulativeSums || [];
      candidate.competencycumulativeAverages = competencyData?.cumulativeAverages || [];
  
      candidate.competencyResults.sort((a, b) => {
        const aId = a.ppId;
        const bId = b.ppId;
      
        // negatives first
        if (aId < 0 && bId > 0) return -1;
        if (aId > 0 && bId < 0) return 1;
      
        // both negative → sort by absolute value
        if (aId < 0 && bId < 0) {
          return Math.abs(aId) - Math.abs(bId);
        }
      
        // both positive → normal ascending
        return aId - bId;
      });

      candidate.scores.sort((a, b) => {
        const aId = a.ppId;
        const bId = b.ppId;
      
        // negatives first
        if (aId < 0 && bId > 0) return -1;
        if (aId > 0 && bId < 0) return 1;
      
        // both negative → sort by absolute value
        if (aId < 0 && bId < 0) {
          return Math.abs(aId) - Math.abs(bId);
        }
      
        // both positive → normal ascending
        return aId - bId;
      });
      
      //  Need assessments
      const needAssessments = await needAssessment.findAll({
        where: { unitId, candidateId },
        attributes: ["ppId", "benchmarkIds", "bIds", "observation"]
      });
  
      candidate.needAssessments = needAssessments.map(na => ({
        ppId: na.ppId,
        benchmarkIds: JSON.parse(na.benchmarkIds || "[]"),
        bIds: JSON.parse(na.bIds || "[]"),
        observation: na.observation
      }));
  
      candidate.needAssessments.sort((a, b) => {
        const aId = a.ppId;
        const bId = b.ppId;
      
        // negatives first
        if (aId < 0 && bId > 0) return -1;
        if (aId > 0 && bId < 0) return 1;
      
        // both negative → sort by absolute value
        if (aId < 0 && bId < 0) {
          return Math.abs(aId) - Math.abs(bId);
        }
      
        // both positive → normal ascending
        return aId - bId;
      });

      //  Neuro science RMS + cognitive load
      const neuroReq = {
        params: { unitId, candidateId },
        query: {}
      };
      let neuroData = null;
  
      const neuroRes = {
        status() { return this; },
        json(payload) { neuroData = payload; }
      };
  
      await getNeuroScienceRmsValues(neuroReq, neuroRes);
  
      candidate.neuroScienceRms = neuroData?.data?.length
        ? {
            count: neuroData.count,
            data: neuroData.data,
            cognitiveLoad: calculateCognitiveLoadPerLobe(neuroData.data)
          }
        : {
            count: 0,
            data: [],
            cognitiveLoad: {}
          };

      // Assessment Chain data
      const chainReq = {
        params: { unitId, candidateId }
      };

      let chainData = null;

      const chainRes = {
        status() { return this; },
        json(payload) {
          chainData = payload;
          return this;
        }
      };

      await getAssessmentChainData(chainReq, chainRes);

      candidate.assessmentChain = chainData?.results || [];
  
      response.unit.candidates.push(candidate);
  
      res.status(200).json(response);
  
    } catch (error) {
      console.error("Error fetching unit candidate report:", error);
      res.status(500).json({
        message: "Error fetching unit candidate report",
        error: error.message
      });
    }
  };

  exports.getDataReportByUnitAllCandidates = async (req, res) => {
    try {
      const { unitId } = req.params;
  
      if (!unitId) {
        return res.status(400).json({ message: "unitId is required" });
      }
  
      // 1️⃣ Fetch unit ONCE
      const unit = await Unit.findOne({
        where: { id: unitId },
        include: [
            {
              model: db.StaffLookup,
              as: "staffAssignments",
              required: false,
              include: [
                {
                  model: db.Staff,
                  required: false,
                  as: "staff",
                  attributes: ["id", "lastName", "firstName"]
                }
              ]
            },
            {
                model: db.Benchmark,
                required: false,
                as: "benchmarks",
            }
        ],
        
      });
  
      // if (!unit) {
      //   return res.status(404).json({ message: "Unit not found" });
      // }
  
      // 2️⃣ Get DISTINCT candidateIds (UnitRoster first)
      const rosterCandidates = await UnitRoster.findAll({
        where: { unitId },
        attributes: [
          [db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidateId")), "candidateId"]
        ],
        raw: true
      });
  
      let candidateIds = rosterCandidates.map(r => r.candidateId);
  
      // fallback → InsertScore
      if (!candidateIds.length) {
        const scoreCandidates = await InsertScore.findAll({
          where: { unitId },
          attributes: [
            [db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidate_id")), "candidateId"]
          ],
          raw: true
        });
  
        candidateIds = scoreCandidates.map(s => s.candidateId);
      }
  
      const response = {
        unit: {
          ...unit.toJSON(),
          candidates: []
        }
      };
  
      if (!candidateIds.length) {
        return res.status(200).json(response);
      }
  
      // 3️⃣ Iterate candidates
      for (const candidateId of candidateIds) {
  
        // Scores
        const scores = await InsertScore.findAll({
          where: { unitId, candidate_id: candidateId },
          include: [
            { model: AssessmentBlockManager, as: "assessmentBlock" },
            { model: Unit, as: "unit" },
            { model: Candidate, as: "candidate" }
          ],
          order: [
            ["ppId", "ASC"],
            ["criticalRefDate", "ASC"]
          ]
        });
  
        if (!scores.length) continue;
  
        // Roster
        const rosterData = await UnitRoster.findAll({
          where: { unitId, candidateId }
        });
  
        // Marks
        const marks = await CandidateMarks.findAll({
          where: { unitId, candidateId },
          order: [["entryNumber", "ASC"]]
        });
  
        // Candidate base
        const candidate = {
          candidateId: scores[0].candidate.id,
          candidateCode: scores[0].candidate.candidateId,
          firstName: scores[0].candidate.firstName,
          lastName: scores[0].candidate.lastName,
          nationality: scores[0].candidate.nationality,
          gender: scores[0].candidate.gender,
          ethnicity: scores[0].candidate.ethnicity,
          income: scores[0].candidate.income,
          religion: scores[0].candidate.religion,
          maritalStatus: scores[0].candidate.maritalStatus,
          jobType: scores[0].candidate.jobType,
          dateOfBirth: scores[0].candidate.dateOfBirth,
          candidateStartDate: scores[0].candidate.startDate,
          specialIdNo: scores[0].candidate.specialIdNo,
          pps: [],
          roster: [],
          scores: [],
          competencyResults: [],
          competencyAverages: [],
          competencyCumalative: [],
          competencycumulativeAverages: [],
          needAssessments: [],
          candidateMarks: [],
          assessmentChain: [],
          neuroScienceRms: {}
        };
  
        // Roster mapping
        candidate.roster = rosterData.map(r => {
          const plain = r.toJSON();
          return {
            ...plain,
            percentages: calculateRosterPercentages(plain)
          };
        });
  
        // Scores
        candidate.scores = scores.map(s => s.toJSON());
        candidate.engageLevelStats = calculateEngageLevelPercentages(candidate.scores);
        candidate.candidateMarks = marks.map(m => m.toJSON());
  
        // PP list
        scores.forEach(row => {
          if (!candidate.pps.find(p => p.ppId === row.ppId)) {
            candidate.pps.push({
              ppId: row.ppId,
              shortDescription: row.assessmentBlock?.shortDescription,
              periodType: row.assessmentBlock?.periodType,
              delivery: row.assessmentBlock?.delivery
            });
          }
        });
  
        // Competency
        const mockReq = { query: { unitId, candidate_id: candidateId } };
        let competencyData = null;
  
        const mockRes = {
          status() { return this; },
          json(data) { competencyData = data; }
        };
  
        await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
  
        candidate.competencyResults = competencyData?.results || [];
        candidate.competencyAverages = competencyData?.averages || [];
        candidate.competencyCumalative = competencyData?.cumulativeSums || [];
        candidate.competencycumulativeAverages = competencyData?.cumulativeAverages || [];
  
        // Need assessment
        const needAssessments = await needAssessment.findAll({
          where: { unitId, candidateId },
          attributes: ["ppId", "benchmarkIds", "bIds", "observation"]
        });
  
        candidate.needAssessments = needAssessments.map(na => ({
          ppId: na.ppId,
          benchmarkIds: JSON.parse(na.benchmarkIds || "[]"),
          bIds: JSON.parse(na.bIds || "[]"),
          observation: na.observation
        }));
  
        // Neuro RMS
        const neuroReq = { params: { unitId, candidateId }, query: {} };
        let neuroData = null;
  
        const neuroRes = {
          status() { return this; },
          json(payload) { neuroData = payload; }
        };
  
        await getNeuroScienceRmsValues(neuroReq, neuroRes);
  
        candidate.neuroScienceRms = neuroData?.data?.length
          ? {
              count: neuroData.count,
              data: neuroData.data,
              cognitiveLoad: calculateCognitiveLoadPerLobe(neuroData.data)
            }
          : { count: 0, data: [], cognitiveLoad: {} };
  
        // Assessment chain
        const chainReq = { params: { unitId, candidateId } };
        let chainData = null;
  
        const chainRes = {
          status() { return this; },
          json(payload) { chainData = payload; }
        };
  
        await getAssessmentChainData(chainReq, chainRes);
        candidate.assessmentChain = chainData?.results || [];
  
        response.unit.candidates.push(candidate);
      }
  
      return res.status(200).json(response);
  
    } catch (error) {
      console.error("Error fetching unit report:", error);
      res.status(500).json({
        message: "Error fetching unit report",
        error: error.message
      });
    }
  };

  function calculateSTAP(RRNValue, PRNValue, ARNValue, MSIPValue, unitType) {
    const rrn = RRNValue ?? 0;
    const prn = PRNValue ?? 0;
    const arn = ARNValue ?? 0;
    const msip = MSIPValue ?? 0;
  
    if (
      rrn >= 0.7 &&
      prn >= 0.7 &&
      (unitType !== "Third Parameter" || arn >= 0.7) &&
      msip < 0
    ) {
      return "STABLE";
    } else {
      return "UNSTABLE";
    }
  }
  
  
  const calculateSTAG = (deltaRRN, deltaPRN, deltaARN, msipValue, type) => {

    if (deltaRRN > 0 && deltaPRN > 0 && (type !== "Third Parameter" || deltaARN > 0) && msipValue < 0) {
      return 'STABLE'
    }
    else {
      return 'UNSTABLE'
    }
  }

  const calculateAverageSTAP = (tabulationAverages, unitType) => {
    const getMetric = (name) =>
      tabulationAverages.find(a => a.metric === name)?.value ?? null;
  
    const avgRRN  = getMetric("RRN");
    const avgPRN  = getMetric("PRN");
    const avgARN  = getMetric("ARN");
    const avgMSIP = getMetric("MSIP");
  
    return calculateSTAP(
      avgRRN,
      avgPRN,
      avgARN,
      avgMSIP,
      unitType
    );
  };
  

  const calculateAverageSTAG = (tabulationAverages, unitType) => {
    const getMetric = (name) =>
      tabulationAverages.find(a => a.metric === name)?.value ?? null;
  
    const avgDeltaRRN = getMetric("deltaRRN");
    const avgDeltaPRN = getMetric("deltaPRN");
    const avgDeltaARN = getMetric("deltaARN");
    const avgMSIP     = getMetric("MSIP");
  
    return calculateSTAG(
      avgDeltaRRN,
      avgDeltaPRN,
      avgDeltaARN,
      avgMSIP,
      unitType
    );
  };
  

  function calculateStableFraction(data, key) {
    if (!Array.isArray(data) || !data.length) return 0;
  
    let stable = 0;
    let total = 0;
  
    data.forEach(item => {
      const value = item[key];
      if (value === "STABLE" || value === "UNSTABLE") {
        total++;
        if (value === "STABLE") stable++;
      }
    });
  
    return total === 0 ? 0 : stable / total;
  }

  async function buildUnitReport(unitId) {
    const unitRosterAccumulator = {
      presentCount: 0,
      excusedAbsences: 0,
      unexcusedAbsences: 0,
      excusedTardies: 0,
      unexcusedTardies: 0
    };
  
    const unit = await Unit.findOne({
      where: { id: unitId },
      include: [
        {
          model: db.StaffLookup,
          as: "staffAssignments",
          required: false,
          include: [
            {
              model: db.Staff,
              as: "staff",
              attributes: ["id", "firstName", "lastName"]
            }
          ]
        },
        {
          model: db.Benchmark,
          as: "benchmarks",
          required: false
        }
      ]
    });
  
    if (!unit) return null;
  
    // Get distinct candidate IDs from UnitRoster
    let rosterCandidates = await UnitRoster.findAll({
      where: { unitId },
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("candidateId")), "candidateId"]],
      raw: true
    });
  
    let candidateIds = rosterCandidates.map(r => r.candidateId);
  
    // Fallback: get candidate IDs from InsertScore
    if (!candidateIds.length) {
      const scoreCandidates = await InsertScore.findAll({
        where: { unitId },
        attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("candidate_id")), "candidateId"]],
        raw: true
      });
      candidateIds = scoreCandidates.map(s => s.candidateId);
    }
  
    if (!candidateIds.length) return { ...unit.toJSON(), candidates: [], tabulationAverages: [], averageInteractionClass: 0 };
  
    const candidateIdList = candidateIds.join(",");
    const unitScoreBucket = [];

    let unitStapStableCount = 0;
    let unitStagStableCount = 0;
    let unitCompetencyCandidateCount = 0;
    const candidates = [];
  
    // Build candidates
    for (const candidateId of candidateIds) {
      const scores = await InsertScore.findAll({
        where: { unitId, candidate_id: candidateId },
        include: [
          { model: AssessmentBlockManager, as: "assessmentBlock" },
          { model: Candidate, as: "candidate" }
        ],
        order: [["ppId", "ASC"], ["criticalRefDate", "ASC"]]
      });
  
      if (!scores.length) continue;
  
      // Roster
      const rosterData = await UnitRoster.findAll({ where: { unitId, candidateId } });
      rosterData.forEach(r => {
        unitRosterAccumulator.presentCount += r.presentCount || 0;
        unitRosterAccumulator.excusedAbsences += r.excusedAbsences || 0;
        unitRosterAccumulator.unexcusedAbsences += r.unexcusedAbsences || 0;
        unitRosterAccumulator.excusedTardies += r.excusedTardies || 0;
        unitRosterAccumulator.unexcusedTardies += r.unexcusedTardies || 0;
      });
  
      // Marks
      const marks = await CandidateMarks.findAll({ where: { unitId, candidateId } });
      const leaderMarks = await LeaderMarks.findAll({ where: { unitId, candidateId } });
      const unitImprovement = await UnitImprovement.findAll({ where: { unitId, candidateId } });
  
      // Base candidate object
      const candidate = {
        candidateId: scores[0].candidate.id,
        candidateCode: scores[0].candidate.candidateId,
        firstName: scores[0].candidate.firstName,
        lastName: scores[0].candidate.lastName,
        nationality: scores[0].candidate.nationality,
        gender: scores[0].candidate.gender,
        ethnicity: scores[0].candidate.ethnicity,
        income: scores[0].candidate.income,
        religion: scores[0].candidate.religion,
        maritalStatus: scores[0].candidate.maritalStatus,
        jobType: scores[0].candidate.jobType,
        dateOfBirth: scores[0].candidate.dateOfBirth,
        candidateStartDate: scores[0].candidate.startDate,
        specialIdNo: scores[0].candidate.specialIdNo,
        pps: [],
        roster: rosterData.map(r => ({ ...r.toJSON(), percentages: calculateRosterPercentages(r.toJSON()) })),
        scores: scores.map(s => s.toJSON()),
        candidateMarks: marks.map(m => m.toJSON()),
        leaderMarks: leaderMarks.map(l => l.toJSON()),
        unitImprovement: unitImprovement.map(u => u.toJSON()),
        effortBu: [],
        competencyResults: [],
        competencyAverages: [],
        competencyCumalative: [],
        competencycumulativeAverages: [],
        needAssessments: [],
        engageLevelStats: calculateEngageLevelPercentages(scores.map(s => s.toJSON()))
      };
  
      unitScoreBucket.push(...candidate.scores);
  
      // PP list
      scores.forEach(row => {
        if (!candidate.pps.find(p => p.ppId === row.ppId)) {
          candidate.pps.push({
            ppId: row.ppId,
            shortDescription: row.assessmentBlock?.shortDescription,
            periodType: row.assessmentBlock?.periodType,
            delivery: row.assessmentBlock?.delivery
          });
        }
      });
  
      // Competency
      const mockReq = { query: { unitId: String(unitId), candidate_id: String(candidateId) } };
      const mockRes = { status() { return this; }, json(data) { Object.assign(candidate, {
        competencyResults: data?.results || [],
        competencyAverages: data?.averages || [],
        competencyCumalative: data?.cumulativeSums || [],
        competencycumulativeAverages: data?.cumulativeAverages || []
      }); }};
  
      await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);

      // ✅ Unit-level STAP / STAG aggregation
      if (candidate.competencyAverages.length) {
        unitCompetencyCandidateCount++;

        const avg = candidate.competencyAverages[0]; // one average per candidate

        if (avg.STAP === "STABLE") unitStapStableCount++;
        if (avg.STAG === "STABLE") unitStagStableCount++;
      }
  
      // Effort BU
      const effortReq = { params: { unitId: String(unitId), candidate_id: String(candidateId) } };
      let effortBU = null;
      await getEffortBu(effortReq, { status() { return this; }, json(d) { effortBU = d; } });
      candidate.effortBu = effortBU || [];
  
      // Need assessment
      const needAssessments = await needAssessment.findAll({
        where: { unitId, candidateId },
        attributes: ["ppId", "benchmarkIds", "bIds", "observation"]
      });
      candidate.needAssessments = needAssessments.map(na => ({
        ppId: na.ppId,
        benchmarkIds: JSON.parse(na.benchmarkIds || "[]"),
        bIds: JSON.parse(na.bIds || "[]"),
        observation: na.observation
      }));
  
      candidates.push(candidate);
    }
  
    let assessmentSummary = null;

    const assessmentTrackReq = {
      params: {
        unitId: String(unitId),
        candidate_id: candidateIdList
      }
    };

    const assessmentTrackRes = {
      status() { return this; },
      json(payload) {
        assessmentSummary = payload;
        return this;
      }
    };

    await getNeedAssessmentStatusSummary(assessmentTrackReq, assessmentTrackRes);

    const competencyStability = {
      stapStableFraction:
        unitCompetencyCandidateCount === 0
          ? 0
          : unitStapStableCount / unitCompetencyCandidateCount,
    
      stagStableFraction:
        unitCompetencyCandidateCount === 0
          ? 0
          : unitStagStableCount / unitCompetencyCandidateCount
    };

    // Build tabulation averages
    const tabulationAverages = calculateUnitTabulationAverages(candidates, unit.unitType, unit.signatureProfile);
  
    // Compute unit-level average Interaction Class
    const avgRR = tabulationAverages.find(t => t.metric === "RRN")?.value ?? 0;
    const avgPR = tabulationAverages.find(t => t.metric === "PRN")?.value ?? 0;
    const avgAR = tabulationAverages.find(t => t.metric === "ARN")?.value ?? 0;
    const averageInteractionClass = calculateInteractionClass(avgRR, avgPR, avgAR, unit.unitType, unit.signatureProfile);
  
    const rosterTotalCount = await UnitRoster.count({ where: { unitId } });
    return {
      ...unit.toJSON(),
      candidates,
      engageLevelStats: calculateEngageLevelPercentages(unitScoreBucket),
      rosterPercentages: calculateRosterPercentages(unitRosterAccumulator),
      tabulationAverages,
      rosterStats: { totalCount: rosterTotalCount },
      averageInteractionClass,
      assessmentSummary,
      competencyStability
    };
  }
  

  exports.getDataReportByUnit = async (req, res) => {
    try {
      const { unitId } = req.params;
  
      if (!unitId) {
        return res.status(400).json({ message: "unitId is required" });
      }

      const unitRosterAccumulator = {
        presentCount: 0,
        excusedAbsences: 0,
        unexcusedAbsences: 0,
        excusedTardies: 0,
        unexcusedTardies: 0
      };
      
  
      // 1️⃣ Fetch unit ONCE
      const unit = await Unit.findOne({
        where: { id: unitId },
        include: [
            {
              model: db.StaffLookup,
              as: "staffAssignments",
              required: false,
              include: [
                {
                  model: db.Staff,
                  required: false,
                  as: "staff",
                  attributes: ["id", "lastName", "firstName"]
                }
              ]
            },
            {
                model: db.Benchmark,
                required: false,
                as: "benchmarks",
            }
        ],
        
      });
  
      // if (!unit) {
      //   return res.status(404).json({ message: "Unit not found" });
      // }
  
      // 2️⃣ Get DISTINCT candidateIds (UnitRoster first)
      const rosterCandidates = await UnitRoster.findAll({
        where: { unitId },
        attributes: [
          [db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidateId")), "candidateId"]
        ],
        raw: true
      });
  
      let candidateIds = rosterCandidates.map(r => r.candidateId);
      const candidateIdList = candidateIds.map(String).join(",");
  
      // fallback → InsertScore
      if (!candidateIds.length) {
        const scoreCandidates = await InsertScore.findAll({
          where: { unitId },
          attributes: [
            [db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidate_id")), "candidateId"]
          ],
          raw: true
        });
  
        candidateIds = scoreCandidates.map(s => s.candidateId);
      }
  
      const response = {
        unit: {
          ...unit.toJSON(),
          candidates: []
        }
      };
  
      if (!candidateIds.length) {
        return res.status(200).json(response);
      }

      const unitRosterTotalCount = await UnitRoster.count({
        where: { unitId }
      });

      response.unit.rosterStats = {
        totalCount: unitRosterTotalCount
      };
  
      const unitScoreBucket = [];

      let unitStapStableCount = 0;
let unitStagStableCount = 0;
let unitCompetencyCandidateCount = 0;

      // 3️⃣ Iterate candidates
      for (const candidateId of candidateIds) {
  
        // Scores
        const scores = await InsertScore.findAll({
          where: { unitId, candidate_id: candidateId },
          include: [
            { model: AssessmentBlockManager, as: "assessmentBlock" },
            { model: Unit, as: "unit" },
            { model: Candidate, as: "candidate" }
          ],
          order: [
            ["ppId", "ASC"],
            ["criticalRefDate", "ASC"]
          ]
        });
  
        if (!scores.length) continue;
  
        // Roster
        const rosterData = await UnitRoster.findAll({
          where: { unitId, candidateId }
        });

        rosterData.forEach(r => {
          unitRosterAccumulator.presentCount += r.presentCount || 0;
          unitRosterAccumulator.excusedAbsences += r.excusedAbsences || 0;
          unitRosterAccumulator.unexcusedAbsences += r.unexcusedAbsences || 0;
          unitRosterAccumulator.excusedTardies += r.excusedTardies || 0;
          unitRosterAccumulator.unexcusedTardies += r.unexcusedTardies || 0;
        });
        
  
        // Marks
        const marks = await CandidateMarks.findAll({
          where: { unitId, candidateId },
          order: [["entryNumber", "ASC"]]
        });

        const leaderMarks = await LeaderMarks.findAll({
          where: {
            unitId,
            candidateId
          },
          order: [["entryNumber", "ASC"]]
        });

        const unitImprovement = await UnitImprovement.findAll({
          where: {
            unitId,
            candidateId
          },
          
        });
        
  
        // Candidate base
        const candidate = {
          candidateId: scores[0].candidate.id,
          candidateCode: scores[0].candidate.candidateId,
          firstName: scores[0].candidate.firstName,
          lastName: scores[0].candidate.lastName,
          nationality: scores[0].candidate.nationality,
          gender: scores[0].candidate.gender,
          ethnicity: scores[0].candidate.ethnicity,
          income: scores[0].candidate.income,
          religion: scores[0].candidate.religion,
          maritalStatus: scores[0].candidate.maritalStatus,
          jobType: scores[0].candidate.jobType,
          dateOfBirth: scores[0].candidate.dateOfBirth,
          candidateStartDate: scores[0].candidate.startDate,
          specialIdNo: scores[0].candidate.specialIdNo,
          pps: [],
          roster: [],
          scores: [],
          competencyResults: [],
          competencyAverages: [],
          competencyCumalative: [],
          competencycumulativeAverages: [],
          needAssessments: [],
          candidateMarks: [],
          leaderMarks: [],
          unitImprovement: [],
          assessmentChain: [],
          effortBu: [],
          neuroScienceRms: {}
        };
  
        // Roster mapping
        candidate.roster = rosterData.map(r => {
          const plain = r.toJSON();
          return {
            ...plain,
            percentages: calculateRosterPercentages(plain)
          };
        });
  
        // Scores
        candidate.scores = scores.map(s => s.toJSON());
        unitScoreBucket.push(...candidate.scores);
        candidate.engageLevelStats = calculateEngageLevelPercentages(candidate.scores);
        candidate.candidateMarks = marks.map(m => m.toJSON());
        candidate.leaderMarks = leaderMarks.map(lm => lm.toJSON());
        candidate.unitImprovement = unitImprovement.map(ui => ui.toJSON());

  
        // PP list
        scores.forEach(row => {
          if (!candidate.pps.find(p => p.ppId === row.ppId)) {
            candidate.pps.push({
              ppId: row.ppId,
              shortDescription: row.assessmentBlock?.shortDescription,
              periodType: row.assessmentBlock?.periodType,
              delivery: row.assessmentBlock?.delivery
            });
          }
        });
  
        // Competency
        const mockReq = { query: { unitId: String(unitId), candidate_id: String(candidateId) } };
        let competencyData = null;
  
        const mockRes = {
          status() { return this; },
          json(data) { competencyData = data; }
        };
  
        await getPpCompetencyRatioMultipleCandidate(mockReq, mockRes);
  
        candidate.competencyResults = competencyData?.results || [];
        candidate.competencyAverages = competencyData?.averages || [];
        candidate.competencyCumalative = competencyData?.cumulativeSums || [];
        candidate.competencycumulativeAverages = competencyData?.cumulativeAverages || [];
  
        if (candidate.competencyAverages.length) {
          unitCompetencyCandidateCount++;
        
          const avg = candidate.competencyAverages[0]; // ← ONE average per candidate
        
          if (avg.STAP === "STABLE") unitStapStableCount++;
          if (avg.STAG === "STABLE") unitStagStableCount++;
        }

        // effort BU - USD, CSD
        const effortBUReq = { params: { unitId: String(unitId), candidate_id: String(candidateId) } };
        let effortBU = null;
  
        const effortBURes = {
          status() { return this; },
          json(data) { effortBU = data; }
        };
  
        await getEffortBu(effortBUReq, effortBURes);
        candidate.effortBu = effortBU || [];

        // Need assessment
        const needAssessments = await needAssessment.findAll({
          where: { unitId, candidateId },
          attributes: ["ppId", "benchmarkIds", "bIds", "observation"]
        });
  
        candidate.needAssessments = needAssessments.map(na => ({
          ppId: na.ppId,
          benchmarkIds: JSON.parse(na.benchmarkIds || "[]"),
          bIds: JSON.parse(na.bIds || "[]"),
          observation: na.observation
        }));
  
        // Assessment Chain data
        const assessmentTrackReq = {
          params: { unitId: unitId, candidate_id: candidateIdList }
        };

        let assessmentTracking = null;

        const assessmentTrackRes = {
          status() { return this; },
          json(payload) {
            assessmentTracking = payload;
            return this;
          }
        };

        await getNeedAssessmentStatusSummary(assessmentTrackReq, assessmentTrackRes);
        response.unit.assessmentSummary = assessmentTracking;
       
        response.unit.candidates.push(candidate);

        response.unit.engageLevelStats = calculateEngageLevelPercentages(unitScoreBucket);
      }

      response.unit.competencyStability = {
        stapStableFraction:
          unitCompetencyCandidateCount === 0
            ? 0
            : unitStapStableCount / unitCompetencyCandidateCount,
      
        stagStableFraction:
          unitCompetencyCandidateCount === 0
            ? 0
            : unitStagStableCount / unitCompetencyCandidateCount
      };
      
      response.unit.rosterPercentages = calculateRosterPercentages(unitRosterAccumulator);

      response.unit.tabulationAverages = calculateUnitTabulationAverages(response.unit.candidates, unit.unitType, unit.signatureProfile);

  
      // 4️⃣ Compute average Interaction Class (IC) for the unit
      const tabAvgs = response.unit.tabulationAverages;

      const avgRR  = tabAvgs.find(t => t.metric === "RRN")?.value ?? 0;
      const avgPR  = tabAvgs.find(t => t.metric === "PRN")?.value ?? 0;
      const avgAR  = tabAvgs.find(t => t.metric === "deltaARN")?.value ?? 0;

      response.unit.averageInteractionClass = calculateInteractionClass(
        avgRR,
        avgPR,
        avgAR,
        unit.unitType,
        unit.signatureProfile
      );

      return res.status(200).json(response);
  
    } catch (error) {
      console.error("Error fetching unit report:", error);
      res.status(500).json({
        message: "Error fetching unit report",
        error: error.message
      });
    }
  };
  

  exports.getDataReportByClient = async (req, res) => {
    try {
      const { clientId } = req.params;
  
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }
  
      const units = await Unit.findAll({
        where: { clientId },
        attributes: ["id"]
      });
  
      if (!units.length) {
        return res.status(200).json({
          clientId,
          units: []
        });
      }
  
      const reports = [];
  
      for (const unit of units) {
        const unitReport = await buildUnitReport(unit.id);
        if (unitReport) reports.push(unitReport);
      }
  
      return res.status(200).json({
        clientId,
        units: reports
      });
  
    } catch (error) {
      console.error("Error fetching client report:", error);
      return res.status(500).json({
        message: "Error fetching client report",
        error: error.message
      });
    }
  };

  exports.getGlobalDataReportByClient = async (req, res) => {
    try {
      const { clientId } = req.params;
  
      if (!clientId) {
        return res.status(400).json({ message: "clientId is required" });
      }
  
      // 1️⃣ Fetch all units under this client
      const units = await Unit.findAll({
        where: { clientId },
        attributes: ["id"]
      });
  
      if (!units.length) {
        return res.status(200).json({
          client: null,
          summary: [],
          totalUniqueCandidates: 0
        });
      }
  
      const unitIds = units.map(u => u.id);
  
      // 2️⃣ Fetch all candidate IDs from UnitRoster and InsertScore
      const rosterCandidates = await UnitRoster.findAll({
        where: { unitId: unitIds },
        attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidateId")), "candidateId"]],
        raw: true
      });
  
      const scoreCandidates = await InsertScore.findAll({
        where: { unitId: unitIds },
        attributes: [[db.Sequelize.fn("DISTINCT", db.Sequelize.col("candidate_id")), "candidateId"]],
        raw: true
      });
  
      // Merge and get unique candidate IDs
      const allCandidateIds = new Set([
        ...rosterCandidates.map(r => r.candidateId),
        ...scoreCandidates.map(s => s.candidateId)
      ]);
  
      const totalUniqueCandidates = allCandidateIds.size;
  
      // 3️⃣ Fetch client details
      const client = await Client.findAll({
        where: { id: clientId },
        attributes: ["id", "executiveId", "companyName", "institutionalType", "companyContactNumber", "country", "companySizeId"],
        include: [
          {
            model: db.CompanySize,
            as: "companySize"
          }
        ]
      });
  
      // 4️⃣ Fetch global analytics & thresholds
      const globalAnalyticsReq = { params: { clientId: String(clientId) } };
  
      let globalAnalytics = null;
      let globalAnalyticsThreshold = null;
  
      await getGlobalAnalyticsDataByUnit(globalAnalyticsReq, {
        status() { return this; },
        json(payload) { globalAnalytics = payload; return this; }
      });
  
      await getUnitSuccessRatesByThreshold(globalAnalyticsReq, {
        status() { return this; },
        json(payload) { globalAnalyticsThreshold = payload; return this; }
      });
  
      return res.status(200).json({
        client: client.length ? client[0].toJSON() : null,
        totalUniqueCandidates,
        summary: [
          { globalAnalytics, globalAnalyticsThreshold }
        ]
      });
  
    } catch (error) {
      console.error("Error fetching client report:", error);
      return res.status(500).json({
        message: "Error fetching client report",
        error: error.message
      });
    }
  };
  