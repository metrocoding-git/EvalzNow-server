const db = require("../models");
const ScoringCriteria = db.ScoringCriteria;
const Unit = db.Unit;

// ✅ Get all scoring criteria
exports.getAllScoringCriteria = async (req, res) => {
  try {
    const criteria = await ScoringCriteria.findAll({
      include: [{ model: Unit, as: "unit" }],
    });
    res.status(200).json(criteria);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching scoring criteria",
      error: error.message,
    });
  }
};

// ✅ Get criteria by Unit ID
exports.getScoringCriteriaByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;

    const criteria = await ScoringCriteria.findAll({
      where: { unitId },
      include: [{ model: Unit, as: "unit" }],
    });

    if (!criteria || criteria.length === 0) {
      return res
        .status(404)
        .json({ message: `No scoring criteria found for unitId ${unitId}` });
    }

    res.status(200).json(criteria);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching scoring criteria by unitId",
      error: error.message,
    });
  }
};

// ✅ Create new scoring criteria
exports.createScoringCriteria = async (req, res) => {
  try {
    const { unitId, criteria } = req.body;

    if (!unitId || !criteria) {
      return res.status(400).json({ message: "unitId and criteria are required" });
    }

    // ensure unit exists
    const unitExists = await Unit.findByPk(unitId);
    if (!unitExists) {
      return res.status(400).json({ message: "Unit not found" });
    }

    const newCriteria = await ScoringCriteria.create({ unitId, criteria });

    const withUnit = await ScoringCriteria.findOne({
      where: { id: newCriteria.id },
      include: [{ model: Unit, as: "unit" }],
    });

    res.status(201).json(withUnit);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error creating scoring criteria",
      error: error.message,
    });
  }
};

// ✅ Update scoring criteria
exports.updateScoringCriteria = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.unitId) {
      const unitExists = await Unit.findByPk(req.body.unitId);
      if (!unitExists) {
        return res.status(400).json({ message: "Unit not found" });
      }
    }

    const updated = await ScoringCriteria.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res
        .status(404)
        .json({ message: "Scoring criteria not found or no changes made" });
    }

    const updatedCriteria = await ScoringCriteria.findOne({
      where: { id },
      include: [{ model: Unit, as: "unit" }],
    });

    res.status(200).json(updatedCriteria);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error updating scoring criteria",
      error: error.message,
    });
  }
};

// ✅ Delete scoring criteria
exports.deleteScoringCriteria = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ScoringCriteria.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: "Scoring criteria not found" });
    }

    res.status(200).json({ message: "Scoring criteria deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error deleting scoring criteria",
      error: error.message,
    });
  }
};
