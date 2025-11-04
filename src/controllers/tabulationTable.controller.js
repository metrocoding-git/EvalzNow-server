const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;


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


//------------------- STAP / STA/P calculation -----------------------------
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

//---------------------------------------------------------------


// ---------------- Interaction Class Calculations ----------------

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

function GetInteractionClassAreaThird(eqn) {
  if (eqn < 0.6) return 0;
  else if (eqn < 0.7) return 1;
  else if (eqn < 0.8) return 2;
  else if (eqn < 0.9) return 3;
  else if (eqn < 1.0) return 4;
  else return 5;
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


//------------ STAG calculation --------------------------------

const calculateSTAG = (deltaRRN, deltaPRN, deltaARN, msipValue, type) => {

  if (deltaRRN > 0 && deltaPRN > 0 && (type !== "Third Parameter" || deltaARN > 0) && msipValue < 0) {
    return 'STABLE'
  }
  else {
    return 'UNSTABLE'
  }
}

//-------------------------------------------------------------



// ----------------- XEP Calculations -----------------

function calculateGEQ_CIO(deltaRRN, deltaPRN) {
  if (deltaRRN == null || deltaPRN == null) return null;
  const val = Math.sqrt(Math.pow(deltaRRN, 2) + Math.pow(deltaPRN, 2) - deltaRRN * deltaPRN);
  return isNaN(val) ? null : +val.toFixed(3);
}

function calculateGEQ_TP(deltaRRN, deltaPRN, deltaARN) {
  if (deltaRRN == null || deltaPRN == null || deltaARN == null) return null;
  const val = Math.sqrt(
    0.5 * (Math.pow(deltaRRN - deltaPRN, 2) + Math.pow(deltaPRN - deltaARN, 2) + Math.pow(deltaARN - deltaRRN, 2))
  );
  return isNaN(val) ? null : +val.toFixed(3);
}

// ------------------------------------------------------------------


//------------------- GT1 calculation -------------------------------



function FindRoots(a, b, c, d) {
  let roots = [];

  // check if a not equal to zero
  if (a !== 0) {
    var A = (27 * a * a * c - 9 * a * b * b) / (27 * a * a * a);
    var B = (2 * b * b * b - 9 * a * b * c + 27 * a * a * d) / (27 * a * a * a);
    var D = (B / 2) * (B / 2) + (A / 3) * (A / 3) * (A / 3);
    let x1;
    let x2;
    let x3;

    if (D >= 0) {
      x1 =
        -b / 3 / a +
        Math.cbrt(-B / 2 + Math.sqrt(D)) +
        Math.cbrt(-B / 2 - Math.sqrt(D));
      roots[0] = x1;
      return roots;
    } else {
      x1 =
        -b / 3 / a +
        2 *
          Math.sqrt(-A / 3) *
          Math.cos(
            (1 / 3) *
              Math.acos(-B / 2 / Math.sqrt(((((-A / 3) * -A) / 3) * -A) / 3))
          );
      x2 =
        -b / 3 / a +
        2 *
          Math.sqrt(-A / 3) *
          Math.cos(
            (2 * Math.PI) / 3 +
              (1 / 3) *
                Math.acos(-B / 2 / Math.sqrt(((((-A / 3) * -A) / 3) * -A) / 3))
          );
      x3 =
        -b / 3 / a +
        2 *
          Math.sqrt(-A / 3) *
          Math.cos(
            (2 * Math.PI) / 3 -
              (1 / 3) *
                Math.acos(-B / 2 / Math.sqrt(((((-A / 3) * -A) / 3) * -A) / 3))
          );
      roots[0] = x1;
      roots[1] = x2;
      roots[2] = x3;
      return roots;
    }
  }
  return roots;
}


function CalcGTSpecialCases(rr, pr) {
  let gt = [];
  let rrGt1 = 0.0;
  let rrGt2 = 0.0;
  let rrGt3 = 0.0;
  let rrGt4 = 0.0;
  let rrGt5 = 0.0;
  let prGt1 = 0.0;
  let prGt2 = 0.0;
  let prGt3 = 0.0;
  let prGt4 = 0.0;
  let prGt5 = 0.0;

  if (pr == 1 && rr == 0) {
    rrGt1 = null;
    prGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);

    rrGt2 = 0.4142;
    prGt2 = 1.0;

    gt.push(rrGt2);
    gt.push(prGt2);

    rrGt3 = 0.6682;
    prGt3 = 1.0;

    gt.push(rrGt3);
    gt.push(prGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;

    gt.push(rrGt4);
    gt.push(prGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;

    gt.push(rrGt5);
    gt.push(prGt5);

    return gt;
  } else if (pr == 0 && rr == 1) {
    rrGt1 = null;
    prGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);

    rrGt2 = 1.0;
    prGt2 = 0.4142;

    gt.push(rrGt2);
    gt.push(prGt2);

    rrGt3 = 1.0;
    prGt3 = 0.6682;

    gt.push(rrGt3);
    gt.push(prGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;

    gt.push(rrGt4);
    gt.push(prGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;

    gt.push(rrGt5);
    gt.push(prGt5);

    return gt;
  } else if ((pr == 0 && rr == 0) || (pr == 1 && rr == 1)) {
    rrGt1 = null;
    prGt1 = null;
    rrGt2 = null;
    prGt2 = null;
    rrGt3 = null;
    prGt3 = null;
    rrGt4 = null;
    prGt4 = null;
    rrGt5 = null;
    prGt5 = null;

    return gt;
  }

  return gt;
}

function CalcGTSpecialCasesTM(rr, pr, ar) {
  let gt = [];
  let rrGt1 = 0;
  let prGt1 = 0;
  let arGt1 = 0;
  let rrGt2 = 0;
  let prGt2 = 0;
  let arGt2 = 0;
  let rrGt3 = 0;
  let prGt3 = 0;
  let arGt3 = 0;
  let rrGt4 = 0;
  let prGt4 = 0;
  let arGt4 = 0;
  let rrGt5 = 0;
  let prGt5 = 0;
  let arGt5 = 0;

  if (rr == 0 && pr == 1 && ar == 0) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);
    gt.push(arGt1);

    rrGt2 = 0.4142;
    prGt2 = 1.0;
    arGt2 = 0.0;

    gt.push(rrGt2);
    gt.push(prGt2);
    gt.push(arGt2);

    rrGt3 = 0.6682;
    prGt3 = 1.0;
    arGt3 = 0.0;

    gt.push(rrGt3);
    gt.push(prGt3);
    gt.push(arGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;
    arGt4 = 0.0;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;
    arGt5 = 0.5;

    gt.push(rrGt5);
    gt.push(prGt5);
    gt.push(arGt5);

    return gt;
  } else if (rr == 0 && pr == 1 && ar == 1) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);
    gt.push(arGt1);

    rrGt2 = 0.4142;
    prGt2 = 1.0;
    arGt2 = 1.0;

    gt.push(rrGt2);
    gt.push(prGt2);
    gt.push(arGt2);

    rrGt3 = 0.6682;
    prGt3 = 1.0;
    arGt3 = 1.0;

    gt.push(rrGt3);
    gt.push(prGt3);
    gt.push(arGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;
    arGt4 = 1.0;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;
    arGt5 = 1.0;

    gt.push(rrGt5);
    gt.push(prGt5);
    gt.push(arGt5);

    return gt;
  } else if (rr == 1 && pr == 0 && ar == 0) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);
    gt.push(arGt1);

    rrGt2 = 1.0;
    prGt2 = 0.4142;
    arGt2 = 0.0;

    gt.push(rrGt2);
    gt.push(prGt2);
    gt.push(arGt2);

    rrGt3 = 1.0;
    prGt3 = 0.6682;
    arGt3 = 0.0;

    gt.push(rrGt3);
    gt.push(prGt3);
    gt.push(arGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;
    arGt4 = 0.0;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;
    arGt5 = 0.5;

    gt.push(rrGt5);
    gt.push(prGt5);
    gt.push(arGt5);

    return gt;
  } else if (rr == 1 && pr == 0 && ar == 1) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);
    gt.push(arGt1);

    rrGt2 = 1.0;
    prGt2 = 0.4142;
    arGt2 = 1.0;

    gt.push(rrGt2);
    gt.push(prGt2);
    gt.push(arGt2);

    rrGt3 = 1.0;
    prGt3 = 0.6682;
    arGt3 = 1.0;

    gt.push(rrGt3);
    gt.push(prGt3);
    gt.push(arGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;
    arGt4 = 1.0;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;
    arGt5 = 1.0;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    return gt;
  } else if (rr == 0 && pr == 0 && ar == 1) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);
    gt.push(arGt1);

    rrGt2 = 0.25;
    prGt2 = 0.25;
    arGt2 = 1.0;

    gt.push(rrGt2);
    gt.push(prGt2);
    gt.push(arGt2);

    rrGt3 = 0.5;
    prGt3 = 0.5;
    arGt3 = 1.0;

    gt.push(rrGt3);
    gt.push(prGt3);
    gt.push(arGt3);

    rrGt4 = 0.75;
    prGt4 = 0.75;
    arGt4 = 1.0;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;
    arGt5 = 1.0;

    gt.push(rrGt5);
    gt.push(prGt5);
    gt.push(arGt5);

    return gt;
  } else if (rr == 1 && pr == 1 && ar == 0) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;

    gt.push(rrGt1);
    gt.push(prGt1);
    gt.push(arGt1);

    rrGt2 = 1.0;
    prGt2 = 1.0;
    arGt2 = 0.25;

    gt.push(rrGt2);
    gt.push(prGt2);
    gt.push(arGt2);

    rrGt3 = 1.0;
    prGt3 = 1.0;
    arGt3 = 0.5;

    gt.push(rrGt3);
    gt.push(prGt3);
    gt.push(arGt3);

    rrGt4 = 1.0;
    prGt4 = 1.0;
    arGt4 = 0.75;

    gt.push(rrGt4);
    gt.push(prGt4);
    gt.push(arGt4);

    rrGt5 = 1.0;
    prGt5 = 1.0;
    arGt5 = 1.0;

    gt.push(rrGt5);
    gt.push(prGt5);
    gt.push(arGt5);

    return gt;
  } else if (
    (rr == 0 && pr == 0 && ar == 0) ||
    (rr == 1 && pr == 1 && ar == 1)
  ) {
    rrGt1 = null;
    prGt1 = null;
    arGt1 = null;
    rrGt2 = null;
    prGt2 = null;
    arGt2 = null;
    rrGt3 = null;
    prGt3 = null;
    arGt3 = null;
    rrGt4 = null;
    prGt4 = null;
    arGt4 = null;
    rrGt5 = null;
    prGt5 = null;
    arGt5 = null;

    return gt;
  }

  return gt;
}


function CalcGT1_CIO(rr, pr, signature) {
  let gt1 = [];

  var slope = pr / rr;

  let eqn = 0;

  let r = 0;
  let rrGt1 = 0;
  let prGt1 = 0;

  // eslint-disable-next-line default-case
  switch (signature) {
    case "Solid Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Rigorous Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3)).toFixed(3));
      break;

    case "Productive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Receptive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3)).toFixed(3));
      break;
  }

  // projects the performance point to the interaction class curve ahead
  if (eqn >= 1.0) return gt1;
  else if (eqn < 1.0 && eqn > 0.9) r = 1.0;
  else if (eqn == 0.9) r = 1.0;
  else if (eqn < 0.9 && eqn > 0.8) r = 0.9;
  else if (eqn == 0.8) r = 0.9;
  else if (eqn < 0.8 && eqn > 0.7) r = 0.8;
  else if (eqn == 0.7) r = 0.8;
  else if (eqn < 0.7 && eqn > 0.6) r = 0.7;
  else if (eqn == 0.6) r = 0.7;
  else if (eqn < 0.6) r = 0.6;

  if (gt1[0] !== null && gt1[1] !== null) {
    // Special case 1

    if (slope == 0) {
      // eslint-disable-next-line default-case
      switch (signature) {
        case "Solid Balanced":
        case "Receptive-Weighted":
          rrGt1 = r;

          prGt1 = 0.0;

          gt1.push(rrGt1, prGt1);

          return gt1;

        case "Rigorous Balanced":
        case "Productive-Weighted":
          rrGt1 = Math.pow(r, 2 / 3);

          prGt1 = 0.0;

          gt1.push(rrGt1, prGt1);

          return gt1;
      }
    }

    // Special case 2
    else if (slope == Number.POSITIVE_INFINITY) {
      // eslint-disable-next-line default-case
      switch (signature) {
        case "Solid Balanced":
        case "Productive-Weighted":
          rrGt1 = 0.0;

          prGt1 = r;

          gt1.push(rrGt1, prGt1);

          return gt1;

        case "Rigorous Balanced":
        case "Receptive-Weighted":
          rrGt1 = 0.0;

          prGt1 = Math.pow(r, 2 / 3);

          gt1.push(rrGt1, prGt1);

          return gt1;
      }
    }
    // General Case for growth target 1
    else {
      // eslint-disable-next-line default-case
      switch (signature) {
        case "Solid Balanced":
          rrGt1 = r * Math.pow(1 + Math.pow(pr / rr, 2), -0.5);

          prGt1 = (pr / rr) * rrGt1;

          gt1.push(rrGt1, prGt1);

          return gt1;

        case "Rigorous Balanced":
          rrGt1 =
            Math.pow(r, 2 / 3) * Math.pow(1 + Math.pow(pr / rr, 3), -(1 / 3));

          prGt1 = (pr / rr) * rrGt1;

          gt1.push(rrGt1, prGt1);

          return gt1;

        case "Productive-Weighted":
          var s = Math.pow(pr / rr, 2);
          var t = Math.pow(r, 2);
          var roots = FindRoots(1, s, 0, -t);

          rrGt1 = 0.0;

          // To find positive real roots from the solution
          for (var i = 0; i <= 3; i = i + 1) {
            if (roots[i] >= 0 && roots[i] <= 1) {
              rrGt1 = roots[i];
            }
          }

          prGt1 = Math.sqrt(s) * rrGt1;

          gt1.push(rrGt1, prGt1);

          return gt1;

        case "Receptive-Weighted":
          s = Math.pow(pr / rr, 3);
          t = Math.pow(r, 2);
          roots = FindRoots(s, 1, 0, -t);

          rrGt1 = 0.0;

          // To find positive real roots from the solution
          for (var j = 0; j <= 3; j = j + 1) {
            if (roots[j] >= 0 && roots[j] <= 1) {
              rrGt1 = roots[j];
            }
          }

          prGt1 = Math.cbrt(s) * rrGt1;

          gt1.push(rrGt1, prGt1);

          return gt1;
      }
    }
  } else {
    return gt1;
  }
  return gt1;
}



function CalcGT1(rr, pr, ar) {
  let gt1 = [];

  let eqn = 0;

  let r = 0;
  let rrGt1 = 0;
  let prGt1 = 0;
  let arGt1 = 0;

  eqn = parseFloat(
    Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2)).toFixed(3)
  );

  // projects the performance point to the interaction class surface ahead
  if (eqn >= 1.0) return gt1;
  else if (eqn < 1.0 && eqn > 0.9) r = 1.0;
  else if (eqn == 0.9) r = 1.0;
  else if (eqn < 0.9 && eqn > 0.8) r = 0.9;
  else if (eqn == 0.8) r = 0.9;
  else if (eqn < 0.8 && eqn > 0.7) r = 0.8;
  else if (eqn == 0.7) r = 0.8;
  else if (eqn < 0.7 && eqn > 0.6) r = 0.7;
  else if (eqn == 0.6) r = 0.7;
  else if (eqn < 0.6) r = 0.6;

  if (gt1[0] !== null && gt1[1] !== null && gt1[2] !== null) {
    // Special Case 1
    if (pr == 0 && rr == 0) {
      rrGt1 = 0.0;

      prGt1 = 0.0;

      arGt1 = r;

      gt1.push(rrGt1, prGt1, arGt1);

      return gt1;
    }

    // Special Case 2
    else if (rr == 0 && ar == 0) {
      rrGt1 = 0.0;

      prGt1 = r;

      arGt1 = 0.0;

      gt1.push(rrGt1, prGt1, arGt1);

      return gt1;
    }

    // Special Case 3
    else if (pr == 0 && ar == 0) {
      rrGt1 = r;

      prGt1 = 0.0;

      arGt1 = 0.0;

      gt1.push(rrGt1, prGt1, arGt1);

      return gt1;
    }

    // General Case for growth target 1
    else {
      rrGt1 =
        r * Math.pow(1 + (Math.pow(pr / rr, 2) + Math.pow(ar / rr, 2)), -0.5);

      prGt1 =
        r * Math.pow(1 + (Math.pow(rr / pr, 2) + Math.pow(ar / pr, 2)), -0.5);

      arGt1 =
        r * Math.pow(1 + (Math.pow(rr / ar, 2) + Math.pow(pr / ar, 2)), -0.5);

      gt1.push(rrGt1, prGt1, arGt1);

      return gt1;
    }
  } else {
    return gt1;
  }
  // return gt1;
}


function CalcGT2_CIO(rr, pr, signature) {
  let gt2 = [];

  var productiveLine = parseFloat(Math.tan((67.5 * Math.PI) / 180).toFixed(3));
  var balancedLine = parseFloat(Math.tan((45 * Math.PI) / 180).toFixed(3));
  var receptiveLine = parseFloat(Math.tan((22.5 * Math.PI) / 180).toFixed(3));

  var adjacentLine = "";
  var biasLine = false;
  var onCurve = false;
  var caseB = false;

  var slope = parseFloat((pr / rr).toFixed(3));
  let eqn = 0;

  let r = 0;
  let s = 0;
  let t = 0;
  let rrGt2 = 0;
  let prGt2 = 0;
  let roots = 0;

  // eslint-disable-next-line default-case
  switch (signature) {
    case "Solid Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Rigorous Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3)).toFixed(3));
      break;

    case "Productive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Receptive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3)).toFixed(3));
      break;
  }
  // Checking for the Class Area On, Within, Above
  if (eqn > 1.0) {
    caseB = true;
  } else if (eqn == 1.0) {
    onCurve = true;
    r = 1.0;
  } else if (eqn < 1.0 && eqn > 0.9) {
    r = 0.9;
  } else if (eqn == 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn < 0.9 && eqn > 0.8) {
    r = 0.8;
  } else if (eqn == 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn < 0.8 && eqn > 0.7) {
    r = 0.7;
  } else if (eqn == 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn < 0.7 && eqn > 0.6) {
    r = 0.6;
  } else if (eqn == 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn < 0.6) {
    r = 0.6;
  }

  // Checking the point position for Productive, Balanced, Receptive bias lines
  if (slope > productiveLine) {
    adjacentLine = "productive";
    caseB = true;
  } else if (slope == productiveLine) {
    adjacentLine = "productive";
    biasLine = true;
  } else if (slope < productiveLine && slope > balancedLine) {
    adjacentLine = "productive" && gt2;
    // GT2 does not exist if point lies inside the productive area
  } else if ((slope == balancedLine) & gt2) {
  } else if (slope > receptiveLine && slope < balancedLine) {
    adjacentLine = "receptive" & gt2;
    // GT2 does not exist if point lies inside the receptive area
  } else if (slope == receptiveLine) {
    adjacentLine = "receptive";
    biasLine = true;
  } else if (slope < receptiveLine) {
    adjacentLine = "receptive";
    caseB = true;
  }

  if (gt2[0] !== null && gt2[1] !== null) {
    // Case A (If the previous point lies on any interaction class curve, then GT2 is the intersection point of the interaction class curve and the adjacent bias line)
    if (onCurve) {
      if (adjacentLine == "productive") {
        // eslint-disable-next-line default-case
        switch (signature) {
          case "Solid Balanced":
            rrGt2 =
              r *
              Math.pow(1 + Math.pow(Math.tan((67.5 * Math.PI) / 180), 2), -0.5);

            prGt2 = Math.tan((67.5 * Math.PI) / 180) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;

          case "Rigorous Balanced":
            rrGt2 =
              Math.pow(r, 2 / 3) *
              Math.pow(
                1 + Math.pow(Math.tan((67.5 * Math.PI) / 180), 3),
                -(1 / 3)
              );

            prGt2 = Math.tan((67.5 * Math.PI) / 180) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;

          case "Productive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((67.5 * Math.PI) / 180), 2);
            t = Math.pow(r, 2);
            roots = FindRoots(1, s, 0, -t);

            rrGt2 = 0.0;

            // To find  real parts of positive real roots from the solution

            for (var i = 0; i <= 3; i = i + 1) {
              if (roots[i] >= 0 && roots[i] <= 1) {
                rrGt2 = roots[i];
              }
            }

            prGt2 = Math.sqrt(s) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;

          case "Receptive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((67.5 * Math.PI) / 180), 3);
            t = Math.pow(r, 2);
            roots = FindRoots(s, 1, 0, -t);

            rrGt2 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var j = 0; j <= 3; j = j + 1) {
              if (roots[j] >= 0 && roots[j] <= 1) {
                rrGt2 = roots[j];
              }
            }

            prGt2 = Math.cbrt(s) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;
        }
      } else if (adjacentLine == "receptive") {
        // eslint-disable-next-line default-case
        switch (signature) {
          case "Solid Balanced":
            rrGt2 =
              r *
              Math.pow(1 + Math.pow(Math.tan((22.5 * Math.PI) / 180), 2), -0.5);

            prGt2 = Math.tan((22.5 * Math.PI) / 180) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;

          case "Rigorous Balanced":
            rrGt2 =
              Math.pow(r, 2 / 3) *
              Math.pow(
                1 + Math.pow(Math.tan((22.5 * Math.PI) / 180), 3),
                -(1 / 3)
              );

            prGt2 = Math.tan((22.5 * Math.PI) / 180) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;

          case "Productive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((22.5 * Math.PI) / 180), 2);
            t = Math.pow(r, 2);
            roots = FindRoots(1, s, 0, -t);

            rrGt2 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var z = 0; z <= 3; z = z + 1) {
              if (roots[z] >= 0 && roots[z] <= 1) {
                rrGt2 = roots[z];
              }
            }

            prGt2 = Math.sqrt(s) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;

          case "Receptive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((22.5 * Math.PI) / 180), 3);
            t = Math.pow(r, 2);
            roots = FindRoots(s, 1, 0, -t);

            rrGt2 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var w = 0; w <= 3; w = w + 1) {
              if (roots[w] >= 0 && roots[w] <= 1) {
                rrGt2 = roots[w];
              }
            }

            prGt2 = Math.cbrt(s) * rrGt2;

            gt2.push(rrGt2, prGt2);

            return gt2;
        }
      }
    }

    // Case B (If the previous point lies within the area above the interaction class curves on the outside of the adjacent bias line)
    if (caseB) {
      if (adjacentLine == "productive") {
        rrGt2 = pr * (1 / Math.tan((67.5 * Math.PI) / 180));

        prGt2 = pr;

        gt2.push(rrGt2, prGt2);

        return gt2;
      } else if (adjacentLine == "receptive") {
        rrGt2 = rr;

        prGt2 = rr * Math.tan((22.5 * Math.PI) / 180);

        gt2.push(rrGt2, prGt2);

        return gt2;
      }
    }

    // Case C (If the previous point lies on the productive bias line or the receptive bias line, then GT2 is coincident with the previous point on the unit square boundary)

    if (biasLine) {
      rrGt2 = rr;

      prGt2 = pr;

      gt2.push(rrGt2, prGt2);

      return gt2;
    }
  } else {
    return gt2;
  }

  return gt2;
}


function CalcGT2(rr, pr, ar) {
  let gt2 = [];

  var productiveLine = parseFloat(Math.tan((67.5 * Math.PI) / 180).toFixed(3));
  var balancedLine = parseFloat(Math.tan((45 * Math.PI) / 180).toFixed(3));
  var receptiveLine = parseFloat(Math.tan((22.5 * Math.PI) / 180).toFixed(3));

  var adjacentLine = "";
  var biasLine = false;
  var onCurve = false;
  var caseB = false;

  var slope = parseFloat((pr / rr).toFixed(3));
  let rrGt2 = 0;
  let prGt2 = 0;
  let arGt2 = 0;
  let eqn = 0;
  let r = 0;

  eqn = parseFloat(
    Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2)).toFixed(3)
  );

  // Checking for the Class Area On, Within, Above
  if (eqn > 1.0) {
    caseB = true;
  } else if (eqn == 1.0) {
    onCurve = true;
    r = 1.0;
  } else if (eqn < 1.0 && eqn > 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn == 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn < 0.9 && eqn > 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn == 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn < 0.8 && eqn > 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn == 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn < 0.7 && eqn > 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn == 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn < 0.6) {
    r = 0.6;
  }
  // Checking the point position for Productive, Balanced, Receptive bias lines
  if (slope > productiveLine) {
    adjacentLine = "productive";
    caseB = true;
  } else if (slope == productiveLine) {
    adjacentLine = "productive";
    biasLine = true;
  } else if (slope < productiveLine && slope > balancedLine) {
    adjacentLine = "productive" && gt2;
    // GT2 does not exist if point lies inside the productive area
  } else if ((slope == balancedLine) & gt2) {
  } else if (slope > receptiveLine && slope < balancedLine) {
    adjacentLine = "receptive" & gt2;
    // GT2 does not exist if point lies inside the receptive area
  } else if (slope == receptiveLine) {
    adjacentLine = "receptive";
    biasLine = true;
  } else if (slope < receptiveLine) {
    adjacentLine = "receptive";
    caseB = true;
  }

  if (gt2[0] !== null && gt2[1] !== null && gt2[2] !== null) {
    // Case A (If the previous point lies on any interaction class surface, then GT2 is the intersection point of the interaction class surface and the adjacent bias plane)
    if (onCurve) {
      if (adjacentLine == "productive") {
        rrGt2 =
          r * Math.pow(1 + Math.pow(Math.tan((67.5 * Math.PI) / 180), 2), -0.5);

        prGt2 = Math.tan((67.5 * Math.PI) / 180) * rrGt2;

        arGt2 = ar;

        gt2.push(rrGt2, prGt2, arGt2);

        return gt2;
      } else if (adjacentLine == "receptive") {
        rrGt2 =
          r * Math.pow(1 + Math.pow(Math.tan((22.5 * Math.PI) / 180), 2), -0.5);

        prGt2 = Math.tan((22.5 * Math.PI) / 180) * rrGt2;

        arGt2 = ar;

        gt2.push(rrGt2, prGt2, arGt2);

        return gt2;
      }
    }

    // Case B (If the previous point lies within the area above the interaction class surfaces on the outside of the adjacent bias plane)
    if (caseB) {
      if (adjacentLine == "productive") {
        rrGt2 = pr * (1 / Math.tan((67.5 * Math.PI) / 180));

        prGt2 = pr;

        arGt2 = ar;

        gt2.push(rrGt2, prGt2, arGt2);

        return gt2;
      } else if (adjacentLine == "receptive") {
        rrGt2 = rr;

        prGt2 = rr * Math.tan((22.5 * Math.PI) / 180);

        arGt2 = ar;

        gt2.push(rrGt2, prGt2, arGt2);

        return gt2;
      }
    }

    // Case C (If the previous point lies on the productive bias plane or the receptive bias plane, then GT2 is coincident with the previous point on the unit cube boundary)

    if (biasLine) {
      rrGt2 = rr;

      prGt2 = pr;

      arGt2 = ar;

      gt2.push(rrGt2, prGt2, arGt2);

      return gt2;
    }
  } else {
    return gt2;
  }

  return gt2;
}


function CalcGT3_CIO(rr, pr, signature) {
  let gt3 = [];

  var productiveLine = parseFloat(Math.tan((67.5 * Math.PI) / 180).toFixed(3));
  var balancedLine = parseFloat(Math.tan((45 * Math.PI) / 180).toFixed(3));
  var receptiveLine = parseFloat(Math.tan((22.5 * Math.PI) / 180).toFixed(3));

  var adjacentLine = "";
  var biasLine = false;
  var onCurve = false;
  var caseB = false;

  var slope = parseFloat((pr / rr).toFixed(3));

  let eqn = 0;

  let r = 0;
  let s = 0;
  let t = 0;
  let roots = 0;
  let rrGt3 = 0;
  let prGt3 = 0;

  // eslint-disable-next-line default-case
  switch (signature) {
    case "Solid Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Rigorous Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3)).toFixed(3));
      break;

    case "Productive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Receptive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3)).toFixed(3));
      break;
  }

  // Checking for the Class Area On, Within, Above
  if (eqn > 1.0) {
    caseB = true;
  } else if (eqn == 1.0) {
    onCurve = true;
    r = 1.0;
  } else if (eqn < 1.0 && eqn > 0.9) {
    r = 0.9;
  } else if (eqn == 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn < 0.9 && eqn > 0.8) {
    r = 0.8;
  } else if (eqn == 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn < 0.8 && eqn > 0.7) {
    r = 0.7;
  } else if (eqn == 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn < 0.7 && eqn > 0.6) {
    r = 0.6;
  } else if (eqn == 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn < 0.6) {
    r = 0.6;
  }

  // Checking the point position for Productive, Balanced, Receptive bias lines
  if (slope > productiveLine) {
    adjacentLine = "productive";
    caseB = true;
  } else if (slope == productiveLine) {
    adjacentLine = "productive";
    biasLine = true;
  } else if (slope < productiveLine && slope > balancedLine) {
    adjacentLine = "productive";
    // eslint-disable-next-line no-unused-expressions
    gt3[0] == null && gt3[1] == null;
    // GT2 does not exist if point lies inside the productive area
  } else if (slope == balancedLine) {
    // eslint-disable-next-line no-unused-expressions
    gt3[0] == null && gt3[1] == null;
  } else if (slope > receptiveLine && slope < balancedLine) {
    adjacentLine = "receptive";
    // eslint-disable-next-line no-unused-expressions
    gt3[0] == null && gt3[1] == null;
    // GT2 does not exist if point lies inside the receptive area
  } else if (slope == receptiveLine) {
    adjacentLine = "receptive";
    biasLine = true;
  } else if (slope < receptiveLine) {
    adjacentLine = "receptive";
    caseB = true;
  }

  if (gt3[0] !== null && gt3[1] !== null) {
    // Case A (If GT2 lies on any interaction class curve, then GT3 is the midpoint between the adjacent bias line and the balanced line on the interaction class curve)
    if (onCurve) {
      if (adjacentLine == "productive") {
        // eslint-disable-next-line default-case
        switch (signature) {
          case "Solid Balanced":
            rrGt3 =
              r *
              Math.pow(
                1 + Math.pow(Math.tan((56.25 * Math.PI) / 180), 2),
                -0.5
              );

            prGt3 = Math.tan((56.25 * Math.PI) / 180) * rrGt3;

            gt3.push(rrGt3, prGt3);

            return gt3;

          case "Rigorous Balanced":
            rrGt3 =
              Math.pow(r, 2 / 3) *
              Math.pow(
                1 + Math.pow(Math.tan((56.25 * Math.PI) / 180), 3),
                -(1 / 3)
              );

            prGt3 = Math.pow(Math.pow(r, 2) - Math.pow(rrGt3, 3), 1 / 3);

            gt3.push(rrGt3, prGt3);

            return gt3;

          case "Productive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((56.25 * Math.PI) / 180), 2);
            t = Math.pow(r, 2);
            roots = FindRoots(1, s, 0, -t);

            rrGt3 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var i = 0; i <= 3; i = i + 1) {
              if (roots[i] >= 0 && roots[i] <= 1) {
                rrGt3 = roots[i];
              }
            }

            prGt3 = Math.sqrt(s) * rrGt3;

            gt3.push(rrGt3, prGt3);

            return gt3;

          case "Receptive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((56.25 * Math.PI) / 180), 3);
            t = Math.pow(r, 2);
            roots = FindRoots(s, 1, 0, -t);

            rrGt3 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var j = 0; j <= 3; j = j + 1) {
              if (roots[j] >= 0 && roots[j] <= 1) {
                rrGt3 = roots[j];
              }
            }

            prGt3 = Math.cbrt(s) * rrGt3;

            gt3.push(rrGt3, prGt3);

            return gt3;
        }
      } else if (adjacentLine == "receptive") {
        // eslint-disable-next-line default-case
        switch (signature) {
          case "Solid Balanced":
            rrGt3 =
              r *
              Math.pow(
                1 + Math.pow(Math.tan((33.75 * Math.PI) / 180), 2),
                -0.5
              );

            prGt3 = Math.tan((33.75 * Math.PI) / 180) * rrGt3;

            gt3.push(rrGt3, prGt3);

            return gt3;

          case "Rigorous Balanced":
            rrGt3 =
              Math.pow(r, 2 / 3) *
              Math.pow(
                1 + Math.pow(Math.tan((33.75 * Math.PI) / 180), 3),
                -(1 / 3)
              );

            prGt3 = Math.pow(Math.pow(r, 2) - Math.pow(rrGt3, 3), 1 / 3);

            gt3.push(rrGt3, prGt3);

            return gt3;

          case "Productive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((33.75 * Math.PI) / 180), 2);
            t = Math.pow(r, 2);
            roots = FindRoots(1, s, 0, -t);

            rrGt3 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var z = 0; z <= 3; z = z + 1) {
              if (roots[z] >= 0 && roots[z] <= 1) {
                rrGt3 = roots[z];
              }
            }

            prGt3 = Math.sqrt(s) * rrGt3;

            gt3.push(rrGt3, prGt3);

            return gt3;

          case "Receptive-Weighted":
            // Dummy variables s and t
            s = Math.pow(Math.tan((33.75 * Math.PI) / 180), 3);
            t = Math.pow(r, 2);
            roots = FindRoots(s, 1, 0, -t);

            rrGt3 = 0.0;

            // To find  real parts of positive real roots from the solution
            for (var x = 0; x <= 3; x = x + 1) {
              if (roots[x] >= 0 && roots[x] <= 1) {
                rrGt3 = roots[x];
              }
            }

            prGt3 = Math.cbrt(s) * rrGt3;

            gt3.push(rrGt3, prGt3);

            return gt3;
        }
      }
    }

    // Case B (If GT2 lies within the area above the interaction class curves, then GT3 is the horizontal midpoint between the adjacent bias line and the balanced line)
    if (caseB) {
      if (adjacentLine == "productive") {
        rrGt3 = (pr * 1) / Math.tan((56.25 * Math.PI) / 180);

        prGt3 = pr;

        gt3.push(rrGt3, prGt3);

        return gt3;
      } else if (adjacentLine == "receptive") {
        rrGt3 = rr;

        prGt3 = rr * Math.tan((33.75 * Math.PI) / 180);

        gt3.push(rrGt3, prGt3);

        return gt3;
      }
    }
  } else {
    return gt3;
  }

  return gt3;
}


function CalcGT3(rr, pr, ar) {
  let gt3 = [];

  var productiveLine = parseFloat(Math.tan((67.5 * Math.PI) / 180).toFixed(3));
  var balancedLine = parseFloat(Math.tan((45 * Math.PI) / 180).toFixed(3));
  var receptiveLine = parseFloat(Math.tan((22.5 * Math.PI) / 180).toFixed(3));

  var adjacentLine = "";
  var biasLine = false;
  var onCurve = false;
  var caseB = false;

  var slope = parseFloat((pr / rr).toFixed(3));

  let eqn = 0.0;
  let rrGt3 = 0;
  let prGt3 = 0;
  let arGt3 = 0;
  let r = 0.0;

  eqn = parseFloat(
    Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2)).toFixed(3)
  );
  // Checking for the Class Area On, Within, Above
  if (eqn > 1.01) {
    caseB = true;
  } else if (eqn == 1.0 || (eqn <= 1.01 && eqn > 1)) {
    onCurve = true;
    r = 1.0;
  } else if (eqn < 1.0 && eqn > 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn == 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn < 0.9 && eqn > 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn == 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn < 0.8 && eqn > 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn == 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn < 0.7 && eqn > 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn == 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn < 0.6) {
    r = 0.6;
  }

  // Checking the point position for Productive, Balanced, Receptive bias lines
  if (slope > productiveLine) {
    adjacentLine = "productive";
    caseB = true;
  } else if (slope == productiveLine) {
    adjacentLine = "productive";
    biasLine = true;
  } else if (slope < productiveLine && slope > balancedLine) {
    adjacentLine = "productive";
    // eslint-disable-next-line no-unused-expressions
    gt3[0] == null && gt3[1] == null && gt3[2] == null;
    // GT2 does not exist if point lies inside the productive area
  } else if (slope == balancedLine) {
    // eslint-disable-next-line no-unused-expressions
    gt3[0] == null && gt3[1] == null && gt3[2] == null;
  } else if (slope > receptiveLine && slope < balancedLine) {
    adjacentLine = "receptive";
    // eslint-disable-next-line no-unused-expressions
    gt3[0] == null && gt3[1] == null && gt3[2] == null;
    // GT2 does not exist if point lies inside the receptive area
  } else if (slope == receptiveLine) {
    adjacentLine = "receptive";
    biasLine = true;
  } else if (slope < receptiveLine) {
    adjacentLine = "receptive";
    caseB = true;
  }

  if (gt3[0] !== null && gt3[1] !== null && gt3[2] !== null) {
    // Case A (If GT2 lies on any interaction class surface, then GT3 is the midpoint between the adjacent bias plane and the balanced plane on the interaction class surface)
    if (onCurve) {
      if (adjacentLine == "productive") {
        rrGt3 =
          r *
          Math.pow(1 + Math.pow(Math.tan((56.25 * Math.PI) / 180), 2), -0.5);

        prGt3 = Math.tan((56.25 * Math.PI) / 180) * rrGt3;

        arGt3 = ar;

        gt3.push(rrGt3, prGt3, arGt3);

        return gt3;
      } else if (adjacentLine == "receptive") {
        rrGt3 =
          r *
          Math.pow(1 + Math.pow(Math.tan((33.75 * Math.PI) / 180), 2), -0.5);

        prGt3 = Math.tan((33.75 * Math.PI) / 180) * rrGt3;

        arGt3 = ar;

        gt3.push(rrGt3, prGt3, arGt3);

        return gt3;
      }
    }

    // Case B (If GT2 lies within the area above the interaction class surfaces, then GT3 is the horizontal midpoint between the adjacent bias plane and the balanced plane)
    if (caseB) {
      if (adjacentLine == "productive") {
        rrGt3 = (pr * 1) / Math.tan((56.25 * Math.PI) / 180);

        prGt3 = pr;

        arGt3 = ar;

        gt3.push(rrGt3, prGt3, arGt3);

        return gt3;
      } else if (adjacentLine == "receptive") {
        rrGt3 = rr;

        prGt3 = rr * Math.tan((33.75 * Math.PI) / 180);

        arGt3 = ar;

        gt3.push(rrGt3, prGt3, arGt3);

        return gt3;
      }
    }
  } else {
    return gt3;
  }

  return gt3;
}



function CalcGT4_CIO(rr, pr, signature) {
  let gt4 = [];

  var productiveLine = parseFloat(Math.tan((67.5 * Math.PI) / 180)).toFixed(3);
  var balancedLine = parseFloat(Math.tan((45.0 * Math.PI) / 180)).toFixed(3);
  var receptiveLine = parseFloat(Math.tan((22.5 * Math.PI) / 180)).toFixed(3);

  var adjacentLine = null;
  var onCurve = false;
  var caseB = false;
  var caseC = false;

  var slope = parseFloat(pr / rr).toFixed(3);

  let eqn = 0;
  let rrGt4 = 0;
  let prGt4 = 0;
  let s = 0;
  let t = 0;
  let roots = 0;
  let r = 0;

  // eslint-disable-next-line default-case
  switch (signature) {
    case "Solid Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Rigorous Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3)).toFixed(3));
      break;

    case "Productive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Receptive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3)).toFixed(3));
      break;
  }

  // Checking for the Class Area On, Within, Above
  if (eqn > 1.0) {
    caseB = true;
  } else if (eqn == 1.0) {
    onCurve = true;
    r = 1.0;
  } else if (eqn < 1.0 && eqn > 0.9) {
    r = 1.0;
  } else if (eqn == 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn < 0.9 && eqn > 0.8) {
    r = 0.9;
  } else if (eqn == 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn < 0.8 && eqn > 0.7) {
    r = 0.8;
  } else if (eqn == 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn < 0.7 && eqn > 0.6) {
    r = 0.7;
  } else if (eqn == 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn < 0.6) {
    r = 0.6;
  }

  // Checking the point position for Productive, Balanced, Receptive bias lines
  if (slope > productiveLine) {
    adjacentLine = "productive";
  } else if (slope == productiveLine) {
    adjacentLine = "productive";
  } else if (slope < productiveLine && slope > balancedLine) {
    adjacentLine = "productive";
    caseB = true;
  } else if (slope == balancedLine) {
    caseC = true;
    caseB = false;
  } else if (slope > receptiveLine && slope < balancedLine) {
    adjacentLine = "receptive";
    caseB = true;
  } else if (slope == receptiveLine) {
    adjacentLine = "receptive";
  } else if (slope < receptiveLine) {
    adjacentLine = "receptive";
  }

  if (gt4[0] !== null && gt4[1] !== null) {
    // Formulas for GT4 signature case 1 (SOLID and BALANCED curve)
    // Case A (If the previous point lies on any interaction class curve, then GT4 is the intersection point of the interaction class curve and the balance line)
    if (onCurve) {
      // eslint-disable-next-line default-case
      switch (signature) {
        case "Solid Balanced":
          rrGt4 = (Math.sqrt(2) / 2) * r;

          prGt4 = rrGt4;

          gt4.push(rrGt4, prGt4);

          return gt4;

        case "Rigorous Balanced":
          rrGt4 = Math.pow(2, -1 / 3) * Math.pow(r, 2 / 3);

          prGt4 = rrGt4;

          gt4.push(rrGt4, prGt4);

          return gt4;

        case "Productive-Weighted":
        case "Receptive-Weighted":
          // Dummy variables s and t
          s = 1.0;
          t = Math.pow(r, 2);
          roots = FindRoots(1, s, 0, -t);

          rrGt4 = 0.0;

          // To find  real parts of positive real roots from the solution
          for (var i = 0; i <= 3; i = i + 1) {
            if (roots[i] >= 0 && roots[i] <= 1) {
              rrGt4 = roots[i];
            }
          }

          prGt4 = rrGt4;

          gt4.push(rrGt4, prGt4);

          return gt4;
      }
    }

    // Case B (If the previous point lies within the area above the interaction class curves on the inside of the productive bias line or the inside of the receptive bias line)
    if (caseB) {
      if (adjacentLine == "productive") {
        rrGt4 = pr;

        prGt4 = pr;

        gt4.push(rrGt4, prGt4);

        return gt4;
      } else if (adjacentLine == "receptive") {
        rrGt4 = rr;

        prGt4 = rr;

        gt4.push(rrGt4, prGt4);

        return gt4;
      }
    }

    // Case C (If the previous point lies on the balance line, then GT4 is coincident with the previous point on the unit square boundary)
    if (caseC) {
      rrGt4 = rr;

      prGt4 = pr;

      gt4.push(rrGt4, prGt4);

      return gt4;
    }
  } else {
    return gt4;
  }

  return gt4;
}


function CalcGT4(rr, pr, ar) {
  let gt4 = [];

  var productiveLine = parseFloat(Math.tan((67.5 * Math.PI) / 180)).toFixed(3);
  var balancedLine = parseFloat(Math.tan((45.0 * Math.PI) / 180)).toFixed(3);
  var receptiveLine = parseFloat(Math.tan((22.5 * Math.PI) / 180)).toFixed(3);

  var adjacentLine = "";
  var onCurve = false;
  var caseB = false;
  var caseC = false;

  var slope = parseFloat(pr / rr).toFixed(3);

  let eqn = 0;
  let rrGt4 = 0;
  let prGt4 = 0;
  let arGt4 = 0;
  let r = 0;

  eqn = parseFloat(
    Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2)).toFixed(3)
  );

  // Checking for the Class Area On, Within, Above
  if (eqn > 1.01) {
    caseB = true;
  } else if (eqn == 1.0 || (eqn <= 1.01 && eqn > 1)) {
    onCurve = true;
    r = 1.0;
  } else if (eqn < 1.0 && eqn > 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn == 0.9) {
    onCurve = true;
    r = 0.9;
  } else if (eqn < 0.9 && eqn > 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn == 0.8) {
    onCurve = true;
    r = 0.8;
  } else if (eqn < 0.8 && eqn > 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn == 0.7) {
    onCurve = true;
    r = 0.7;
  } else if (eqn < 0.7 && eqn > 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn == 0.6) {
    onCurve = true;
    r = 0.6;
  } else if (eqn < 0.6) {
    r = 0.6;
  }

  // Checking the point position for Productive, Balanced, Receptive bias plane
  if (slope > productiveLine) {
    adjacentLine = "productive";
  } else if (slope == productiveLine) {
    adjacentLine = "productive";
  } else if (slope < productiveLine && slope > balancedLine) {
    adjacentLine = "productive";
    caseB = true;
  } else if (slope == balancedLine) {
    caseC = true;
    caseB = false;
  } else if (slope > receptiveLine && slope < balancedLine) {
    adjacentLine = "receptive";
    caseB = true;
  } else if (slope == receptiveLine) {
    adjacentLine = "receptive";
  } else if (slope < receptiveLine) {
    adjacentLine = "receptive";
  }

  if (gt4[0] !== null && gt4[1] !== null && gt4[2] !== null) {
    // Case A (If the previous point lies on any interaction class surface, then GT4 is the intersection point of the interaction class surface and the balance plane)
    if (onCurve) {
      rrGt4 = (Math.sqrt(2) / 2) * r;

      prGt4 = rrGt4;

      arGt4 = ar;

      gt4.push(rrGt4, prGt4, arGt4);

      return gt4;
    }

    // Case B (If the previous point lies within the area above the interaction class surfaces on the inside of the productive bias plane or the inside of the receptive bias plane)
    if (caseB) {
      if (adjacentLine == "productive") {
        rrGt4 = pr;

        prGt4 = pr;

        arGt4 = ar;

        gt4.push(rrGt4, prGt4, arGt4);

        return gt4;
      } else if (adjacentLine == "receptive") {
        rrGt4 = rr;

        prGt4 = rr;

        arGt4 = ar;

        gt4.push(rrGt4, prGt4, arGt4);

        return gt4;
      }
    }

    // Case C (If the previous point lies on the balance plane, then GT4 is coincident with the previous point on the unit cube boundary)

    if (caseC) {
      rrGt4 = rr;

      prGt4 = pr;

      arGt4 = ar;

      gt4.push(rrGt4, prGt4, arGt4);

      return gt4;
    }
  } else {
    return gt4;
  }

  return gt4;
}


function CalcGT5_CIO(rr, pr, signature) {
  let gt5 = [];

  var onCurve = false;
  var caseB = false;

  var r_0 = 0; // the interaction coefficient associated with the initial interaction class curve
  var r_f = 0; // the interaction coefficient associated with the forward interaction class curve.
  let rrGt5 = 0;
  let prGt5 = 0;
  let eqn = 0;
  let s = 0;
  let t = 0;
  let roots = 0;

  // eslint-disable-next-line default-case
  switch (signature) {
    case "Solid Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Rigorous Balanced":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 3)).toFixed(3));
      break;

    case "Productive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 3) + Math.pow(pr, 2)).toFixed(3));
      break;

    case "Receptive-Weighted":
      eqn = parseFloat(Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 3)).toFixed(3));
      break;
  }

  // Checking for the Class Area On, Within, Above
  if (eqn >= 1.0) {
    caseB = true;
  } else if (eqn < 1.0 && eqn > 0.9) {
    onCurve = true;
    r_0 = 0.9;
    r_f = 1.0;
  } else if (eqn == 0.9) {
    onCurve = true;
    r_0 = 0.9;
    r_f = 1.0;
  } else if (eqn < 0.9 && eqn > 0.8) {
    onCurve = true;
    r_0 = 0.8;
    r_f = 0.9;
  } else if (eqn == 0.8) {
    onCurve = true;
    r_0 = 0.8;
    r_f = 0.9;
  } else if (eqn < 0.8 && eqn > 0.7) {
    onCurve = true;
    r_0 = 0.7;
    r_f = 0.8;
  } else if (eqn == 0.7) {
    onCurve = true;
    r_0 = 0.7;
    r_f = 0.8;
  } else if (eqn < 0.7 && eqn > 0.6) {
    onCurve = true;
    r_0 = 0.6;
    r_f = 0.7;
  } else if (eqn == 0.6) {
    onCurve = true;
    r_0 = 0.6;
    r_f = 0.7;
  } else if (eqn < 0.6) {
    onCurve = true;
    r_0 = 0.6;
    r_f = 0.7;
  }

  // Case A (If GT4 lies on any interaction class curve, then GT5 is the midpoint between adjacent interaction class curves on the balanced line)
  if (onCurve) {
    // eslint-disable-next-line default-case
    switch (signature) {
      case "Solid Balanced":
        rrGt5 = 0.5 * ((Math.sqrt(2) / 2) * r_f + (Math.sqrt(2) / 2) * r_0);

        prGt5 = 0.5 * ((Math.sqrt(2) / 2) * r_f + (Math.sqrt(2) / 2) * r_0);

        gt5.push(rrGt5, prGt5);

        return gt5;

      case "Rigorous Balanced":
        rrGt5 =
          0.5 *
          (Math.pow(2, -1 / 3) * Math.pow(r_f, 2 / 3) +
            Math.pow(2, -1 / 3) * Math.pow(r_0, 2 / 3));

        prGt5 =
          0.5 *
          (Math.pow(2, -1 / 3) * Math.pow(r_f, 2 / 3) +
            Math.pow(2, -1 / 3) * Math.pow(r_0, 2 / 3));

        gt5.push(rrGt5, prGt5);

        return gt5;

      case "Productive-Weighted":
      case "Receptive-Weighted":
        // Dummy variables s and t
        s = 1.0;
        t = Math.pow(r_0, 2);
        roots = FindRoots(1, s, 0, -t);

        var rrIPB_r0 = 0.0;

        // To find positive real roots from the solution
        for (var i = 0; i <= 3; i = i + 1) {
          if (roots[i] >= 0 && roots[i] <= 1) {
            rrIPB_r0 = roots[i];
          }
        }

        var prIPB_r0 = rrIPB_r0;

        // Roots when t = r_f
        var t_f = Math.pow(r_f, 2);
        var roots2 = FindRoots(1, s, 0, -t_f);
        var rrIPB_rf = 0.0;
        // To find positive real roots from the solution
        for (var j = 0; j <= 3; j = j + 1) {
          if (roots2[j] >= 0 && roots2[j] <= 1) {
            rrIPB_rf = roots2[j];
          }
        }

        var prIPB_rf = rrIPB_rf;
        rrGt5 = 0.5 * (rrIPB_rf + rrIPB_r0);

        prGt5 = 0.5 * (prIPB_rf + prIPB_r0);

        gt5.push(rrGt5, prGt5);

        return gt5;
    }
  }

  // Case B (If GT4 lies within the area above the interaction class curves, then GT5 is the midpoint between GT4 and maximum norm PP = < 1, 1 > on the balanced line)
  if (caseB) {
    rrGt5 = 0.5 * (pr + 1);

    prGt5 = 0.5 * (pr + 1);

    gt5.push(rrGt5, prGt5);

    return gt5;
  }

  return gt5;
}



function CalcGT5(rr, pr, ar) {
  let gt5 = [];

  var onCurve = false;
  var caseB = false;

  var r_0 = 0; // the interaction coefficient associated with the initial interaction class surface
  var r_f = 0; // the interaction coefficient associated with the forward interaction class surface.
  let rrGt5 = 0;
  let prGt5 = 0;
  let arGt5 = 0;
  let eqn = 0;

  eqn = parseFloat(
    Math.sqrt(Math.pow(rr, 2) + Math.pow(pr, 2) + Math.pow(ar, 2)).toFixed(3)
  );

  // Checking for the Class Area On, Within, Above
  if (eqn > 1.001) {
    caseB = true;
  } else if (eqn <= 1.001 && eqn > 0.9) {
    onCurve = true;
    r_0 = 0.9;
    r_f = 1.0;
  } else if (eqn == 0.9) {
    onCurve = true;
    r_0 = 0.9;
    r_f = 1.0;
  } else if (eqn < 0.9 && eqn > 0.8) {
    onCurve = true;
    r_0 = 0.8;
    r_f = 0.9;
  } else if (eqn == 0.8) {
    onCurve = true;
    r_0 = 0.8;
    r_f = 0.9;
  } else if (eqn < 0.8 && eqn > 0.7) {
    onCurve = true;
    r_0 = 0.7;
    r_f = 0.8;
  } else if (eqn == 0.7) {
    onCurve = true;
    r_0 = 0.7;
    r_f = 0.8;
  } else if (eqn < 0.7 && eqn > 0.6) {
    onCurve = true;
    r_0 = 0.6;
    r_f = 0.7;
  } else if (eqn == 0.6) {
    onCurve = true;
    r_0 = 0.6;
    r_f = 0.7;
  } else if (eqn < 0.6) {
    onCurve = true;
    r_0 = 0.6;
    r_f = 0.7;
  }

  // Case A (If GT4 lies on any interaction class surface, then GT5 is the midpoint between adjacent interaction class surfaces on the balanced plane)
  if (onCurve) {
    rrGt5 = 0.5 * ((Math.sqrt(2) / 2) * r_f + (Math.sqrt(2) / 2) * r_0);

    prGt5 = 0.5 * ((Math.sqrt(2) / 2) * r_f + (Math.sqrt(2) / 2) * r_0);

    arGt5 = 0.5 * ((Math.sqrt(2) / 2) * r_f + (Math.sqrt(2) / 2) * r_0);

    gt5.push(rrGt5, prGt5, arGt5);

    return gt5;
  }

  // Case B (If GT4 lies within the area above the interaction class surfaces, then GT5 is the midpoint between GT4 and maximum norm PP = < 1, 1, 1 > on the balanced plane)
  if (caseB) {
    rrGt5 = 0.5 * (pr + 1);

    prGt5 = 0.5 * (pr + 1);

    arGt5 = 0.5 * (pr + 1);

    gt5.push(rrGt5, prGt5, arGt5);

    return gt5;
  }

  return gt5;
}

function getGrowthTarget1(rr, pr, ar, unitType, signature) {
  if (unitType === "Third Parameter") {
    // Check for special cases
    const special = CalcGTSpecialCasesTM(rr ?? 0, pr ?? 0, ar ?? 0);
    if (special && special.length > 0) {
      const [rrGt1, prGt1, arGt1] = special.slice(0, 3).map(v => (v == null ? null : +v.toFixed(3)));
      return [rrGt1, prGt1, arGt1];
    }

    // Standard 3D GT1 calculation
    const gt1 = CalcGT1(rr ?? 0, pr ?? 0, ar ?? 0);
    if (!gt1 || gt1.length < 3) return [null, null, null];
    return gt1.map(v => (v == null ? null : +v.toFixed(3)));
  }

  // 2D units fallback
  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    // const signature = null;
    const gt1 = CalcGT1_CIO(rr ?? 0, pr ?? 0, signature);
    if (!gt1 || gt1.length < 2) return [null, null];
    return gt1.map(v => (v == null ? null : +v.toFixed(3)));
  }

  return unitType === "Third Parameter" ? [null, null, null] : [null, null];
}

// Repeat for getGrowthTarget2..5 with special slice indexes
function getGrowthTarget2(rr, pr, ar, unitType, signature) {
  if (unitType === "Third Parameter") {
    const special = CalcGTSpecialCasesTM(rr ?? 0, pr ?? 0, ar ?? 0);
    if (special && special.length > 0) {
      const [rrGt2, prGt2, arGt2] = special.slice(3, 6).map(v => (v == null ? null : +v.toFixed(3)));
      return [rrGt2, prGt2, arGt2];
    }
    const gt2 = CalcGT2(rr ?? 0, pr ?? 0, ar ?? 0);
    if (!gt2 || gt2.length < 3) return [null, null, null];
    return gt2.map(v => (v == null ? null : +v.toFixed(3)));
  }
  // fallback 2D
  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    // const signature = null;
    const gt2 = CalcGT2_CIO(rr ?? 0, pr ?? 0, signature);
    if (!gt2 || gt2.length < 2) return [null, null];
    return gt2.map(v => (v == null ? null : +v.toFixed(3)));
  }
  return unitType === "Third Parameter" ? [null, null, null] : [null, null];
}


function getGrowthTarget3(rr, pr, ar, unitType, signature) {
  if (unitType === "Third Parameter") {
    // Check for special cases
    const special = CalcGTSpecialCasesTM(rr ?? 0, pr ?? 0, ar ?? 0);
    if (special && special.length > 0) {
      const [rrGt3, prGt3, arGt3] = special.slice(6, 9).map(v => (v == null ? null : +v.toFixed(3)));
      return [rrGt3, prGt3, arGt3];
    }

    // Standard 3D GT1 calculation
    const gt3 = CalcGT3(rr ?? 0, pr ?? 0, ar ?? 0);
    if (!gt3 || gt3.length < 3) return [null, null, null];
    return gt3.map(v => (v == null ? null : +v.toFixed(3)));
  }

  // 2D units fallback
  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    // const signature = null;
    const gt3 = CalcGT3_CIO(rr ?? 0, pr ?? 0, signature);
    if (!gt3 || gt3.length < 2) return [null, null];
    return gt3.map(v => (v == null ? null : +v.toFixed(3)));
  }

  return unitType === "Third Parameter" ? [null, null, null] : [null, null];
}


function getGrowthTarget4(rr, pr, ar, unitType, signature) {
  if (unitType === "Third Parameter") {
    // Check for special cases
    const special = CalcGTSpecialCasesTM(rr ?? 0, pr ?? 0, ar ?? 0);
    if (special && special.length > 0) {
      const [rrGt4, prGt4, arGt4] = special.slice(9, 12).map(v => (v == null ? null : +v.toFixed(3)));
      return [rrGt4, prGt4, arGt4];
    }

    // Standard 3D GT1 calculation
    const gt4 = CalcGT4(rr ?? 0, pr ?? 0, ar ?? 0);
    if (!gt4 || gt4.length < 3) return [null, null, null];
    return gt4.map(v => (v == null ? null : +v.toFixed(3)));
  }

  // 2D units fallback
  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    // const signature = null;
    const gt4 = CalcGT4_CIO(rr ?? 0, pr ?? 0, signature);
    if (!gt4 || gt4.length < 2) return [null, null];
    return gt4.map(v => (v == null ? null : +v.toFixed(3)));
  }

  return unitType === "Third Parameter" ? [null, null, null] : [null, null];
}


function getGrowthTarget5(rr, pr, ar, unitType, signature) {
  if (unitType === "Third Parameter") {
    // Check for special cases
    const special = CalcGTSpecialCasesTM(rr ?? 0, pr ?? 0, ar ?? 0);
    if (special && special.length > 0) {
      const [rrGt5, prGt5, arGt5] = special.slice(12, 15).map(v => (v == null ? null : +v.toFixed(3)));
      return [rrGt5, prGt5, arGt5];
    }

    // Standard 3D GT1 calculation
    const gt5 = CalcGT5(rr ?? 0, pr ?? 0, ar ?? 0);
    if (!gt5 || gt5.length < 3) return [null, null, null];
    return gt5.map(v => (v == null ? null : +v.toFixed(3)));
  }

  // 2D units fallback
  if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
    // const signature = null;
    const gt5 = CalcGT5_CIO(rr ?? 0, pr ?? 0, signature);
    if (!gt5 || gt5.length < 2) return [null, null];
    return gt5.map(v => (v == null ? null : +v.toFixed(3)));
  }

  return unitType === "Third Parameter" ? [null, null, null] : [null, null];
}


// ----------------- finding average calculation -----------------

function calculateAverages(results) {
  const numericFields = [
    "Productivity_CSD",
    "Productivity_USD",
    "RRN",
    "PRN",
    "ARN",
    "XLR",
    "XRR",
    "XSR",
    "XWR",
    "XTR",
    "XPR",
    "XRVSR",
    "XPVSR",
    "XAVSR",
    "XEP",
    "XCP",
    "XBP",
    "MSIP",
    "deltaRRN",
    "deltaPRN",
    "deltaARN",
    "GEQ",
  ];

  // Filter only valid rows with positive ppId
  const validRows = results.filter(r => r.ppId > 0);

  if (validRows.length === 0) return null;

  const avgRow = { ppId: "Average" };

  numericFields.forEach(field => {
    const values = validRows.map(r => r[field]).filter(v => typeof v === "number" && !isNaN(v));
    avgRow[field] = values.length
      ? +(values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(3)
      : null;
  });

  return avgRow;
}

// ---------------------------------------------------------------


// ------------------------- Calculate Stanndard Deviation ---------------------------------

function CalculateStandardDevTS(data, usePopulation = false) {
  const mean =
    data.reduce((acc, val) => acc + parseFloat(val), 0) / data.length;

  let result = Math.sqrt(
    data
      .reduce((acc, val) => acc.concat((parseFloat(val) - mean) ** 2), [])
      .reduce((acc, val) => acc + parseFloat(val), 0) /
    (data.length - (usePopulation ? 0 : 1))
  );

  if (!isNaN(result) || !isFinite(result)) {
    return parseFloat(result).toFixed(3);
  } else {
    return null;
  }
}

function calculateStdDevs(results) {
  const numericFields = [
    "Productivity_CSD",
    "Productivity_USD",
    "RRN",
    "PRN",
    "ARN",
    "XLR",
    "XRR",
    "XSR",
    "XWR",
    "XTR",
    "XPR",
    "XRVSR",
    "XPVSR",
    "XAVSR",
    "XEP",
    "XCP",
    "XBP",
    "MSIP",
    "deltaRRN",
    "deltaPRN",
    "deltaARN",
    "GEQ",
  ];

  // Filter only valid rows with positive ppId
  const validRows = results.filter(r => r.ppId > 0);
  if (validRows.length === 0) return null;

  const stdRow = { ppId: "StdDev" };

  numericFields.forEach(field => {
    const values = validRows.map(r => r[field]).filter(v => typeof v === "number" && !isNaN(v));
    stdRow[field] =
      values.length > 1
        ? +CalculateStandardDevTS(values, false)
        : null;
  });

  return stdRow;
}

// ----------------------------------------------------------------------------


// ------------------ calculate standard error -------------------------

function CalculateStandardError(deviation, data) {
  if (data.length > 0) {
    const count = data.filter(r => typeof r.ppId === "number" && r.ppId > 0).length;
    return parseFloat(deviation / Math.sqrt(count)).toFixed(3);
  } else {
    return null;
  }
}


function calculateStdErrors(results, stdDevRow) {
  const numericFields = [
    "Productivity_CSD",
    "Productivity_USD",
    "RRN",
    "PRN",
    "ARN",
    "XLR",
    "XRR",
    "XSR",
    "XWR",
    "XTR",
    "XPR",
    "XRVSR",
    "XPVSR",
    "XAVSR",
    "XEP",
    "XCP",
    "XBP",
    "MSIP",
    "deltaRRN",
    "deltaPRN",
    "deltaARN",
    "GEQ",
  ];

  const validRows = results.filter(r => r.ppId > 0);
  if (validRows.length === 0) return null;

  const stdErrRow = { ppId: "StdErr" };

  numericFields.forEach(field => {
    const stdDev = parseFloat(stdDevRow[field]);
    stdErrRow[field] = !isNaN(stdDev)
      ? CalculateStandardError(stdDev, validRows)
      : null
  });

  return stdErrRow;
}


// ---------------------------------------------------------------------


exports.getPpCompetencyRatios = async (req, res) => {
  try {
    const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;

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

    const signature = signatureProfile
      ?.replace(/^Case\s*\d+[a-zA-Z]?:\s*/, "") // remove "Case 1:", "Case 3b:" etc.
      ?.trim();

    console.log("signature", signature);
    const unitStart = new Date(unitStartDate);
    const candidateStart = new Date(candidate.startDate);

    // 🔹 Build base where clause for filtering
    const whereClause = { unitId, candidate_id };

    // 🔹 Add ppId range filters (if provided)
    if (ppIdFrom && ppIdTo) {
      whereClause.ppId = { [Op.between]: [Number(ppIdFrom), Number(ppIdTo)] };
    } else if (ppIdFrom) {
      whereClause.ppId = { [Op.gte]: Number(ppIdFrom) };
    } else if (ppIdTo) {
      whereClause.ppId = { [Op.lte]: Number(ppIdTo) };
    }

    // 🔹 Add criticalRefDate range filters (if provided)
    if (criticalRefDateFrom && criticalRefDateTo) {
      whereClause.criticalRefDate = { [Op.between]: [new Date(criticalRefDateFrom), new Date(criticalRefDateTo)] };
    } else if (criticalRefDateFrom) {
      whereClause.criticalRefDate = { [Op.gte]: new Date(criticalRefDateFrom) };
    } else if (criticalRefDateTo) {
      whereClause.criticalRefDate = { [Op.lte]: new Date(criticalRefDateTo) };
    }

    const aggregates = await InsertScore.findAll({
      attributes: [
        "ppId",
        [Sequelize.fn("SUM", Sequelize.col("durationHrs")), "totalDuration"],
        [Sequelize.fn("MAX", Sequelize.col("criticalRefDate")), "latestCriticalRefDate"],
      ],
      where: whereClause,
      group: ["ppId"],
      raw: true,
    });

    if (!aggregates.length) return res.status(200).json([]);

    const results = await Promise.all(
      aggregates.map(async (agg) => {
        const ppId = agg.ppId;
        const totalDuration = Number(agg.totalDuration) || 0;
        const criticalRefDate = agg.latestCriticalRefDate ? new Date(agg.latestCriticalRefDate) : null;

        // 🔹 Use same filters per ppId
        const scoreWhere = { ...whereClause, ppId };

        const scores = await InsertScore.findAll({
          where: scoreWhere,
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
          unitType,
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
        // if (criticalRefDate && totalDuration > 0 && ppId > 0) {
        //   const diffUSD = (criticalRefDate - unitStart) / (1000 * 60 * 60 * 24);
        //   const diffCSD = (criticalRefDate - candidateStart) / (1000 * 60 * 60 * 24);
        //   out.Productivity_USD = +((diffUSD / totalDuration).toFixed(3));
        //   out.Productivity_CSD = +((diffCSD / totalDuration).toFixed(3));
        // } else {
        //   out.Productivity_CSD == null;
        //   out.Productivity_USD == null;
        // }

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

        if (ppId > 0 && (unitType === "Communicative I/O" || unitType === "Theory & Practice")) {
          const [rrGt1, prGt1] = getGrowthTarget1(out.RRN, out.PRN, null, unitType, signature);
          const [rrGt2, prGt2] = getGrowthTarget2(out.RRN, out.PRN, null, unitType, signature);
          const [rrGt3, prGt3] = getGrowthTarget3(out.RRN, out.PRN, null, unitType, signature);
          const [rrGt4, prGt4] = getGrowthTarget4(out.RRN, out.PRN, null, unitType, signature);
          const [rrGt5, prGt5] = getGrowthTarget4(out.RRN, out.PRN, null, unitType, signature);
          out.RRGT1 = rrGt1;
          out.PRGT1 = prGt1;
          out.RRGT2 = rrGt2;
          out.PRGT2 = prGt2;
          out.RRGT3 = rrGt3;
          out.PRGT3 = prGt3;
          out.RRGT4 = rrGt4;
          out.PRGT4 = prGt4;
          out.RRGT5 = rrGt5;
          out.PRGT5 = prGt5;
        } else if (ppId > 0 &&unitType === "Third Parameter") {
          const [rrGt1, prGt1, arGt1] = getGrowthTarget1(out.RRN, out.PRN, out.ARN, unitType, signature);
          const [rrGt2, prGt2, arGt2] = getGrowthTarget2(out.RRN, out.PRN, out.ARN, unitType, signature);
          const [rrGt3, prGt3, arGt3] = getGrowthTarget3(out.RRN, out.PRN, out.ARN, unitType, signature);
          const [rrGt4, prGt4, arGt4] = getGrowthTarget4(out.RRN, out.PRN, out.ARN, unitType, signature);
          const [rrGt5, prGt5, arGt5] = getGrowthTarget5(out.RRN, out.PRN, out.ARN, unitType, signature);
          out.RRGT1 = rrGt1;
          out.PRGT1 = prGt1;
          out.ARGT1 = arGt1;
          out.RRGT2 = rrGt2;
          out.PRGT2 = prGt2;
          out.ARGT2 = arGt2;
          out.RRGT3 = rrGt3;
          out.PRGT3 = prGt3;
          out.ARGT3 = arGt3;
          out.RRGT4 = rrGt4;
          out.PRGT4 = prGt4;
          out.ARGT4 = arGt4;
          out.RRGT5 = rrGt5;
          out.PRGT5 = prGt5;
          out.ARGT5 = arGt5;
        } else {
          out.RRGT1 = null;
          out.PRGT1 = null;
          out.ARGT1 = null;
          out.RRGT2 = null;
          out.PRGT2 = null;
          out.ARGT2 = null;
          out.RRGT3 = null;
          out.PRGT3 = null;
          out.ARGT3 = null;
          out.RRGT4 = null;
          out.PRGT4 = null;
          out.ARGT4 = null;
          out.RRGT5 = null;
          out.PRGT5 = null;
          out.ARGT5 = null;
        }
        

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

        // --- Compute STA/P ---
        out.STAP = calculateSTAP(out.RRN, out.PRN, out.ARN, out.MSIP, unitType);

        // --- Compute Interaction Class ---
        out.IC = calculateInteractionClass(out.RRN, out.PRN, out.ARN, unitType, signatureProfile);


      

        return out;
      })
    );

    // Sort results by ppId ascending to maintain order
    results.sort((a, b) => a.ppId - b.ppId);

    // --- Separate and sort ppIds for proper cumulative calculation ---
const positiveResults = results
.filter((r) => r.ppId > 0)
.sort((a, b) => a.ppId - b.ppId); // ascending

const negativeResults = results
.filter((r) => r.ppId < 0)
.sort((a, b) => b.ppId - a.ppId); // descending

// Compute cumulative totalDuration separately
let cumulativePositive = 0;
let cumulativeNegative = 0;

positiveResults.forEach((row) => {
cumulativePositive += row.totalDuration || 0;
row.cumulativeDuration = +cumulativePositive.toFixed(3);
});

negativeResults.forEach((row) => {
cumulativeNegative += row.totalDuration || 0;
row.cumulativeDuration = +cumulativeNegative.toFixed(3);
});


// --- Recalculate Productivity (after cumulativeDuration) ---
[...positiveResults, ...negativeResults].forEach((row) => {
  if (row.criticalRefDate && row.cumulativeDuration > 0 && row.ppId > 0) {
    const diffUSD = (row.criticalRefDate - unitStart) / (1000 * 60 * 60 * 24);
    const diffCSD = (row.criticalRefDate - candidateStart) / (1000 * 60 * 60 * 24);
    row.Productivity_USD = (row.cumulativeDuration / diffUSD).toFixed(3);
    row.Productivity_CSD = (row.cumulativeDuration / diffCSD).toFixed(3);
  } else {
    row.Productivity_USD = null;
    row.Productivity_CSD = null;
  }
});


// Merge them back together and sort again by ppId ascending for final output
const mergedResults = [...negativeResults, ...positiveResults].sort((a, b) => a.ppId - b.ppId);

// Replace original results array
results.length = 0;
results.push(...mergedResults);


    // --- Compute deltaRRN, deltaPRN, deltaARN ---
    let prevRRN = 0;
    let prevPRN = 0;
    let prevARN = 0;

    results.forEach((row, index) => {
      if (row.ppId > 0) {
        const currRRN = row.RRN ?? 0;
        const currPRN = row.PRN ?? 0;
        const currARN = row.ARN ?? 0;

        row.deltaRRN = +(currRRN - (index === 0 ? 0 : prevRRN)).toFixed(3);
        row.deltaPRN = +(currPRN - (index === 0 ? 0 : prevPRN)).toFixed(3);
        row.deltaARN = +(currARN - (index === 0 ? 0 : prevARN)).toFixed(3);

        // --- Calculate STAG ---
        row.STAG = calculateSTAG(row.deltaRRN, row.deltaPRN, row.deltaARN, row.MSIP, unitType);

        if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
          row.GEQ = calculateGEQ_CIO(row.deltaRRN, row.deltaPRN);
        } else if (unitType === "Third Parameter") {
          row.GEQ = calculateGEQ_TP(row.deltaRRN, row.deltaPRN, row.deltaARN);
        }
        // update previous values for next iteration
        prevRRN = currRRN;
        prevPRN = currPRN;
        prevARN = currARN;
      } else {
        row.deltaRRN = null;
        row.deltaPRN = null;
        row.deltaARN = null;
      }
    });


    // --- Calculate summary rows ---
    const average = calculateAverages(results);
    const stdDev = calculateStdDevs(results);
    const stdErr = stdDev ? calculateStdErrors(results, stdDev) : null;

    // --- Final response ---
    res.status(200).json({
      results,    // main data array
      average, // average row
      stdDev,  // std deviation row
      stdErr,  // std error row
    });
  } catch (error) {
    console.error("getPpCompetencyRatios error:", error);
    res.status(500).json({
      message: "Error computing PP competency ratios",
      error: error.message,
    });
  }
};
  

exports.getPpCompetencyRatioMultipleCandidate = async (req, res) => {
  try {
    const { unitId, candidate_id, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;

    // 🔹 Parse candidate_id - supports both single and comma-separated multiple IDs
    const candidateIds = candidate_id 
      ? candidate_id.split(',').map(id => id.trim()).filter(Boolean)
      : [];

    if (!unitId || !candidateIds.length) {
      return res.status(400).json({ message: "unitId and candidate_id are required" });
    }

    // 🔹 Fetch unit once (same for all candidates)
    const unit = await Unit.findByPk(unitId, {
      attributes: ["unitStartDate", "unitType", "signatureProfile"],
      raw: true,
    });

    if (!unit) {
      return res.status(404).json({ message: "Unit not found" });
    }

    const { unitStartDate, unitType, signatureProfile } = unit;
    const unitStart = new Date(unitStartDate);

    // 🔹 Fetch all candidates at once
    const candidates = await Candidate.findAll({
      where: { id: { [Op.in]: candidateIds } },
      attributes: ["id", "startDate"],
      raw: true,
    });

    if (candidates.length !== candidateIds.length) {
      return res.status(404).json({ 
        message: "One or more candidates not found",
        found: candidates.map(c => c.id),
        requested: candidateIds
      });
    }

    // 🔹 Create lookup map for candidate start dates
    const candidateStartDates = candidates.reduce((acc, c) => {
      acc[c.id] = new Date(c.startDate);
      return acc;
    }, {});

    // 🔹 Process each candidate
    const allResults = {};

    for (const candidateId of candidateIds) {
      const candidateStart = candidateStartDates[candidateId];

      // 🔹 Build base where clause for this candidate
      const whereClause = { unitId, candidate_id: candidateId };

      // 🔹 Add ppId range filters (if provided)
      if (ppIdFrom && ppIdTo) {
        whereClause.ppId = { [Op.between]: [Number(ppIdFrom), Number(ppIdTo)] };
      } else if (ppIdFrom) {
        whereClause.ppId = { [Op.gte]: Number(ppIdFrom) };
      } else if (ppIdTo) {
        whereClause.ppId = { [Op.lte]: Number(ppIdTo) };
      }

      // 🔹 Add criticalRefDate range filters (if provided)
      if (criticalRefDateFrom && criticalRefDateTo) {
        whereClause.criticalRefDate = { [Op.between]: [new Date(criticalRefDateFrom), new Date(criticalRefDateTo)] };
      } else if (criticalRefDateFrom) {
        whereClause.criticalRefDate = { [Op.gte]: new Date(criticalRefDateFrom) };
      } else if (criticalRefDateTo) {
        whereClause.criticalRefDate = { [Op.lte]: new Date(criticalRefDateTo) };
      }

      const aggregates = await InsertScore.findAll({
        attributes: [
          "ppId",
          [Sequelize.fn("SUM", Sequelize.col("durationHrs")), "totalDuration"],
          [Sequelize.fn("MAX", Sequelize.col("criticalRefDate")), "latestCriticalRefDate"],
        ],
        where: whereClause,
        group: ["ppId"],
        raw: true,
      });

      if (!aggregates.length) {
        allResults[candidateId] = {
          results: [],
          average: null,
          stdDev: null,
          stdErr: null
        };
        continue;
      }      

      const results = await Promise.all(
        aggregates.map(async (agg) => {
          const ppId = agg.ppId;
          const totalDuration = Number(agg.totalDuration) || 0;
          const criticalRefDate = agg.latestCriticalRefDate ? new Date(agg.latestCriticalRefDate) : null;

          // 🔹 Use same filters per ppId
          const scoreWhere = { ...whereClause, ppId };

          const scores = await InsertScore.findAll({
            where: scoreWhere,
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
          if (criticalRefDate && totalDuration > 0 && ppId > 0) {
            const diffUSD = (criticalRefDate - unitStart) / (1000 * 60 * 60 * 24);
            const diffCSD = (criticalRefDate - candidateStart) / (1000 * 60 * 60 * 24);
            out.Productivity_USD = +(( totalDuration / diffUSD).toFixed(3));
            out.Productivity_CSD = +(( totalDuration / diffCSD).toFixed(3));
          } else {
            out.Productivity_CSD = null;
            out.Productivity_USD = null;
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

          if (ppId > 0) {
            // 🔹 First, check for special case
            const specialGT = CalcGTSpecialCases(out.RRN, out.PRN); // array of [rrGt1, prGt1, rrGt2, prGt2, ...]
          
            if (specialGT && specialGT.length > 0) {
              // --- Apply special case values ---
              if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
                out.RRGT1 = specialGT[0];
                out.PRGT1 = specialGT[1];
                out.RRGT2 = specialGT[2];
                out.PRGT2 = specialGT[3];
                out.RRGT3 = specialGT[4];
                out.PRGT3 = specialGT[5];
                out.RRGT4 = specialGT[6];
                out.PRGT4 = specialGT[7];
                out.RRGT5 = specialGT[8];
                out.PRGT5 = specialGT[9];
              } else if (unitType === "Third Parameter") {
                // For 3D case, add AR as null (or compute if needed)
                out.RRGT1 = specialGT[0];
                out.PRGT1 = specialGT[1];
                out.ARGT1 = null;
          
                out.RRGT2 = specialGT[2];
                out.PRGT2 = specialGT[3];
                out.ARGT2 = null;
          
                out.RRGT3 = specialGT[4];
                out.PRGT3 = specialGT[5];
                out.ARGT3 = null;
          
                out.RRGT4 = specialGT[6];
                out.PRGT4 = specialGT[7];
                out.ARGT4 = null;
          
                out.RRGT5 = specialGT[8];
                out.PRGT5 = specialGT[9];
                out.ARGT5 = null;
              }
            } else {
              // 🔹 Normal calculation if special case not applicable
              if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
                const [rrGt1, prGt1] = getGrowthTarget1(out.RRN, out.PRN, null, unitType);
                const [rrGt2, prGt2] = getGrowthTarget2(out.RRN, out.PRN, null, unitType);
                const [rrGt3, prGt3] = getGrowthTarget3(out.RRN, out.PRN, null, unitType);
                const [rrGt4, prGt4] = getGrowthTarget4(out.RRN, out.PRN, null, unitType);
                const [rrGt5, prGt5] = getGrowthTarget5(out.RRN, out.PRN, null, unitType);
                out.RRGT1 = rrGt1;
                out.PRGT1 = prGt1;
                out.RRGT2 = rrGt2;
                out.PRGT2 = prGt2;
                out.RRGT3 = rrGt3;
                out.PRGT3 = prGt3;
                out.RRGT4 = rrGt4;
                out.PRGT4 = prGt4;
                out.RRGT5 = rrGt5;
                out.PRGT5 = prGt5;
              } else if (unitType === "Third Parameter") {
                const [rrGt1, prGt1, arGt1] = getGrowthTarget1(out.RRN, out.PRN, out.ARN, unitType);
                const [rrGt2, prGt2, arGt2] = getGrowthTarget2(out.RRN, out.PRN, out.ARN, unitType);
                const [rrGt3, prGt3, arGt3] = getGrowthTarget3(out.RRN, out.PRN, out.ARN, unitType);
                const [rrGt4, prGt4, arGt4] = getGrowthTarget4(out.RRN, out.PRN, out.ARN, unitType);
                const [rrGt5, prGt5, arGt5] = getGrowthTarget5(out.RRN, out.PRN, out.ARN, unitType);
                out.RRGT1 = rrGt1;
                out.PRGT1 = prGt1;
                out.ARGT1 = arGt1;
                out.RRGT2 = rrGt2;
                out.PRGT2 = prGt2;
                out.ARGT2 = arGt2;
                out.RRGT3 = rrGt3;
                out.PRGT3 = prGt3;
                out.ARGT3 = arGt3;
                out.RRGT4 = rrGt4;
                out.PRGT4 = prGt4;
                out.ARGT4 = arGt4;
                out.RRGT5 = rrGt5;
                out.PRGT5 = prGt5;
                out.ARGT5 = arGt5;
              }
            }
          }
          

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

          // --- Compute STA/P ---
          out.STAP = calculateSTAP(out.RRN, out.PRN, out.ARN, out.MSIP, unitType);

          // --- Compute Interaction Class ---
          out.IC = calculateInteractionClass(out.RRN, out.PRN, out.ARN, unitType, signatureProfile);

          return out;
        })
      );

      // Sort results by ppId ascending
      results.sort((a, b) => a.ppId - b.ppId);

      // --- Separate and sort ppIds for proper cumulative calculation ---
      const positiveResults = results
        .filter((r) => r.ppId > 0)
        .sort((a, b) => a.ppId - b.ppId);

      const negativeResults = results
        .filter((r) => r.ppId < 0)
        .sort((a, b) => b.ppId - a.ppId);

      // Compute cumulative totalDuration separately
      let cumulativePositive = 0;
      let cumulativeNegative = 0;

      positiveResults.forEach((row) => {
        cumulativePositive += row.totalDuration || 0;
        row.cumulativeDuration = +cumulativePositive.toFixed(3);
      });

      negativeResults.forEach((row) => {
        cumulativeNegative += row.totalDuration || 0;
        row.cumulativeDuration = +cumulativeNegative.toFixed(3);
      });

      // Merge them back together and sort again by ppId ascending for final output
      const mergedResults = [...negativeResults, ...positiveResults].sort((a, b) => a.ppId - b.ppId);
      

      // Replace original results array
      results.length = 0;
      results.push(...mergedResults);

      // --- Compute deltaRRN, deltaPRN, deltaARN ---
      let prevRRN = 0;
      let prevPRN = 0;
      let prevARN = 0;

      results.forEach((row, index) => {
        if (row.ppId > 0) {
          const currRRN = row.RRN ?? 0;
          const currPRN = row.PRN ?? 0;
          const currARN = row.ARN ?? 0;

          row.deltaRRN = +(currRRN - (index === 0 ? 0 : prevRRN)).toFixed(3);
          row.deltaPRN = +(currPRN - (index === 0 ? 0 : prevPRN)).toFixed(3);
          row.deltaARN = +(currARN - (index === 0 ? 0 : prevARN)).toFixed(3);

          // --- Calculate STAG ---
          row.STAG = calculateSTAG(row.deltaRRN, row.deltaPRN, row.deltaARN, row.MSIP, unitType);

          if (unitType === "Communicative I/O" || unitType === "Theory & Practice") {
            row.GEQ = calculateGEQ_CIO(row.deltaRRN, row.deltaPRN);
          } else if (unitType === "Third Parameter") {
            row.GEQ = calculateGEQ_TP(row.deltaRRN, row.deltaPRN, row.deltaARN);
          }
          // update previous values for next iteration
          prevRRN = currRRN;
          prevPRN = currPRN;
          prevARN = currARN;
        } else {
          row.deltaRRN = null;
          row.deltaPRN = null;
          row.deltaARN = null;
          row.STAG = null;
          row.GEQ = null;
        }
      });

      // --- Calculate summary rows ---
      const average = calculateAverages(results);
      const stdDev = calculateStdDevs(results);
      const stdErr = stdDev ? calculateStdErrors(results, stdDev) : null;

      allResults[candidateId] = {
        results,
        average,
        stdDev,
        stdErr
      };
    }

    // 🔹 Return results - combine all candidates into single flat array
    const combinedResults = [];
    const combinedAverages = [];
    const combinedStdDevs = [];
    const combinedStdErrs = [];

    for (const candidateId of candidateIds) {
      const candidateData = allResults[candidateId];
      combinedResults.push(...candidateData.results);
      
      if (candidateData.average) {
        combinedAverages.push({ candidateId, ...candidateData.average });
      }
      if (candidateData.stdDev) {
        combinedStdDevs.push({ candidateId, ...candidateData.stdDev });
      }
      if (candidateData.stdErr) {
        combinedStdErrs.push({ candidateId, ...candidateData.stdErr });
      }
    }

    // Sort combined results by candidate_id first, then ppId
    combinedResults.sort((a, b) => {
      // Note: results don't have candidate_id attached, so they maintain their order
      return 0;
    });

    res.status(200).json({
      results: combinedResults,
      averages: combinedAverages.length > 0 ? combinedAverages : undefined,
      stdDevs: combinedStdDevs.length > 0 ? combinedStdDevs : undefined,
      stdErrs: combinedStdErrs.length > 0 ? combinedStdErrs : undefined
    });

  } catch (error) {
    console.error("getPpCompetencyRatios error:", error);
    res.status(500).json({
      message: "Error computing PP competency ratios",
      error: error.message,
    });
  }
};