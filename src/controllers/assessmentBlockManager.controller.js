const db = require('../models');
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;

// GET all Assessment Blocks
exports.getAssessmentBlocks = async (req, res) => {
  try {
    const blocks = await AssessmentBlockManager.findAll({
      include: [
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });
    res.status(200).json(blocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessment blocks', error: error.message });
  }
};

// GET Assessment Blocks by Unit ID
exports.getAssessmentBlocksByUnitId = async (req, res) => {
  try {
    const { unitId } = req.params;

    const blocks = await AssessmentBlockManager.findAll({
      where: { unitId },
      include: [
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });


    res.status(200).json(blocks);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessment blocks by unitId', error: error.message });
  }
};

// POST create a new Assessment Block
exports.createAssessmentBlock = async (req, res) => {
  try {
    const { unitId, candidate_id, manageType, periodType, shortDescription, delivery } = req.body;

    // Validate required fields
    if (!unitId || !candidate_id || !manageType || !periodType || !delivery) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Ensure candidate exists
    const candidateExists = await Candidate.findByPk(candidate_id);
    if (!candidateExists) {
      return res.status(400).json({ message: 'Candidate not found' });
    }

    // Determine ppId based on manageType AND candidate
    let ppId;
    if (manageType === "Indirect") {
      const lastIndirect = await AssessmentBlockManager.findOne({
        where: { manageType: "Indirect", unitId, candidate_id },
        order: [["ppId", "ASC"]] // closest to zero (e.g. -1, -2, -3...)
      });
      ppId = lastIndirect ? lastIndirect.ppId - 1 : -1; // decrement
    } else if (manageType === "Direct") {
      const lastDirect = await AssessmentBlockManager.findOne({
        where: { manageType: "Direct", unitId, candidate_id },
        order: [["ppId", "DESC"]] // largest positive (e.g. 1, 2, 3...)
      });
      ppId = lastDirect ? lastDirect.ppId + 1 : 1; // increment
    } else {
      return res.status(400).json({ message: "Invalid manageType" });
    }

    // Create new block
    const newBlock = await AssessmentBlockManager.create({
      unitId,
      candidate_id,
      manageType,
      ppId,
      periodType,
      shortDescription,
      delivery
    });

    // Fetch created block with associations
    const blockWithRelations = await AssessmentBlockManager.findOne({
      where: { id: newBlock.id },
      include: [
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    res.status(201).json(blockWithRelations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating assessment block', error: error.message });
  }
};


// PUT update an Assessment Block
exports.updateAssessmentBlock = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.candidate_id) {
      const candidateExists = await Candidate.findByPk(req.body.candidate_id);
      if (!candidateExists) {
        return res.status(400).json({ message: 'Candidate not found' });
      }
    }

    const updated = await AssessmentBlockManager.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Assessment block not found or no changes made' });
    }

    const updatedBlock = await AssessmentBlockManager.findOne({
      where: { id },
      include: [
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    res.status(200).json(updatedBlock);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating assessment block', error: error.message });
  }
};

// DELETE an Assessment Block
exports.deleteAssessmentBlock = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { id } = req.params;

    // Find the block to delete first
    const blockToDelete = await AssessmentBlockManager.findByPk(id);

    if (!blockToDelete) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Assessment block not found' });
    }

    const { unitId, manageType, ppId } = blockToDelete;

    // Delete the block
    await AssessmentBlockManager.destroy({ where: { id }, transaction });

    // Adjust ppIds
    if (manageType === "Direct") {
      // Direct: shift ppIds greater than deleted one DOWN by 1
      await AssessmentBlockManager.increment(
        { ppId: -1 },
        {
          where: {
            unitId,
            manageType,
            ppId: { [db.Sequelize.Op.gt]: ppId },
          },
          transaction,
        }
      );
    } else if (manageType === "Indirect") {
      // Indirect: shift ppIds smaller (more negative) UP by 1
      await AssessmentBlockManager.increment(
        { ppId: 1 },
        {
          where: {
            unitId,
            manageType,
            ppId: { [db.Sequelize.Op.lt]: ppId }, // less than deleted one
          },
          transaction,
        }
      );
    }

    await transaction.commit();
    res.status(200).json({ message: 'Assessment block deleted successfully and ppIds adjusted' });

  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error deleting assessment block', error: error.message });
  }
};



// GET Assessment Block by Candidate ID and Unit ID
exports.getAssessmentBlockByCandidateAndUnit = async (req, res) => {
  try {
    const { unitId, candidateId } = req.params;

    if (!unitId || !candidateId) {
      return res.status(400).json({ message: "Missing unitId or candidateId" });
    }

    const block = await AssessmentBlockManager.findAll({
      where: { unitId, candidate_id: candidateId },
      include: [
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    

    res.status(200).json(block);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessment block', error: error.message });
  }
};

