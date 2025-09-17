// get insert score by unit and candidate
// count the total row
// total number of mc and cc filled from each - example: mc1 - 4, mc2 - 5
// can be able to filter by pp id range. for example: from - -1 to 2
// can be able to filter by critical reference data. for example: 07/15/2025 - 08/15/2025
// total count of row want to change based on these filters 
// include rows - number of rows,  count of each mc and cc
const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;


// GET Insert Score summary for chart grouped by ppId
exports.getInsertScoreSummary = async (req, res) => {
    try {
      const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;
  
      if (!unitId || !candidate_id) {
        return res.status(400).json({ message: "unitId and candidate_id are required" });
      }
  
      // Build filter conditions
      const where = {
        unitId,
        candidate_id,
      };
  
      if (ppIdFrom !== undefined && ppIdTo !== undefined) {
        where.ppId = { [Sequelize.Op.between]: [parseInt(ppIdFrom), parseInt(ppIdTo)] };
      } else if (ppIdFrom !== undefined) {
        where.ppId = { [Sequelize.Op.gte]: parseInt(ppIdFrom) };
      } else if (ppIdTo !== undefined) {
        where.ppId = { [Sequelize.Op.lte]: parseInt(ppIdTo) };
      }
  
      if (criticalRefDateFrom || criticalRefDateTo) {
        where.criticalRefDate = {};
        if (criticalRefDateFrom) where.criticalRefDate[Sequelize.Op.gte] = new Date(criticalRefDateFrom);
        if (criticalRefDateTo) where.criticalRefDate[Sequelize.Op.lte] = new Date(criticalRefDateTo);
      }
  
      // Fetch rows grouped by ppId
      const rows = await InsertScore.findAll({ where, raw: true });
  
      // Group by ppId
      const grouped = {};
      rows.forEach(row => {
        const ppId = row.ppId;
        if (!grouped[ppId]) {
          grouped[ppId] = {
            ppId,
            totalRows: 0,
            mcCounts: {},
            ccCounts: {},
          };
          for (let i = 1; i <= 20; i++) {
            grouped[ppId].mcCounts[`mc${i}`] = 0;
            grouped[ppId].ccCounts[`cc${i}`] = 0;
          }
        }
  
        grouped[ppId].totalRows += 1;
  
        for (let i = 1; i <= 20; i++) {
          if (row[`mc${i}`] !== null && row[`mc${i}`] !== "") grouped[ppId].mcCounts[`mc${i}`] += 1;
          if (row[`cc${i}`] !== null && row[`cc${i}`] !== "") grouped[ppId].ccCounts[`cc${i}`] += 1;
        }
      });
  
      res.status(200).json(Object.values(grouped));
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching insert score summary", error: error.message });
    }
  };
  


  // GET Insert Score summary for Attained Score vs Insert Score Row Counter
exports.getAttainedScoreSummary = async (req, res) => {
    try {
      const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;
  
      if (!unitId || !candidate_id) {
        return res.status(400).json({ message: "unitId and candidate_id are required" });
      }
  
      // Build filter conditions
      const where = {
        unitId,
        candidate_id,
      };
  
      if (ppIdFrom !== undefined && ppIdTo !== undefined) {
        where.ppId = { [Sequelize.Op.between]: [parseInt(ppIdFrom), parseInt(ppIdTo)] };
      } else if (ppIdFrom !== undefined) {
        where.ppId = { [Sequelize.Op.gte]: parseInt(ppIdFrom) };
      } else if (ppIdTo !== undefined) {
        where.ppId = { [Sequelize.Op.lte]: parseInt(ppIdTo) };
      }
  
      if (criticalRefDateFrom || criticalRefDateTo) {
        where.criticalRefDate = {};
        if (criticalRefDateFrom) where.criticalRefDate[Sequelize.Op.gte] = new Date(criticalRefDateFrom);
        if (criticalRefDateTo) where.criticalRefDate[Sequelize.Op.lte] = new Date(criticalRefDateTo);
      }
  
      // Fetch all rows
      const rows = await InsertScore.findAll({ where, raw: true });
  
      // Group by attainedScore
      const grouped = {};
      rows.forEach(row => {
        const attainedScore = row.attainedScore ?? "Unknown";
        if (!grouped[attainedScore]) {
          grouped[attainedScore] = {
            attainedScore,
            totalRows: 0,
          };
        }
        grouped[attainedScore].totalRows += 1;
      });
  
      // Convert object to array
      const result = Object.values(grouped).sort((a, b) => {
        if (a.attainedScore === "Unknown") return 1;
        if (b.attainedScore === "Unknown") return -1;
        return a.attainedScore - b.attainedScore;
      });
  
      res.status(200).json(result);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching attained score summary", error: error.message });
    }
  };

  // GET Insert Score summary for Max Score vs Insert Score Row Counter
exports.getMaxScoreSummary = async (req, res) => {
    try {
      const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;
  
      if (!unitId || !candidate_id) {
        return res.status(400).json({ message: "unitId and candidate_id are required" });
      }
  
      // Build filter conditions
      const where = { unitId, candidate_id };
  
      if (ppIdFrom !== undefined && ppIdTo !== undefined) {
        where.ppId = { [Sequelize.Op.between]: [parseInt(ppIdFrom), parseInt(ppIdTo)] };
      } else if (ppIdFrom !== undefined) {
        where.ppId = { [Sequelize.Op.gte]: parseInt(ppIdFrom) };
      } else if (ppIdTo !== undefined) {
        where.ppId = { [Sequelize.Op.lte]: parseInt(ppIdTo) };
      }
  
      if (criticalRefDateFrom || criticalRefDateTo) {
        where.criticalRefDate = {};
        if (criticalRefDateFrom) where.criticalRefDate[Sequelize.Op.gte] = new Date(criticalRefDateFrom);
        if (criticalRefDateTo) where.criticalRefDate[Sequelize.Op.lte] = new Date(criticalRefDateTo);
      }
  
      // Fetch all rows
      const rows = await InsertScore.findAll({ where, raw: true });
  
      // Group by maxScore
      const grouped = {};
      rows.forEach(row => {
        const maxScore = row.maxScore ?? "Unknown";
        if (!grouped[maxScore]) {
          grouped[maxScore] = { maxScore, totalRows: 0 };
        }
        grouped[maxScore].totalRows += 1;
      });
  
      // Convert object to array
      const result = Object.values(grouped).sort((a, b) => {
        if (a.maxScore === "Unknown") return 1;
        if (b.maxScore === "Unknown") return -1;
        return a.maxScore - b.maxScore;
      });
  
      res.status(200).json(result);
  
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error fetching max score summary", error: error.message });
    }
  };
  
  