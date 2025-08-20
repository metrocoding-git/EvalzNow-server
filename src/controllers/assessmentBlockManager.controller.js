const db = require('../models');
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;

// GET all Assessment Blocks
exports.getAssessmentBlocks = async (req, res) => {
  try {
    const blocks = await AssessmentBlockManager.findAll({
      include: [{ model: Unit, as: 'unit' }]
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
      include: [{ model: Unit, as: 'unit' }]
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
    const { unitId, manageType, periodType, shortDescription, delivery } = req.body;

    let ppId;

    if (manageType === "Indirect") {
      // Find the smallest (most negative) existing ppId for indirect
      const lastIndirect = await AssessmentBlockManager.findOne({
        where: { manageType: "Indirect" },
        order: [["ppId", "ASC"]] // smallest first (most negative)
      });
      ppId = lastIndirect ? lastIndirect.ppId - 1 : -1; // decrement
    } else if (manageType === "Direct") {
      // Find the largest existing ppId for direct
      const lastDirect = await AssessmentBlockManager.findOne({
        where: { manageType: "Direct" },
        order: [["ppId", "DESC"]] // largest first
      });
      ppId = lastDirect ? lastDirect.ppId + 1 : 1; // increment
    } else {
      return res.status(400).json({ message: "Invalid manageType" });
    }

    const newBlock = await AssessmentBlockManager.create({
      unitId,
      manageType,
      ppId,
      periodType,
      shortDescription,
      delivery
    });

    // Fetch created block with Unit relation
    const blockWithUnit = await AssessmentBlockManager.findOne({
      where: { id: newBlock.id },
      include: [{ model: Unit, as: 'unit' }]
    });

    res.status(201).json(blockWithUnit);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating assessment block', error: error.message });
  }
};


// PUT update an Assessment Block
exports.updateAssessmentBlock = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await AssessmentBlockManager.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Assessment block not found or no changes made' });
    }

    const updatedBlock = await AssessmentBlockManager.findOne({
      where: { id },
      include: [{ model: Unit, as: 'unit' }]
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
