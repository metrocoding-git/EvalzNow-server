const db = require("../models");
const UnitRoster = db.UnitRoster;
const Candidate = db.Candidate;
const Unit = db.Unit;

// GET all unit rosters with candidate + unit info
exports.getUnitRosters = async (req, res) => {
  try {
    if (!UnitRoster.associations.candidate || !UnitRoster.associations.unit) {
      throw new Error("UnitRoster associations not found");
    }

    const rosters = await UnitRoster.findAll({
      include: [
        {
          model: Candidate,
          as: "candidate",
          attributes: ["id", "candidateId", "firstName", "lastName"],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitId", "unitName", "unitType", "signatureProfile"],
        },
      ],
      
    });

    res.status(200).json(rosters);
  } catch (error) {
    console.error("Error fetching unit rosters:", error);
    res.status(500).json({
      message: "Error fetching unit rosters",
      error: error.message,
      suggestion: "Please verify UnitRoster associations are properly set up",
    });
  }
};

// GET a specific unit roster by ID
exports.getUnitRosterById = async (req, res) => {
  try {
    const { id } = req.params;
    const roster = await UnitRoster.findByPk(id, {
      include: [
        {
          model: Candidate,
          as: "candidate",
          attributes: ["id", "candidateId", "firstName", "lastName"],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitId", "unitName"],
        },
      ],
    });

    if (!roster) {
      return res.status(404).json({ message: "UnitRoster not found" });
    }

    res.status(200).json(roster);
  } catch (error) {
    console.error("Error fetching unit roster:", error);
    res.status(500).json({ message: "Error fetching unit roster", error: error.message });
  }
};


// GET all units by candidateId
exports.getUnitsByCandidateId = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const rosters = await UnitRoster.findAll({
      where: { candidateId },
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitId", "unitName"], // only these from Unit
        },
      ],
      attributes: ["unitOutcome"], // only keep status from roster
    });

    // Format the response
    const result = rosters.map((r) => ({
      unitId: r.unit?.unitId,
      unitName: r.unit?.unitName,
      status: r.unitOutcome,
    }));

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching units by candidateId:", error);
    res.status(500).json({
      message: "Error fetching units by candidateId",
      error: error.message,
    });
  }
};


// GET all unit rosters by unitId
exports.getUnitRostersByUnitId = async (req, res) => {
  try {
    const { unitId } = req.params;

    const rosters = await UnitRoster.findAll({
      where: { unitId },
      include: [
        {
          model: Candidate,
          as: "candidate", 
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitId", "unitName", "unitType", "signatureProfile", "environment"],
        },
      ],
    });

    

    res.status(200).json(rosters);
  } catch (error) {
    console.error("Error fetching unit rosters by unitId:", error);
    res.status(500).json({
      message: "Error fetching unit rosters by unitId",
      error: error.message,
    });
  }
};


// CREATE a new unit roster entry
exports.createUnitRoster = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const rosterData = req.body;

    const newRoster = await UnitRoster.create(rosterData, { transaction });

    await transaction.commit();

    // Fetch full roster with candidate + unit
    const createdRoster = await UnitRoster.findByPk(newRoster.id, {
      include: [
        { model: Candidate, as: "candidate", attributes: ["id", "candidateId", "firstName", "lastName"] },
        { model: Unit, as: "unit", attributes: ["id", "unitId", "unitName", "unitType", "signatureProfile"] },
      ],
    });

    res.status(201).json(createdRoster);
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error creating unit roster:", error);
    res.status(500).json({ message: "Error creating unit roster", error: error.message });
  }
};

// UPDATE a unit roster
exports.updateUnitRoster = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const rosterData = req.body;

    const roster = await UnitRoster.findByPk(id, { transaction });
    if (!roster) {
      await transaction.rollback();
      return res.status(404).json({ message: "UnitRoster not found" });
    }

    await roster.update(rosterData, { transaction });
    await transaction.commit();

    const updatedRoster = await UnitRoster.findByPk(id, {
      include: [
        { model: Candidate, as: "candidate", attributes: ["id", "candidateId", "firstName", "lastName"] },
        { model: Unit, as: "unit", attributes: ["id", "unitId", "unitName"] },
      ],
    });

    res.status(200).json(updatedRoster);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating unit roster:", error);
    res.status(500).json({ message: "Error updating unit roster", error: error.message });
  }
};

// DELETE a unit roster entry
exports.deleteUnitRoster = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const roster = await UnitRoster.findByPk(id, { transaction });
    if (!roster) {
      await transaction.rollback();
      return res.status(404).json({ message: "UnitRoster not found" });
    }

    await roster.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({ message: "UnitRoster deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting unit roster:", error);
    res.status(500).json({ message: "Error deleting unit roster", error: error.message });
  }
};
