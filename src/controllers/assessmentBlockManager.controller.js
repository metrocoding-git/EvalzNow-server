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

    if (!blocks || blocks.length === 0) {
      return res.status(404).json({ message: `No assessment blocks found for unitId ${unitId}` });
    }

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

    // Determine ppId based on manageType
    let ppId;
    if (manageType === "Indirect") {
      const lastIndirect = await AssessmentBlockManager.findOne({
        where: { manageType: "Indirect", unitId },
        order: [["ppId", "ASC"]]
      });
      ppId = lastIndirect ? lastIndirect.ppId - 1 : -1;
    } else if (manageType === "Direct") {
      const lastDirect = await AssessmentBlockManager.findOne({
        where: { manageType: "Direct", unitId },
        order: [["ppId", "DESC"]]
      });
      ppId = lastDirect ? lastDirect.ppId + 1 : 1;
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
  try {
    const { id } = req.params;
    const deleted = await AssessmentBlockManager.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Assessment block not found' });
    }

    res.status(200).json({ message: 'Assessment block deleted successfully' });
  } catch (error) {
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

    if (!block) {
      return res.status(404).json({ message: `No assessment block found for unitId ${unitId} and candidateId ${candidateId}` });
    }

    res.status(200).json(block);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching assessment block', error: error.message });
  }
};

