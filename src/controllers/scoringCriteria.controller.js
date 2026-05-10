const db = require("../models");
const sequelize = db.sequelize;
const ScoringCriteria = db.ScoringCriteria;
const InsertScoreCriteria = db.InsertScoreCriteria;
const Unit = db.Unit;


//  Get all scoring criteria
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

//  Get criteria by Unit ID
exports.getScoringCriteriaByUnit = async (req, res) => {
  try {
    const { unitId } = req.params;

    const criteria = await ScoringCriteria.findAll({
      where: { unitId },
      include: [{ model: Unit, as: "unit" }],
    });

    

    res.status(200).json(criteria);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching scoring criteria by unitId",
      error: error.message,
    });
  }
};


//  Create new scoring criteria with per-unit auto-increment and filling gaps
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

    // Get all existing criteriaIds for this unit
    const existingCriteria = await ScoringCriteria.findAll({
      where: { unitId },
      attributes: ['criteriaId'],
      order: [['criteriaId', 'ASC']]
    });

    const existingIds = existingCriteria.map(c => c.criteriaId);

    // Find the first missing criteriaId starting from 1
    let nextCriteriaId = 1;
    for (let i = 1; i <= (existingIds.length + 1); i++) {
      if (!existingIds.includes(i)) {
        nextCriteriaId = i;
        break;
      }
    }

    // Create the new criteria
    const newCriteria = await ScoringCriteria.create({
      unitId,
      criteria,
      criteriaId: nextCriteriaId,
    });

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



//  Update scoring criteria
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

//  Delete scoring criteria
exports.deleteScoringCriteria = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;

    // 1. delete related insert score criteria first
    await InsertScoreCriteria.destroy({
      where: { scoringCriteriaId: id },
      transaction,
    });

    // 2. delete scoring criteria
    const deleted = await ScoringCriteria.destroy({
      where: { id },
      transaction,
    });

    if (deleted === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Scoring criteria not found" });
    }

    await transaction.commit();

    return res.status(200).json({
      message: "Scoring criteria and related insert score data deleted successfully",
    });

  } catch (error) {
    await transaction.rollback();

    console.error(error);
    return res.status(500).json({
      message: "Error deleting scoring criteria",
      error: error.message,
    });
  }
};