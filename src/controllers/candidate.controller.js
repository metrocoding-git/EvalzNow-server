const db = require("../models");
const Candidate = db.Candidate;
const Irregularity = db.Irregularity;
const { Sequelize } = db;
const Account = db.Account;

// GET all candidates with their irregularities
exports.getCandidates = async (req, res) => {
  try {
    // Verify association exists
    if (!Candidate.associations.irregularities) {
      throw new Error('Candidate-Irregularity association not found');
    }

    const userAccId = req.user?.acc_id; // get accountId from logged-in user
    if (!userAccId) {
      return res.status(401).json({ message: 'Unauthorized: accountId missing' });
    }

    const candidates = await Candidate.findAll({
      include: [
        {
          model: Account, as: 'account', where: { acc_id: userAccId }, // filter by logged-in user's account
        },
        {
        model: db.Irregularity, // Use db.Irregularity directly
        as: "irregularities",
        attributes: ['id', 'type', 'sequenceNumber', 'comments'],
        required: false // Use left join instead of inner join
      }],
      order: [
        ['lastName', 'ASC'],
        ['firstName', 'ASC'],
        [{ model: db.Irregularity, as: 'irregularities' }, 'sequenceNumber', 'ASC']
      ]
    });
    
    res.status(200).json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ 
      message: "Error fetching candidates", 
      error: error.message,
      suggestion: "Please verify model associations are properly set up"
    });
  }
};

// GET candidate by ID with irregularities
exports.getCandidateById = async (req, res) => {
  try {
    const { id } = req.params;
    const candidate = await Candidate.findByPk(id, {
      include: [{
        model: Irregularity,
        as: "irregularities",
        attributes: ['id', 'type', 'sequenceNumber', 'comments']
      }]
    });

    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Error fetching candidate:", error);
    res.status(500).json({ message: "Error fetching candidate", error: error.message });
  }
};

// CREATE a new candidate with optional irregularities
exports.createCandidate = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { irregularities, ...candidateData } = req.body;

    const newCandidate = await Candidate.create(candidateData, { transaction });

    if (irregularities && irregularities.length > 0) {
      const irregularitiesWithCandidateId = irregularities.map(irregularity => ({
        ...irregularity,
        candidateId: newCandidate.id
      }));
      
      await Irregularity.bulkCreate(irregularitiesWithCandidateId, { transaction });
    }

    await transaction.commit();
    
    try {
      // Fetch the newly created candidate with irregularities in a separate try-catch
      const createdCandidate = await Candidate.findByPk(newCandidate.id, {
        include: [{
          model: Irregularity,
          as: "irregularities",
          attributes: ['id', 'type', 'sequenceNumber', 'comments']
        }]
      });

      return res.status(201).json(createdCandidate);
    } catch (fetchError) {
      console.error("Error fetching created candidate:", fetchError);
      // Don't try to rollback here - just return the success with basic info
      return res.status(201).json({
        ...newCandidate.toJSON(),
        message: "Candidate created but could not fetch full details"
      });
    }
    
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error("Error creating candidate:", error);
    res.status(500).json({ 
      message: "Error creating candidate", 
      error: error.message 
    });
  }
};

// UPDATE a candidate and their irregularities
exports.updateCandidate = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;
    const { irregularities, ...candidateData } = req.body;

    const candidate = await Candidate.findByPk(id, { transaction });
    if (!candidate) {
      await transaction.rollback();
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Update candidate
    await candidate.update(candidateData, { transaction });

    // Handle irregularities updates
    if (irregularities) {
      // First delete existing irregularities
      await Irregularity.destroy({ 
        where: { candidateId: candidate.id },
        transaction
      });

      // Then create new ones if provided
      if (irregularities.length > 0) {
        const irregularitiesWithCandidateId = irregularities.map(irregularity => ({
          ...irregularity,
          candidateId: candidate.id
        }));
        
        await Irregularity.bulkCreate(irregularitiesWithCandidateId, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated candidate with irregularities
    const updatedCandidate = await Candidate.findByPk(id, {
      include: [{
        model: Irregularity,
        as: "irregularities",
        attributes: ['id', 'type', 'sequenceNumber', 'comments']
      }]
    });

    res.status(200).json(updatedCandidate);
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating candidate:", error);
    res.status(500).json({ message: "Error updating candidate", error: error.message });
  }
};

// DELETE a candidate (irregularities will be deleted automatically due to CASCADE)
exports.deleteCandidate = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    const candidate = await Candidate.findByPk(id, { transaction });
    if (!candidate) {
      await transaction.rollback();
      return res.status(404).json({ message: "Candidate not found" });
    }

    await candidate.destroy({ transaction });
    await transaction.commit();

    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error deleting candidate:", error);
    res.status(500).json({ message: "Error deleting candidate", error: error.message });
  }
};


// ✅ Get distinct ethnicities
exports.getEthnicities = async (req, res) => {
  try {
    const ethnicities = await Candidate.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("ethnicity")), "name"]
      ],
      where: {
        ethnicity: { [Sequelize.Op.ne]: null } // skip null values
      },
      order: [[Sequelize.col("ethnicity"), "ASC"]],
      raw: true
    });

    // filter out empty strings just in case
    const filtered = ethnicities
      .map(e => e.name)
      .filter(e => e && e.trim() !== "");

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Error fetching ethnicities:", error);
    res.status(500).json({ message: "Error fetching ethnicities", error: error.message });
  }
};

// ✅ Get distinct incomes
exports.getIncomes = async (req, res) => {
  try {
    const incomes = await Candidate.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("income")), "name"]
      ],
      where: {
        income: { [Sequelize.Op.ne]: null }
      },
      order: [[Sequelize.col("income"), "ASC"]],
      raw: true
    });

    const filtered = incomes
      .map(i => i.name)
      .filter(i => i && i.trim() !== "");

    res.status(200).json(filtered);
  } catch (error) {
    console.error("Error fetching incomes:", error);
    res.status(500).json({ message: "Error fetching incomes", error: error.message });
  }
};