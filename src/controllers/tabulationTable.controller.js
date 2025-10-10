// get insert score by unit and candidate id
// columns - sub pp id, critical rererence date, day count, Productivity csd, productivity usd, RRN, PRN, ARN, XLR,	XRR,	XSR,	XWR,	XTR,	XPR,	XRVSR,	XPVSR,	XAVSR,	XEP,	XCP,	XBP,	MSIP,	STA/P,	IC,	ΔRRN,	ΔPRN,	ΔARN,	GEQ,	STA/G,	RRGT1,	PRGT1,	ARGT1,	RRGT2,	PRGT2,	ARGT2,	RRGT3,	PRGT3,	ARGT3,	RRGT4, PRGT4, ARGT4, RRGT5, PRGT5, ARGT5,
// XEP XRR XLR XSR XWRXCP XBP MSIP ΔRRN ΔPRN ΔARN ΔGEQ IC XTR XPR XRVSR XPVSR, XAVSR these are the only data that will be provided, you want to implement a system to calculate the  other related abbriviations, can not calculate all the of them. you want to calculate which is related.
const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;



exports.getUnitAndCandidateSummary = async (req, res) => {
  try {
    const { unitId, candidateId } = req.params;

    if (!unitId || !candidateId) {
      return res.status(400).json({ message: "unitId and candidateId are required" });
    }

    // Fetch all InsertScores with Unit included
    const scores = await InsertScore.findAll({
      where: { unitId, candidate_id: candidateId },
      include: [{ model: Unit, as: 'unit' }],
      order: [['subPpId', 'ASC']],
    });

    if (!scores.length) {
      return res.status(404).json({ message: "InsertScore not found" });
    }

    // Process each score
    const processedScores = scores.map(score => {
      const rawData = score.toJSON();
      const unitData = rawData.unit || {};

      // Compute derived columns
      const xScores = ['XEP', 'XRR', 'XLR', 'XSR', 'XWR', 'XCP', 'XBP', 'MSIP'];
      const xValues = xScores.map(k => parseFloat(unitData[k]) || 0);
      const staP = xValues.reduce((a, b) => a + b, 0) / xValues.length;

      const deltaScores = ['ΔRRN', 'ΔPRN', 'ΔARN', 'ΔGEQ'];
      const deltaValues = deltaScores.map(k => parseFloat(unitData[k]) || 0);
      const geq = deltaValues.reduce((a, b) => a + b, 0) / deltaValues.length;

      const staG = ((parseFloat(unitData['XTR']) || 0) + (parseFloat(unitData['XPR']) || 0)) / 2;

      // Build output
      return {
        subPpId: rawData.subPpId || null,
        criticalRefDate: rawData.criticalRefDate || null,
        dayCount: rawData.durationHrs || null,
        ProductivityCSD: rawData.ProductivityCSD || null,
        ProductivityUSD: rawData.ProductivityUSD || null,
        RRN: rawData.RRN || null,
        PRN: rawData.PRN || null,
        ARN: rawData.ARN || null,
        XLR: unitData.XLR || null,
        XRR: unitData.XRR || null,
        XSR: unitData.XSR || null,
        XWR: unitData.XWR || null,
        XTR: unitData.XTR || null,
        XPR: unitData.XPR || null,
        XRVSR: unitData.XRVSR || null,
        XPVSR: unitData.XPVSR || null,
        XAVSR: unitData.XAVSR || null,
        XEP: unitData.XEP || null,
        XCP: unitData.XCP || null,
        XBP: unitData.XBP || null,
        MSIP: unitData.MSIP || null,
        'STA/P': staP,
        IC: unitData.IC || null,
        ΔRRN: unitData.ΔRRN || null,
        ΔPRN: unitData.ΔPRN || null,
        ΔARN: unitData.ΔARN || null,
        GEQ: geq,
        'STA/G': staG,
        RRGT1: rawData.RRGT1 || null,
        PRGT1: rawData.PRGT1 || null,
        ARGT1: rawData.ARGT1 || null,
        RRGT2: rawData.RRGT2 || null,
        PRGT2: rawData.PRGT2 || null,
        ARGT2: rawData.ARGT2 || null,
        RRGT3: rawData.RRGT3 || null,
        PRGT3: rawData.PRGT3 || null,
        ARGT3: rawData.ARGT3 || null,
        RRGT4: rawData.RRGT4 || null,
        PRGT4: rawData.PRGT4 || null,
        ARGT4: rawData.ARGT4 || null,
        RRGT5: rawData.RRGT5 || null,
        PRGT5: rawData.PRGT5 || null,
        ARGT5: rawData.ARGT5 || null
      };
    });

    return res.status(200).json(processedScores);

  } catch (error) {
    console.error("Error in getUnitAndCandidateSummary:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
};

  
  