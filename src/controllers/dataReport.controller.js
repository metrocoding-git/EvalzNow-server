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
    present: +(presentCount / total * 100).toFixed(2),
    excusedAbsences: +(excusedAbsences / total * 100).toFixed(2),
    unexcusedAbsences: +(unexcusedAbsences / total * 100).toFixed(2),
    excusedTardies: +(excusedTardies / total * 100).toFixed(2),
    unexcusedTardies: +(unexcusedTardies / total * 100).toFixed(2)
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
      ? +(counts[level] / total * 100).toFixed(2)
      : 0;
  });

  return {
    total,
    counts,
    percentages
  };
};

const calculateUnitTabulationAverages = (candidates) => {
  const bucket = {};

  const EXCLUDE_KEYS = new Set([
    "candidateId",
    "ppId",
    "IC",
    "STAP",
    "STAG"
  ]);

  candidates.forEach(candidate => {
    const avgRow = candidate.competencyAverages?.[0];
    if (!avgRow) return;

    Object.entries(avgRow).forEach(([key, value]) => {
      if (EXCLUDE_KEYS.has(key)) return;
      if (value === null || typeof value !== "number") return;

      if (!bucket[key]) {
        bucket[key] = [];
      }

      bucket[key].push(value);
    });
  });

  return Object.entries(bucket).map(([metric, values]) => ({
    metric,
    value: +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(3),
    candidatesCount: values.length
  }));
};  
  

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

  const rosterCandidates = await UnitRoster.findAll({
    where: { unitId },
    attributes: [
      [Sequelize.fn("DISTINCT", Sequelize.col("candidateId")), "candidateId"]
    ],
    raw: true
  });

  let candidateIds = rosterCandidates.map(r => r.candidateId);

  if (!candidateIds.length) return { ...unit.toJSON(), candidates: [] };

  const candidateIdList = candidateIds.join(",");
  const unitScoreBucket = [];

  const candidates = [];

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

    const rosterData = await UnitRoster.findAll({ where: { unitId, candidateId } });
    const marks = await CandidateMarks.findAll({ where: { unitId, candidateId } });
    const leaderMarks = await LeaderMarks.findAll({ where: { unitId, candidateId } });
    const unitImprovement = await UnitImprovement.findAll({ where: { unitId, candidateId } });

    rosterData.forEach(r => {
      unitRosterAccumulator.presentCount += r.presentCount || 0;
      unitRosterAccumulator.excusedAbsences += r.excusedAbsences || 0;
      unitRosterAccumulator.unexcusedAbsences += r.unexcusedAbsences || 0;
      unitRosterAccumulator.excusedTardies += r.excusedTardies || 0;
      unitRosterAccumulator.unexcusedTardies += r.unexcusedTardies || 0;
    });

    const candidate = {
      candidateId: scores[0].candidate.id,
      candidateCode: scores[0].candidate.candidateId,
      firstName: scores[0].candidate.firstName,
      lastName: scores[0].candidate.lastName,
      scores: scores.map(s => s.toJSON()),
      roster: rosterData.map(r => ({
        ...r.toJSON(),
        percentages: calculateRosterPercentages(r.toJSON())
      })),
      candidateMarks: marks.map(m => m.toJSON()),
      leaderMarks: leaderMarks.map(l => l.toJSON()),
      unitImprovement: unitImprovement.map(u => u.toJSON()),
      effortBu: []
    };

    unitScoreBucket.push(...candidate.scores);

    // Effort BU
    const effortReq = { params: { unitId: String(unitId), candidate_id: String(candidateId) }, query: {} };
    let effortData = null;

    await getEffortBu(effortReq, {
      status() { return this; },
      json(d) { effortData = d; }
    });

    candidate.effortBu = effortData;

    candidates.push(candidate);
  }

  return {
    ...unit.toJSON(),
    candidates,
    engageLevelStats: calculateEngageLevelPercentages(unitScoreBucket),
    rosterPercentages: calculateRosterPercentages(unitRosterAccumulator),
    tabulationAverages: calculateUnitTabulationAverages(candidates)
  };
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
          candidate.pps.push({
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
  
      const unitScoreBucket = [];

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

      response.unit.rosterPercentages = calculateRosterPercentages(unitRosterAccumulator);

      response.unit.tabulationAverages = calculateUnitTabulationAverages(response.unit.candidates);

  
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

      const globalAnalyticsReq = {
        params: { clientId: String(clientId) },
      };

      let globalAnalytics = null;
      let globalAnalyticsThreshold = null;

      const globalAnalyticsRes = {
        status() { return this; },
        json(payload) {
          globalAnalytics = payload;
          return this;
        }
      };

      const globalAnalyticsThresholdRes = {
        status() { return this; },
        json(payload) {
          globalAnalyticsThreshold = payload;
          return this;
        }
      };

      await getGlobalAnalyticsDataByUnit(globalAnalyticsReq, globalAnalyticsRes);
      await getUnitSuccessRatesByThreshold(globalAnalyticsReq, globalAnalyticsThresholdRes);
  
      const client = await Client.findAll({
        where: { id: clientId },
        attributes: ["id", "executiveId", "companyName", "institutionalType", "companyContactNumber", "country", "companySizeId"],
        include: [
          {
            model: db.CompanySize,
            as: "companySize",
          }
        ]
      });
  
      const reports = [];

      reports.push({
        globalAnalytics,
        globalAnalyticsThreshold,
      });
  
      return res.status(200).json({
        client: client.length ? client[0].toJSON() : null,
        summary: reports
      });
  
    } catch (error) {
      console.error("Error fetching client report:", error);
      return res.status(500).json({
        message: "Error fetching client report",
        error: error.message
      });
    }
  };