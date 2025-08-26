const db = require('../models');
const InsertScore = db.InsertScore;
const AssessmentBlockManager = db.AssessmentBlockManager;
const Unit = db.Unit;
const Candidate = db.Candidate;

// GET all Insert Scores
exports.getInsertScores = async (req, res) => {
  try {
    const scores = await InsertScore.findAll({
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }]
    });
    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching insert scores', error: error.message });
  }
};

// GET Insert Scores by Assessment Block ID
exports.getInsertScoresByBlockId = async (req, res) => {
  try {
    const { blockId } = req.params;

    const scores = await InsertScore.findAll({
      where: { assessmentBlockId: blockId },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    if (!scores || scores.length === 0) {
      return res.status(404).json({ message: `No insert scores found for assessmentBlockId ${blockId}` });
    }

    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching insert scores by blockId', error: error.message });
  }
};


// GET Insert Scores by Unit ID
exports.getInsertScoresByUnitId = async (req, res) => {
  try {
    const { unitId } = req.params;

    const scores = await InsertScore.findAll({
      where: { unitId: unitId },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    if (!scores || scores.length === 0) {
      return res.status(404).json({ message: `No insert scores found for unitId ${unitId}` });
    }

    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching insert scores by blockId', error: error.message });
  }
};

// POST create a new Insert Score
exports.createInsertScore = async (req, res) => {
  try {
    const {
      unitId,
      assessmentBlockId,
      candidate_id,
      ppId,
      durationHrs,
      criticalRefDate,
      remarks,
      workflowStage,
      assessmentType,
      scheduleImpact,
      engageLevel,
      competency,
      attainedScore,
      maxScore
    } = req.body;

    if (!assessmentBlockId) {
      return res.status(400).json({ message: 'assessmentBlockId is required' });
    }

    if (!unitId) {
      return res.status(400).json({ message: 'unitId is required' });
    }

    if (!candidate_id) {
      return res.status(400).json({ message: 'candidateId is required' });
    }


    // Ensure related assessment block manager exists
    const blockExists = await AssessmentBlockManager.findByPk(assessmentBlockId);
    if (!blockExists) {
      return res.status(400).json({ message: 'AssessmentBlockManager not found' });
    }

    const newScore = await InsertScore.create({
      unitId,
      assessmentBlockId,
      candidate_id,
      ppId,
      durationHrs,
      criticalRefDate,
      remarks,
      workflowStage,
      assessmentType,
      scheduleImpact,
      engageLevel,
      competency,
      attainedScore,
      maxScore
    });

    const scoreWithRelations = await InsertScore.findOne({
      where: { id: newScore.id },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock' }, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }]
    });

    res.status(201).json(scoreWithRelations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error creating insert score', error: error.message });
  }
};

// PUT update an Insert Score
exports.updateInsertScore = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.body.assessmentBlockId) {
      const blockExists = await AssessmentBlockManager.findByPk(req.body.assessmentBlockId);
      if (!blockExists) {
        return res.status(400).json({ message: 'AssessmentBlockManager not found' });
      }
    }

    const updated = await InsertScore.update(req.body, { where: { id } });

    if (updated[0] === 0) {
      return res.status(404).json({ message: 'Insert score not found or no changes made' });
    }

    const updatedScore = await InsertScore.findOne({
      where: { id },
      include: [{ model: AssessmentBlockManager, as: 'assessmentBlock'}, 
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
       ]
    });

    res.status(200).json(updatedScore);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating insert score', error: error.message });
  }
};

// DELETE an Insert Score
exports.deleteInsertScore = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await InsertScore.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ message: 'Insert score not found' });
    }

    res.status(200).json({ message: 'Insert score deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting insert score', error: error.message });
  }
};


exports.getInsertScoresByUnitAndCandidate = async (req, res) => {
  try {
    const { unitId, candidate_id } = req.params;

    const scores = await InsertScore.findAll({
      where: { unitId, candidate_id },
      include: [
        { model: AssessmentBlockManager, as: 'assessmentBlock' },
        { model: Unit, as: 'unit' },
        { model: Candidate, as: 'candidate' }
      ]
    });

    if (!scores || scores.length === 0) {
      return res.status(404).json({
        message: `No insert scores found for unitId ${unitId} and candidateId ${candidate_id}`
      });
    }

    res.status(200).json(scores);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error fetching insert scores by unitId and candidateId',
      error: error.message
    });
  }
};