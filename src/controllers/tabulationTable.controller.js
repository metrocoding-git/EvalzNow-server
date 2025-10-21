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



// Competency -> output key mapping
const competencyToKey = {
  "Listening": "XLR",
  "Reading": "XRR",
  "Speaking": "XSR",
  "Writing": "XWR",
  "Theory": "XTR",
  "Practice": "XPR",
  "Receptive": "XRVSR",
  "Productive": "XPVSR",
  "Acuity": "XAVSR",
};

// ----------------- Performance Point Calculations -----------------

function PerformancePointCICOCase1(xrr, xlr, xsr, xwr) {
  const rr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xrr, 2) + Math.pow(xlr, 2));
  const pr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xsr, 2) + Math.pow(xwr, 2));
  return [rr, pr];
}

function PerformancePointCICOCase2(xrr, xlr, xsr, xwr) {
  const rr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xrr, 3) + Math.pow(xlr, 3));
  const pr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xsr, 3) + Math.pow(xwr, 3));
  return [rr, pr];
}

function PerformancePointCICOCase3a(xrr, xlr, xsr, xwr) {
  const rr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xrr, 3) + Math.pow(xlr, 3));
  const pr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xsr, 2) + Math.pow(xwr, 2));
  return [rr, pr];
}

function PerformancePointCICOCase3b(xrr, xlr, xsr, xwr) {
  const rr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xrr, 2) + Math.pow(xlr, 2));
  const pr = (Math.sqrt(2) / 2) * Math.sqrt(Math.pow(xsr, 3) + Math.pow(xwr, 3));
  return [rr, pr];
}

function PerformancePointTPRM(xrvsr, xpvsr, xavsr) {
  return [xrvsr, xpvsr, xavsr]; // rr, pr, ar
}

function PerformancePointTPAllCases(xtr, xpr) {
  return [xtr, xpr];
}

// ------------------------------------------------------------------



// ----------------- XEP Calculations -----------------

function calculateXEP_CIO(rrn, prn) {
  if (rrn == null || prn == null) return null;
  const val = Math.sqrt(Math.pow(rrn, 2) + Math.pow(prn, 2) - rrn * prn);
  return isNaN(val) ? null : +val.toFixed(3);
}

function calculateXEP_TP(rrn, prn, arn) {
  if (rrn == null || prn == null || arn == null) return null;
  const val = Math.sqrt(
    0.5 * (Math.pow(rrn - prn, 2) + Math.pow(prn - arn, 2) + Math.pow(arn - rrn, 2))
  );
  return isNaN(val) ? null : +val.toFixed(3);
}

// ------------------------------------------------------------------


// ----------------- XCP, XBP, MSIP Calculations -----------------

// --- Communicative I/O ---
function CalcCompositeProficiencyCIO(ars, als, asp, aws, mrs, mls, mss, mws) {
  return (ars + als + asp + aws) / (mrs + mls + mss + mws || 1);
}

function CalcBandProficiencyCIO(xrr, xlr, xsr, xwr) {
  return (xrr + xlr + xsr + xwr) / 4;
}

function CalcButlerIntProfCIO({ ARS, ALS, ASP, AWS, MRS, MLS, MSS, MWS }) {
  const PrPw2 = Math.pow(ASP + AWS, 2) / Math.pow(MSS + MWS || 1, 2);
  const RrPw2 = Math.pow(ARS + ALS, 2) / Math.pow(MRS + MLS || 1, 2);
  let bmsip = Math.pow(PrPw2 + RrPw2, -0.5) - 1;
  if (bmsip > 5 || bmsip === Number.POSITIVE_INFINITY) bmsip = 5;
  return +bmsip.toFixed(3);
}

// --- Theory & Practice ---
function CalcCompositeProficiencyTP(ats, aps, mts, mps) {
  return (ats + aps) / (mts + mps || 1);
}

function CalcBandProficiencyTP(xtr, xpr) {
  return (xtr + xpr) / 2;
}

function CalcButlerIntProfTP(xtr, xpr) {
  return +(Math.pow(Math.pow(xtr, 2) + Math.pow(xpr, 2), -0.5) - 1).toFixed(3);
}

// --- Third Parameter ---
function CalcCompositeProficiency3P(arvs, apvs, aavs, mrvs, mpvs, mavs) {
  return (arvs + apvs + aavs) / (mrvs + mpvs + mavs || 1);
}

function CalcBandProficiency3P(xrvsr, xpvsr, xavsr) {
  return (xrvsr + xpvsr + xavsr) / 3;
}

function CalcButlerIntProf3P(xrvsr, xpvsr, xavsr) {
  return +(
    Math.pow(Math.pow(xrvsr, 2) + Math.pow(xpvsr, 2) + Math.pow(xavsr, 2), -0.5) - 1
  ).toFixed(3);
}

// ------------------------------------------------------------------

exports.getPpCompetencyRatios = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.query;

    if (!unitId || !candidate_id) {
      return res.status(400).json({ message: "unitId and candidate_id are required" });
    }

    const unit = await Unit.findByPk(unitId, {
      attributes: ["unitStartDate", "unitType", "signatureProfile"],
      raw: true,
    });

    const candidate = await Candidate.findByPk(candidate_id, {
      attributes: ["startDate"],
      raw: true,
    });

    if (!unit || !candidate) {
      return res.status(404).json({ message: "Unit or Candidate not found" });
    }

    const { unitStartDate, unitType, signatureProfile } = unit;
    const unitStart = new Date(unitStartDate);
    const candidateStart = new Date(candidate.startDate);

    const aggregates = await InsertScore.findAll({
      attributes: [
        "ppId",
        [Sequelize.fn("SUM", Sequelize.col("durationHrs")), "totalDuration"],
        [Sequelize.fn("MAX", Sequelize.col("criticalRefDate")), "latestCriticalRefDate"],
      ],
      where: { unitId, candidate_id },
      group: ["ppId"],
      raw: true,
    });

    if (!aggregates.length) return res.status(200).json([]);

    const results = await Promise.all(
      aggregates.map(async (agg) => {
        const ppId = agg.ppId;
        const totalDuration = Number(agg.totalDuration) || 0;
        const criticalRefDate = agg.latestCriticalRefDate ? new Date(agg.latestCriticalRefDate) : null;

        const scores = await InsertScore.findAll({
          where: { ppId, unitId, candidate_id },
          attributes: [
            "competency",
            [Sequelize.fn("SUM", Sequelize.col("attainedScore")), "sumAttained"],
            [Sequelize.fn("SUM", Sequelize.col("maxScore")), "sumMax"],
          ],
          group: ["competency"],
          raw: true,
        });

        const out = {
          ppId,
          criticalRefDate,
          totalDuration,
          XLR: null,
          XRR: null,
          XSR: null,
          XWR: null,
          XTR: null,
          XPR: null,
          XRVSR: null,
          XPVSR: null,
          XAVSR: null,
          ARS: null, ALS: null, ASP: null, AWS: null,
          MRS: null, MLS: null, MSS: null, MWS: null,
          ATS: null, APS: null, MTS: null, MPS: null,
          ARVS: null, APVS: null, AAVS: null,
          MRVS: null, MPVS: null, MAVS: null,
          RRN: null,
          PRN: null,
          ARN: null,
          XEP: null,
          Productivity_CSD: null,
          Productivity_USD: null,
        };

        // --- Compute competency ratios ---
        scores.forEach((row) => {
          const key = competencyToKey[row.competency];
          if (!key) return;
          const sumAttained = Number(row.sumAttained) || 0;
          const sumMax = Number(row.sumMax) || 0;
          out[key] = sumMax ? +(sumAttained / sumMax).toFixed(3) : null;

          switch (row.competency) {
            case "Reading": out.ARS = sumAttained; out.MRS = sumMax; break;
            case "Listening": out.ALS = sumAttained; out.MLS = sumMax; break;
            case "Speaking": out.ASP = sumAttained; out.MSS = sumMax; break;
            case "Writing": out.AWS = sumAttained; out.MWS = sumMax; break;
            case "Theory": out.ATS = sumAttained; out.MTS = sumMax; break;
            case "Practice": out.APS = sumAttained; out.MPS = sumMax; break;
            case "Receptive": out.ARVS = sumAttained; out.MRVS = sumMax; break;
            case "Productive": out.APVS = sumAttained; out.MPVS = sumMax; break;
            case "Acuity": out.AAVS = sumAttained; out.MAVS = sumMax; break;
          }
        });

        // --- Compute productivity ---
        if (criticalRefDate && totalDuration > 0) {
          const diffUSD = (criticalRefDate - unitStart) / (1000 * 60 * 60 * 24);
          const diffCSD = (criticalRefDate - candidateStart) / (1000 * 60 * 60 * 24);
          out.Productivity_USD = +((diffUSD / totalDuration).toFixed(3));
          out.Productivity_CSD = +((diffCSD / totalDuration).toFixed(3));
        }

        // --- Compute RRN, PRN, ARN ---
        let rr = null,
          pr = null,
          ar = null;

        if (unitType === "Communicative I/O") {
          if (signatureProfile === "Case 1: Solid Balanced")
            [rr, pr] = PerformancePointCICOCase1(out.XRR, out.XLR, out.XSR, out.XWR);
          else if (signatureProfile === "Case 2: Rigorous Balanced")
            [rr, pr] = PerformancePointCICOCase2(out.XRR, out.XLR, out.XSR, out.XWR);
          else if (signatureProfile === "Case 3a: Productive-Weighted")
            [rr, pr] = PerformancePointCICOCase3a(out.XRR, out.XLR, out.XSR, out.XWR);
          else if (signatureProfile === "Case 3b: Receptive-Weighed")
            [rr, pr] = PerformancePointCICOCase3b(out.XRR, out.XLR, out.XSR, out.XWR);
        } else if (unitType === "Third Parameter" && signatureProfile === "Case 1: Solid Balanced") {
          [rr, pr, ar] = PerformancePointTPRM(out.XRVSR, out.XPVSR, out.XAVSR);
        } else if (unitType === "Theory & Practice") {
          [rr, pr] = PerformancePointTPAllCases(out.XTR, out.XPR);
        }

        out.RRN = rr ? +rr.toFixed(3) : null;
        out.PRN = pr ? +pr.toFixed(3) : null;
        out.ARN = ar ? +ar.toFixed(3) : null;

        const rrnVal = out.RRN ?? 0;
        const prnVal = out.PRN ?? 0;
        const arnVal = out.ARN ?? 0;

        if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
          out.XEP = calculateXEP_CIO(rrnVal, prnVal);
        } else if (unitType === "Third Parameter") {
          out.XEP = calculateXEP_TP(rrnVal, prnVal, arnVal);
        }

        // --- Compute XCP, XBP, MSIP using real attained/max scores ---
        if (unitType === "Communicative I/O") {
          out.XCP = +CalcCompositeProficiencyCIO(
            out.ARS, out.ALS, out.ASP, out.AWS,
            out.MRS, out.MLS, out.MSS, out.MWS
          ).toFixed(3);
          out.XBP = +CalcBandProficiencyCIO(out.XRR, out.XLR, out.XSR, out.XWR).toFixed(3);
          out.MSIP = +CalcButlerIntProfCIO({
            ARS: out.ARS, ALS: out.ALS, ASP: out.ASP, AWS: out.AWS,
            MRS: out.MRS, MLS: out.MLS, MSS: out.MSS, MWS: out.MWS,
          }).toFixed(3);
        } else if (unitType === "Theory & Practice") {
          out.XCP = +CalcCompositeProficiencyTP(out.ATS, out.APS, out.MTS, out.MPS).toFixed(3);
          out.XBP = +CalcBandProficiencyTP(out.XTR, out.XPR).toFixed(3);
          out.MSIP = +CalcButlerIntProfTP(out.ATS, out.APS, out.MTS, out.MPS).toFixed(3);
        } else if (unitType === "Third Parameter") {
          out.XCP = +CalcCompositeProficiency3P(out.ARVS, out.APVS, out.AAVS, out.MRVS, out.MPVS, out.MAVS).toFixed(3);
          out.XBP = +CalcBandProficiency3P(out.XRVSR, out.XPVSR, out.XAVSR).toFixed(3);
          out.MSIP = +CalcButlerIntProf3P(out.ARVS, out.APVS, out.AAVS, out.MRVS, out.MPVS, out.MAVS).toFixed(3);
        }

        return out;
      })
    );

    res.status(200).json(results.sort((a, b) => a.ppId - b.ppId));
  } catch (error) {
    console.error("getPpCompetencyRatios error:", error);
    res.status(500).json({
      message: "Error computing PP competency ratios",
      error: error.message,
    });
  }
};
  