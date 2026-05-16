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
const InsertScoreCriteria = db.InsertScoreCriteria;
const ScoringCriteria = db.ScoringCriteria;

// ✅ UPDATED CONTROLLER: Separate positive and negative ppIds with independent serial numbers
exports.getInsertScoreSequential = async (req, res) => {
  try {
    const {
      unitId,
      candidate_id,
      ppIdFrom,
      ppIdTo,
      criticalRefDateFrom,
      criticalRefDateTo,
    } = req.query;

    if (!unitId || !candidate_id) {
      return res
        .status(400)
        .json({ message: "unitId and candidate_id are required" });
    }

    const where = {
      unitId,
      candidate_id,
    };

    // PP ID FILTER
    if (ppIdFrom !== undefined && ppIdTo !== undefined) {
      where.ppId = {
        [Op.between]: [parseInt(ppIdFrom), parseInt(ppIdTo)],
      };
    } else if (ppIdFrom !== undefined) {
      where.ppId = {
        [Op.gte]: parseInt(ppIdFrom),
      };
    } else if (ppIdTo !== undefined) {
      where.ppId = {
        [Op.lte]: parseInt(ppIdTo),
      };
    }

    // DATE FILTER
    if (criticalRefDateFrom || criticalRefDateTo) {
      where.criticalRefDate = {};

      if (criticalRefDateFrom) {
        where.criticalRefDate[Op.gte] = new Date(
          criticalRefDateFrom
        );
      }

      if (criticalRefDateTo) {
        where.criticalRefDate[Op.lte] = new Date(
          criticalRefDateTo
        );
      }
    }

    // FETCH INSERT SCORES
    const rows = await InsertScore.findAll({
      where,
      include: [
        {
          model: InsertScoreCriteria,
          as: "customCriteria",
          required: false,
          include: [
            {
              model: ScoringCriteria,
              as: "criteria",
              attributes: ["id", "criteriaId", "criteria"],
            },
          ],
        },
      ],
      order: [["criticalRefDate", "ASC"]],
    });

    // SPLIT POSITIVE / NEGATIVE
    const positiveRows = rows.filter((r) => r.ppId > 0).sort((a, b) => a.ppId - b.ppId);
    const negativeRows = rows.filter((r) => r.ppId < 0).sort((a, b) => b.ppId - a.ppId);

    const transformRows = (rows) =>
      rows.map((row, index) => {
        const mcValues = {};
        const ccValues = {};

        // MAIN CRITERIA
        for (let i = 1; i <= 20; i++) {
          mcValues[`mc${i}`] =
            row[`mc${i}`] != null
              ? Number(row[`mc${i}`])
              : 0;

          // default cc values
          ccValues[`cc${i}`] = 0;
        }

        // CUSTOM CRITERIA
        if (
          row.customCriteria &&
          row.customCriteria.length > 0
        ) {
          row.customCriteria.forEach((cc) => {
            const criteriaIndex =
              cc.criteria?.criteriaId;

            // criteriaId => cc1, cc2, cc3...
            if (
              criteriaIndex >= 1 &&
              criteriaIndex <= 20
            ) {
              ccValues[`cc${criteriaIndex}`] =
                cc.value != null
                  ? Number(cc.value)
                  : 0;
            }
          });
        }

        return {
          serialNo: index + 1,
          ppId: row.ppId,
          competency: row.competency,
          mcValues,
          ccValues,
          attainedScore: row.attainedScore,
          maxScore: row.maxScore,
        };
      });

    const transformedPositive =
      transformRows(positiveRows);

    const transformedNegative =
      transformRows(negativeRows);

    res.status(200).json({
      total: rows.length,
      totalPositive: transformedPositive.length,
      totalNegative: transformedNegative.length,
      positiveData: transformedPositive,
      negativeData: transformedNegative,
    });
  } catch (error) {
    console.error(
      "Error in getInsertScoreSequential:",
      error
    );

    res.status(500).json({
      message:
        "Error fetching insert score sequential summary",
      error: error.message,
    });
  }
};



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
        const competency = row.competency;
        if (!grouped[ppId]) {
          grouped[ppId] = {
            ppId,
            competency,
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
    const {
      unitId,
      candidate_id,
      ppIdFrom,
      ppIdTo,
      criticalRefDateFrom,
      criticalRefDateTo,
    } = req.query;

    if (!unitId || !candidate_id) {
      return res.status(400).json({ message: "unitId and candidate_id are required" });
    }

    //  Build filter conditions
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
      if (criticalRefDateFrom)
        where.criticalRefDate[Sequelize.Op.gte] = new Date(criticalRefDateFrom);
      if (criticalRefDateTo)
        where.criticalRefDate[Sequelize.Op.lte] = new Date(criticalRefDateTo);
    }

    //  Fetch all rows
    const rows = await InsertScore.findAll({
      where,
      attributes: ["ppId", "subPpId", "attainedScore", "maxScore", "competency"],
      order: [["ppId", "ASC"], ["subPpId", "ASC"]],
      raw: true,
    });

    //  Group by ppId and competency, summing attainedScore and maxScore
    const groups = new Map();

    rows.forEach(row => {
      const key = `${row.ppId}|${row.competency || 'null'}`;
      
      if (!groups.has(key)) {
        groups.set(key, {
          ppId: row.ppId,
          competency: row.competency,
          totalAttainedScore: 0,
          totalMaxScore: 0,
          subPpIds: [],
        });
      }
      
      const group = groups.get(key);
      group.totalAttainedScore += Number(row.attainedScore ?? 0);
      group.totalMaxScore += Number(row.maxScore ?? 0);
      group.subPpIds.push(row.subPpId);
    });

    //  Convert Map to array
    const groupedRows = Array.from(groups.values()).map((group) => ({
      ppId: group.ppId,
      competency: group.competency,
      attainedScore: group.totalAttainedScore,
      maxScore: group.totalMaxScore,
      subPpIds: group.subPpIds,
      count: group.subPpIds.length,
    }));

    //  Separate into positive and negative ppIds
    let positiveResult = groupedRows.filter(r => r.ppId >= 0);
    let negativeResult = groupedRows.filter(r => r.ppId < 0);

    //  Sort positive ppIds in ascending order
    positiveResult.sort((a, b) => a.ppId - b.ppId);
    
    //  Sort negative ppIds in descending order
    negativeResult.sort((a, b) => b.ppId - a.ppId);

    //  Assign serial numbers for each group separately
    positiveResult = positiveResult.map((item, idx) => ({
      ...item,
      serialNo: idx + 1,
    }));
    
    negativeResult = negativeResult.map((item, idx) => ({
      ...item,
      serialNo: idx + 1,
    }));

    //  Merge both results for frontend compatibility 
    const result = [...negativeResult, ...positiveResult];

    return res.status(200).json({
      totalGroups: groupedRows.length,
      positiveCount: positiveResult.length,
      negativeCount: negativeResult.length,
      positiveData: positiveResult,
      negativeData: negativeResult,
      data: result,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching attained score summary",
      error: error.message,
    });
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
  
  