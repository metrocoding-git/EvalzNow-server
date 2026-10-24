/**
 * Effectivity parameters (New Work Requirements – Effectivity_Part1 / Effectivity_Part2).
 *
 *   Ri = RRN, Rj = PRN, Rk = ARN, a = b = c = 1
 *   For Communicative I/O and Theory & Practice units Rk = 0 always.
 *
 *   P01 = (Ri³ + Rj³ + Rk³)^(-1/3) - 1
 *   P02 = (Ri² + Rj² + Rk²)^(-1/2) - 1
 *   P03 = (-Rk + √(Rk² + 4(Ri² + Rj²))) / (2(Ri² + Rj²)) - 1
 *   P04 = ∛((1 - Ri) / (Rj³ + Rk³)) - 1
 *   P05 = (-(Rj + Rk) + √((Rj + Rk)² + 4Ri²)) / (2Ri²) - 1
 *   P06 = √((1 - Ri) / (Rj² + Rk²)) - 1
 *   P07 = 1 / (Ri + Rj + Rk) - 1
 *   P08 = (-Rk + √(Rk² + 4Rj²(1 - Ri))) / (2Rj²) - 1
 *   P09 = (1 - Ri) / (Rj + Rk) - 1
 *   P10 = (1 - Rj - Rk) / Ri - 1
 *
 * If a parameter is > 5 or +∞ it is set to 5. Results that are not numbers at all
 * (0/0, √ of a negative, -∞) are treated the same way (5 = no effectivity) so they never pass.
 *
 * Pass rule: parameter ≤ threshold. Thresholds are fixed: they are the parameter values at
 * Ri = Rj = Rk = 0.75 (Rk = 0 for CICO / T&P), shown with 3 decimals.
 */

const PARAMETER_COUNT = 10;
const PARAMETER_CAP = 5;
const THRESHOLD_RATIO = 0.75;

const EFFECTIVITY_OPTIONS = {
  effectivityType: ["Holistic", "Mission-Focused", "Not Applicable", "Proactive Dominant", "Reactive Dominant"],
  effectivityGap: ["Capability", "Capacity", "Competency", "Domestic-Driven", "Foreign-Driven", "Not Applicable", "Willingness"],
  effectivitySegment: [
    "Administrative", "Civil Affairs", "Coalition Support", "Combat", "Command & Control", "Counterproliferation",
    "Counterterrorism", "Defense Support", "Direct Action", "Foreign Internal", "Humanitarian", "Intelligence",
    "Maintain Contact", "Movement and Maneuver", "Non-Military", "Not Applicable", "Other", "Peacekeeping",
    "Protection", "Psych Operations", "Reconnaissance", "Rescue & Extraction", "Route Clearance",
    "Search & Destroy", "Search & Rescue", "Security Assistance", "Special Operations", "Strike/Fires/Assault",
    "Sustainment / Logistics", "TDY", "Training", "Unconventional Act", "Will Reduction",
  ],
  effectivityContext: ["Adaptive", "Domestic", "Global", "Not Applicable", "Regional", "Transition"],
  effectivityPurpose: [
    "Area Defense", "Civil - Non Force", "Counterattack Forces", "Decentralized Defense", "Deception Force",
    "Defense to Deny", "Defense to Destroy", "Defense to Preserve", "Disruption Force", "Execution",
    "Integrated Defense", "Main Defense Force", "Maneuver Defense", "Not Applicable", "Offensive Force",
    "Planning/Strategy", "Protected Force", "Psych Evaluation", "Security Force",
  ],
};
const EFFECTIVITY_FIELDS = Object.keys(EFFECTIVITY_OPTIONS);
const EFFECTIVITY_TYPES = EFFECTIVITY_OPTIONS.effectivityType;

const isThirdParameter = (unitType) => unitType === "Third Parameter";

const num = (v) => {
  if (v === null || v === undefined || v === "" || v === "-") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

function cap(value) {
  if (!Number.isFinite(value) || value > PARAMETER_CAP) return PARAMETER_CAP;
  return value;
}

/** Raw (uncapped) parameter values for one set of ratios. */
function rawParameters(Ri, Rj, Rk) {
  const ij2 = Ri ** 2 + Rj ** 2;
  return [
    (Ri ** 3 + Rj ** 3 + Rk ** 3) ** (-1 / 3) - 1,
    (Ri ** 2 + Rj ** 2 + Rk ** 2) ** (-1 / 2) - 1,
    (-Rk + Math.sqrt(Rk ** 2 + 4 * ij2)) / (2 * ij2) - 1,
    Math.cbrt((1 - Ri) / (Rj ** 3 + Rk ** 3)) - 1,
    (-(Rj + Rk) + Math.sqrt((Rj + Rk) ** 2 + 4 * Ri ** 2)) / (2 * Ri ** 2) - 1,
    Math.sqrt((1 - Ri) / (Rj ** 2 + Rk ** 2)) - 1,
    1 / (Ri + Rj + Rk) - 1,
    (-Rk + Math.sqrt(Rk ** 2 + 4 * Rj ** 2 * (1 - Ri))) / (2 * Rj ** 2) - 1,
    (1 - Ri) / (Rj + Rk) - 1,
    (1 - Rj - Rk) / Ri - 1,
  ];
}

/**
 * The 10 effectivity parameters (capped, 3 decimals) for one performance point.
 * Returns null when RRN or PRN is missing (or ARN for Third Parameter units).
 */
function computeParameters(RRN, PRN, ARN, unitType) {
  const Ri = num(RRN);
  const Rj = num(PRN);
  const Rk = isThirdParameter(unitType) ? num(ARN) : 0;
  if (Ri === null || Rj === null || Rk === null) return null;
  return rawParameters(Ri, Rj, Rk).map((v) => Number(cap(v).toFixed(3)));
}

/** Fixed pass thresholds (3 decimals) for the unit type. */
function getThresholds(unitType) {
  const r = THRESHOLD_RATIO;
  return rawParameters(r, r, isThirdParameter(unitType) ? r : 0).map((v) => Number(v.toFixed(3)));
}

/** true / false per parameter (pass when value ≤ threshold); null when value missing. */
function passFlags(params, thresholds) {
  if (!params) return Array(PARAMETER_COUNT).fill(null);
  return params.map((v, i) => (v === null || v === undefined ? null : v <= thresholds[i]));
}

/** Count + fraction (3 decimals) of each Effectivity Type in a list of responses. */
function typeBreakdown(responses = []) {
  const counts = Object.fromEntries(EFFECTIVITY_TYPES.map((t) => [t, 0]));
  let total = 0;
  responses.forEach((r) => {
    const t = r && r.effectivityType;
    if (t && counts[t] !== undefined) {
      counts[t] += 1;
      total += 1;
    }
  });
  const percentages = Object.fromEntries(
    EFFECTIVITY_TYPES.map((t) => [t, total ? Number((counts[t] / total).toFixed(3)) : 0])
  );
  return { counts, percentages, total };
}

/** Keeps only known option values; unknown values become null. */
function sanitizeFields(body = {}) {
  const out = {};
  EFFECTIVITY_FIELDS.forEach((f) => {
    if (body[f] === undefined) return;
    const v = body[f] === null ? null : String(body[f]).trim();
    out[f] = v && EFFECTIVITY_OPTIONS[f].includes(v) ? v : null;
  });
  return out;
}

module.exports = {
  PARAMETER_COUNT,
  PARAMETER_CAP,
  EFFECTIVITY_OPTIONS,
  EFFECTIVITY_FIELDS,
  EFFECTIVITY_TYPES,
  computeParameters,
  getThresholds,
  passFlags,
  typeBreakdown,
  sanitizeFields,
  rawParameters,
};
