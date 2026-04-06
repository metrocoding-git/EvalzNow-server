const db = require('../models');
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;
const InsertScore = db.InsertScore;
const { Op } = require('sequelize');

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

    const existingBlock = await AssessmentBlockManager.findByPk(id);

    const [updatedCount] = await AssessmentBlockManager.update(req.body, { where: { id } });
    if (updatedCount === 0) {
      return res.status(404).json({ message: 'No changes made' });
    }


    const updatedBlock = await AssessmentBlockManager.findOne({
      where: { id },
      include: [
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });


     // ===== STEP 1: If ppId changed =====
    if (req.body.ppId && req.body.ppId !== existingBlock.ppId) {
      const { unitId } = updatedBlock;
      const newPpId = req.body.ppId;

      // Update InsertScore.ppId for this block
      await InsertScore.update({ ppId: newPpId }, { where: { assessmentBlockId: id } });

      // Get the updated InsertScore record
      const currentScore = await InsertScore.findOne({
        where: { assessmentBlockId: id }
      });

      if (currentScore) {
        const { criticalRefDate } = currentScore;

        // ===== STEP 2: Set all InsertScores with same ppId to same criticalRefDate =====
        const sameGroupScores = await InsertScore.findAll({
          where: { unitId, ppId: newPpId }
        });

        if (sameGroupScores.length > 0) {
          const sameDate = criticalRefDate;
          for (const s of sameGroupScores) {
            await s.update({ criticalRefDate: sameDate });
          }
          console.log(
            `🟢 Updated ${sameGroupScores.length} InsertScores in ppId=${newPpId} to same criticalRefDate`
          );
        }

        // ===== STEP 3: Find top and bottom distinct ppIds =====
        const previousScore = await InsertScore.findOne({
          where: { unitId, ppId: { [Op.lt]: newPpId } },
          order: [['ppId', 'DESC']]
        });

        const nextScore = await InsertScore.findOne({
          where: { unitId, ppId: { [Op.gt]: newPpId } },
          order: [['ppId', 'ASC']]
        });

        // ===== STEP 4: Fix order if broken =====
        if (previousScore) {
          const prevDate = new Date(previousScore.criticalRefDate);
          const currDate = new Date(criticalRefDate);
          if (currDate < prevDate) {
            // Set all same group to prevDate
            await InsertScore.update(
              { criticalRefDate: previousScore.criticalRefDate },
              { where: { unitId, ppId: newPpId } }
            );
            console.log(
              `🟡 Adjusted group ppId=${newPpId} to match prev ppId=${previousScore.ppId}`
            );
          }
        }

        if (nextScore) {
          const nextDate = new Date(nextScore.criticalRefDate);
          const currDate = new Date(criticalRefDate);
          if (currDate > nextDate) {
            // Set next group to current date
            await InsertScore.update(
              { criticalRefDate },
              { where: { unitId, ppId: nextScore.ppId } }
            );
            console.log(
              `🟢 Adjusted next group ppId=${nextScore.ppId} to match current ppId=${newPpId}`
            );
          }
        }
      }
    }



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

    const { unitId, candidate_id, manageType, ppId } = blockToDelete;

    // Delete insert scores for this exact candidate + ppId
    await InsertScore.destroy({
      where: {
        unitId,
        candidate_id,
        ppId
      },
      transaction
    });

    // Delete the block
    await AssessmentBlockManager.destroy({ where: { id }, transaction });

    // Adjust ppIds (ONLY for this candidate)
    if (manageType === "Direct") {
      // Direct: shift ppIds greater than deleted one DOWN by 1
      await AssessmentBlockManager.increment(
        { ppId: -1 },
        {
          where: {
            unitId,
            candidate_id,  // ✅ scope by candidate
            manageType,
            ppId: { [db.Sequelize.Op.gt]: ppId },
          },
          transaction,
        }
      );

      await InsertScore.increment(
        { ppId: -1 },
        {
          where: {
            unitId,
            candidate_id,  // ✅ scope by candidate
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
            candidate_id,  // ✅ scope by candidate
            manageType,
            ppId: { [db.Sequelize.Op.lt]: ppId },
          },
          transaction,
        }
      );

      await InsertScore.increment(
        { ppId: 1 },
        {
          where: {
            unitId,
            candidate_id,  // ✅ scope by candidate
            ppId: { [db.Sequelize.Op.lt]: ppId },
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
    const { unitId, candidateId, ppId } = req.params;

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


// POST duplicate assessment blocks for a unit
exports.duplicateAssessmentBlocks = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { originalUnitId, newUnitId } = req.body;

    // Get all blocks from original unit
    const originalBlocks = await AssessmentBlockManager.findAll({
      where: { unitId: originalUnitId },
      order: [
        ['candidate_id', 'ASC'],
        ['manageType', 'ASC'],
        ['ppId', 'ASC']
      ]
    });

    // Group by candidate and type
    const blocksByCandidateAndType = {};
    originalBlocks.forEach(block => {
      const key = `${block.candidate_id}-${block.manageType}`;
      if (!blocksByCandidateAndType[key]) {
        blocksByCandidateAndType[key] = [];
      }
      blocksByCandidateAndType[key].push(block);
    });

    // Create new blocks with proper ppId sequencing
    const newBlocks = [];

    for (const [key, blocks] of Object.entries(blocksByCandidateAndType)) {
      const [candidate_id, manageType] = key.split('-');

      // Get the next available ppId for this candidate and type in the new unit
      let nextPpId;
      if (manageType === "Indirect") {
        const lastIndirect = await AssessmentBlockManager.findOne({
          where: { manageType: "Indirect", unitId: newUnitId, candidate_id },
          order: [["ppId", "ASC"]],
          transaction
        });
        nextPpId = lastIndirect ? lastIndirect.ppId - 1 : -1;
      } else {
        const lastDirect = await AssessmentBlockManager.findOne({
          where: { manageType: "Direct", unitId: newUnitId, candidate_id },
          order: [["ppId", "DESC"]],
          transaction
        });
        nextPpId = lastDirect ? lastDirect.ppId + 1 : 1;
      }

      // Create blocks in order
      for (const block of blocks) {
        const newBlock = await AssessmentBlockManager.create({
          unitId: newUnitId,
          candidate_id: block.candidate_id,
          manageType: block.manageType,
          ppId: nextPpId,
          periodType: block.periodType,
          shortDescription: block.shortDescription,
          delivery: block.delivery
        }, { transaction });

        newBlocks.push(newBlock);

        // Update nextPpId
        if (manageType === "Indirect") {
          nextPpId--;
        } else {
          nextPpId++;
        }
      }
    }

    await transaction.commit();
    res.status(201).json(newBlocks);
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error duplicating assessment blocks', error: error.message });
  }
};