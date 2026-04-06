const db = require('../models');
const { Op, Sequelize } = require("sequelize");
const Unit = db.Unit;
const Candidate = db.Candidate;
const ProjectionPoint = db.ProjectionPoint;
const ProjectionSession = db.ProjectionSession;

/**
 * Create a new Projection Session with its Projection Points
 * POST /api/projections
 */
exports.createProjectionSession = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { unitId, candidateId, points } = req.body;

    // ✅ Validate inputs
    if (!unitId || !candidateId) {
      return res.status(400).json({
        message: "unitId and candidateId are required.",
      });
    }

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({
        message: "At least one projection point is required.",
      });
    }

    // ✅ Check if referenced Unit and Candidate exist
    const [unit, candidate] = await Promise.all([
      Unit.findByPk(unitId, { transaction }),
      Candidate.findByPk(candidateId, { transaction }),
    ]);

    if (!unit) {
      await transaction.rollback();
      return res.status(404).json({ message: "Unit not found" });
    }
    if (!candidate) {
      await transaction.rollback();
      return res.status(404).json({ message: "Candidate not found" });
    }

    // ✅ Step 1: Create Projection Session
    const newSession = await ProjectionSession.create(
      {
        unitId,
        candidateId,
      },
      { transaction }
    );

    // ✅ Step 2: Prepare and Create Projection Points
    const formattedPoints = points.map((p) => ({
      ...p,
      sessionId: newSession.id,
    }));

    await ProjectionPoint.bulkCreate(formattedPoints, { transaction });

    // ✅ Commit
    await transaction.commit();

    // ✅ Step 3: Fetch with associations
    const createdSession = await ProjectionSession.findByPk(newSession.id, {
      include: [
        {
          model: ProjectionPoint,
          as: "points",
          order: [["dayCount", "ASC"]],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitName"],
        },
        {
          model: Candidate,
          as: "candidate",
          attributes: ["id", "lastName", "firstName"],
        },
      ],
    });

    res.status(201).json({
      message: "Projection session created successfully.",
      session: createdSession,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error creating projection session:", error);
    res.status(500).json({
      message: "Error creating projection session.",
      error: error.message,
    });
  }
};

/**
 * GET all sessions with points
 * GET /api/projections
 */
exports.getProjectionSessions = async (req, res) => {
  try {

    const { unitId, candidateId } = req.params;

    const sessions = await ProjectionSession.findAll({
        where: { unitId, candidateId },
        include: [
        {
            model: ProjectionPoint,
            as: "points",
            order: [["dayCount", "ASC"]],
        },
        {
            model: Unit,
            as: "unit",
            attributes: ["id", "unitName"],
        },
        {
            model: Candidate,
            as: "candidate",
            attributes: ["id", "lastName", "firstName"],
        },
        ],
        order: [["createdAt", "DESC"]],
    });

    res.status(200).json(sessions);
    } catch (error) {
    console.error("Error fetching projection sessions:", error);
    res.status(500).json({
        message: "Error fetching projection sessions.",
        error: error.message,
    });
    }
};

/**
 * GET a single session with points
 * GET /api/projections/:id
 */
exports.getProjectionSessionById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await ProjectionSession.findByPk(id, {
      include: [
        {
          model: ProjectionPoint,
          as: "points",
          order: [["dayCount", "ASC"]],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitName"],
        },
        {
          model: Candidate,
          as: "candidate",
          attributes: ["id", "lastName", "firstName"],
        },
      ],
    });

    if (!session) {
      return res.status(404).json({ message: "Projection session not found." });
    }

    res.status(200).json(session);
  } catch (error) {
    console.error("Error fetching projection session:", error);
    res.status(500).json({
      message: "Error fetching projection session.",
      error: error.message,
    });
  }
};

/**
 * UPDATE Projection Points for an existing session
 * PUT /api/projections/:sessionId/points
 */
exports.updateProjectionPoints = async (req, res) => {
  const transaction = await db.sequelize.transaction();
  try {
    const { sessionId } = req.params;
    const { points } = req.body;

    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({
        message: "At least one projection point is required to update.",
      });
    }

    // ✅ Verify session exists
    const session = await ProjectionSession.findByPk(sessionId, { transaction });
    if (!session) {
      await transaction.rollback();
      return res.status(404).json({ message: "Projection session not found." });
    }

    // ✅ Delete all existing points for this session
    await ProjectionPoint.destroy({
      where: { sessionId },
      transaction,
    });

    // ✅ Create new points with updated data
    const formattedPoints = points.map((p) => ({
      sessionId,
      ppId: p.ppId,
      callout: p.callout,
      RRN: p.RRN,
      PRN: p.PRN,
      ARN: p.ARN,
      IC: p.IC,
      deltaRRN: p.deltaRRN,
      deltaPRN: p.deltaPRN,
      deltaARN: p.deltaARN,
      dayCount: p.dayCount,
    }));

    await ProjectionPoint.bulkCreate(formattedPoints, { transaction });

    await transaction.commit();

    // ✅ Fetch updated session with all associations
    const updatedSession = await ProjectionSession.findByPk(sessionId, {
      include: [
        {
          model: ProjectionPoint,
          as: "points",
          order: [["dayCount", "ASC"]],
        },
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "unitName"],
        },
        {
          model: Candidate,
          as: "candidate",
          attributes: ["id", "lastName", "firstName"],
        },
      ],
    });

    res.status(200).json({
      message: "Projection points updated successfully.",
      session: updatedSession,
    });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    console.error("Error updating projection points:", error);
    res.status(500).json({
      message: "Error updating projection points.",
      error: error.message,
    });
  }
};