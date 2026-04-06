const db = require("../models");
const Irregularity = db.Irregularity;
const Candidate = db.Candidate;

// GET all irregularities with candidate info
exports.getIrregularities = async (req, res) => {
  try {
    const irregularities = await Irregularity.findAll({
      include: [{
        model: Candidate,
        as: "candidate",
        attributes: ['id', 'candidateId', 'lastName', 'firstName']
      }],
      order: [
        ['candidateId', 'ASC'],
        ['sequenceNumber', 'ASC']
      ]
    });
    res.status(200).json(irregularities);
  } catch (error) {
    console.error("Error fetching irregularities:", error);
    res.status(500).json({ message: "Error fetching irregularities", error: error.message });
  }
};

// GET irregularity by ID with candidate info
exports.getIrregularityById = async (req, res) => {
  try {
    const { id } = req.params;
    const irregularity = await Irregularity.findByPk(id, {
      include: [{
        model: Candidate,
        as: "candidate",
        attributes: ['id', 'candidateId', 'lastName', 'firstName']
      }]
    });

    if (!irregularity) {
      return res.status(404).json({ message: "Irregularity not found" });
    }

    res.status(200).json(irregularity);
  } catch (error) {
    console.error("Error fetching irregularity:", error);
    res.status(500).json({ message: "Error fetching irregularity", error: error.message });
  }
};

// CREATE a new irregularity for a candidate
exports.createIrregularity = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { candidateId, ...irregularityData } = req.body;

    // Validate candidate exists
    const candidate = await Candidate.findByPk(candidateId, { transaction });
    if (!candidate) {
      await transaction.rollback();
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Validate sequence number is unique for this candidate
    const existingWithSameSequence = await Irregularity.findOne({
      where: {
        candidateId,
        sequenceNumber: irregularityData.sequenceNumber
      },
      transaction
    });

    if (existingWithSameSequence) {
      await transaction.rollback();
      return res.status(400).json({ 
        message: "Sequence number already exists for this candidate" 
      });
    }

    const newIrregularity = await Irregularity.create({
      candidateId,
      ...irregularityData
    }, { transaction });

    await transaction.commit();
    res.status(201).json(newIrregularity);
  } catch (error) {
    await transaction.rollback();
    console.error("Error creating irregularity:", error);
    res.status(500).json({ message: "Error creating irregularity", error: error.message });
  }
};

// UPDATE an irregularity
exports.updateIrregularity = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { candidateId, sequenceNumber, ...updateData } = req.body;

    const irregularity = await Irregularity.findByPk(id, { transaction });
    if (!irregularity) {
      await transaction.rollback();
      return res.status(404).json({ message: "Irregularity not found" });
    }

    // If changing sequence number, validate it's unique for the candidate
    if (sequenceNumber && sequenceNumber !== irregularity.sequenceNumber) {
      const existingWithSameSequence = await Irregularity.findOne({
        where: {
          candidateId: irregularity.candidateId,
          sequenceNumber
        },
        transaction
      });

      if (existingWithSameSequence) {
        await transaction.rollback();
        return res.status(400).json({ 
          message: "Sequence number already exists for this candidate" 
        });
      }
    }

    await irregularity.update({
      sequenceNumber: sequenceNumber || irregularity.sequenceNumber,
      ...updateData
    }, { transaction });

    await transaction.commit();
    res.status(200).json(irregularity);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating irregularity:", error);
    res.status(500).json({ message: "Error updating irregularity", error: error.message });
  }
};

// DELETE an irregularity
exports.deleteIrregularity = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const irregularity = await Irregularity.findByPk(id, { transaction });
    if (!irregularity) {
      await transaction.rollback();
      return res.status(404).json({ message: "Irregularity not found" });
    }

    await irregularity.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({ message: "Irregularity deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting irregularity:", error);
    res.status(500).json({ message: "Error deleting irregularity", error: error.message });
  }
};