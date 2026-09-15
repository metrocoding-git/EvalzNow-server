const db = require("../models");
const { getPpCompetencyRatioMultipleCandidate } = require('./tabulationTable.controller');
const NeuroScienceSession = db.NeuroScienceSession;
const NeuroScienceResponse = db.NeuroScienceResponse;
const Unit = db.Unit;
const Candidate = db.Candidate;
const AssessmentBlockManager = db.AssessmentBlockManager;


const rows = [
    // --- Frontal Lobe - Left ---
    { lobe: "Frontal Lobe - Left", func: "Ability to control/express language", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Ability to produce/form language", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Left", func: "Ability to pronounce target speech sounds/patterns", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Left", func: "Requires Analytical Thinking/Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Requires Logical Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Reasoning of Concrete/Tangible References", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Requires Pattern Recognition", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Utilizes Kinesthetic Speech", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Exhibits Linear Predictive Speech or Conversational Trajectories", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Requires Critical Thinking", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Requires Symbolic Thinking", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Requires Problem-Solving", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Demonstrates competency through primary motor control", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Left", func: "Discrimination of facial features", rr: "y", pr: "n", ar: "n" },
    { lobe: "Frontal Lobe - Left", func: "Probabilitic Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Deductive Reasoning (content-independent)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Inductive Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Analogical Reasoning (content-independent)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Causal Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Reading fluency & Verbal Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Literacy", rr: "y", pr: "n", ar: "n" },
    { lobe: "Frontal Lobe - Left", func: "Lingual Syntax and Grammatical Construction", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Decision-Making", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Casting/exercising judgment", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Left", func: "Executing sequences in body movement", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Left", func: "Functional Capacity - Frontal Lobe (L)", rr: "y", pr: "y", ar: "y" },
  
    // ================= OCCIPITAL LOBE – LEFT =================
    { lobe: "Occipital Lobe - Left", func: "Right Visual Acuity", rr: "n", pr: "y", ar: "y" },
    { lobe: "Occipital Lobe - Left", func: "Visuospatial Processing + Color (Right-Hand Side)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Occipital Lobe - Left", func: "Visual Recognition (Right-Hand Side)", rr: "y", pr: "n", ar: "n" },
    { lobe: "Occipital Lobe - Left", func: "Visual Attention (Right-Hand Side)", rr: "y", pr: "n", ar: "n" },
    { lobe: "Occipital Lobe - Left", func: "Visual Perception (Right-Hand Side)", rr: "y", pr: "n", ar: "n" },
    { lobe: "Occipital Lobe - Left", func: "Narrow Visual Span from right to left", rr: "n", pr: "y", ar: "n" },
    { lobe: "Occipital Lobe - Left", func: "Functional Capacity - Occipital Lobe (L)", rr: "y", pr: "y", ar: "y" },
  
    // ================= PARIETAL LOBE – LEFT =================
    { lobe: "Parietal Lobe - Left", func: "Long-Term Memory Retrieval", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Left", func: "Sensory/Episodic memory", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Left", func: "Kinesthetic Perception", rr: "y", pr: "n", ar: "n" },
    { lobe: "Parietal Lobe - Left", func: "Mental Self-Perception", rr: "y", pr: "n", ar: "n" },
    { lobe: "Parietal Lobe - Left", func: "Mental Strategies", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Left", func: "Tracking body positioning and movements", rr: "n", pr: "y", ar: "n" },
    { lobe: "Parietal Lobe - Left", func: "Processing 3D Environments", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Left", func: "Sensory Information", rr: "y", pr: "n", ar: "n" },
    { lobe: "Parietal Lobe - Left", func: "Functional Capacity - Parietal Lobe (L)", rr: "y", pr: "y", ar: "y" },
  
    // ================= TEMPORAL LOBE – LEFT =================
    { lobe: "Temporal Lobe - Left", func: "Memory Storage and Knowledge Recall", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Left", func: "Linking meaning to written words", rr: "y", pr: "n", ar: "n" },
    { lobe: "Temporal Lobe - Left", func: "Linking meaning to spoken words", rr: "y", pr: "n", ar: "n" },
    { lobe: "Temporal Lobe - Left", func: "Comprehension/processing of communicative inputs", rr: "y", pr: "n", ar: "n" },
    { lobe: "Temporal Lobe - Left", func: "Recollecting Verbal Details", rr: "n", pr: "y", ar: "y" },
    { lobe: "Temporal Lobe - Left", func: "Learning/internalization", rr: "y", pr: "n", ar: "n" },
    { lobe: "Temporal Lobe - Left", func: "Linking sound frequencies to different action responses", rr: "n", pr: "y", ar: "n" },
    { lobe: "Temporal Lobe - Left", func: "Social Cognition", rr: "y", pr: "n", ar: "n" },
    { lobe: "Temporal Lobe - Left", func: "Short-Term Visual Perception", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Left", func: "Functional Capacity - Temporal Lobe", rr: "y", pr: "y", ar: "y" },
  
    // ================= FRONTAL LOBE - RIGHT =================
    { lobe: "Frontal Lobe - Right", func: "Non-Verbal processing", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Artifactual Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Abstract Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Working Memory (primary)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Face Perception", rr: "y", pr: "n", ar: "n" },
    { lobe: "Frontal Lobe - Right", func: "Planning/organizing events", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Right", func: "Requires attention and concentration", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Connects to emotional control/expression", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Right", func: "Connects to deep mental fitness/IQ", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Assessment of Performance based on creativity", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Assessment of Performance based on imagination", rr: "n", pr: "y", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Assessment of Performance based on music/art", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Right", func: "Mechanical Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Deductive Reasoning (content-dependent)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Analogical Reasoning (content-dependent)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Voluntary Movement of Kinesthetic Learning", rr: "n", pr: "y", ar: "n" },
    { lobe: "Frontal Lobe - Right", func: "Awareness", rr: "y", pr: "n", ar: "y" },
    { lobe: "Frontal Lobe - Right", func: "Functional Capacity - Frontal Lobe (R)", rr: "y", pr: "y", ar: "y" },

    // ================= OCCIPITAL LOBE - RIGHT =================
    { lobe: "Occipital Lobe - Right", func: "Left Visual Acuity", rr: "n", pr: "y", ar: "y" },
    { lobe: "Occipital Lobe - Right", func: "Visuospatial Processing + Color (Left-Hand Side)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Occipital Lobe - Right", func: "Visual Recognition (Left-Hand Side)", rr: "y", pr: "n", ar: "n" },
    { lobe: "Occipital Lobe - Right", func: "Visual Attention (Left-Hand Side)", rr: "y", pr: "n", ar: "n" },
    { lobe: "Occipital Lobe - Right", func: "Visual Perception (Left-Hand Side)", rr: "y", pr: "n", ar: "n" },
    { lobe: "Occipital Lobe - Right", func: "Narrow Visual Span from left to right", rr: "n", pr: "y", ar: "n" },
    { lobe: "Occipital Lobe - Right", func: "Functional Capacity - Occipital Lobe (R)", rr: "y", pr: "y", ar: "y" },

    // ================= PARIETAL LOBE - RIGHT =================
    { lobe: "Parietal Lobe - Right", func: "Working Memory (secondary)", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Right", func: "Numerical Quantification", rr: "n", pr: "y", ar: "n" },
    { lobe: "Parietal Lobe - Right", func: "Numerical Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Right", func: "Spatial Reasoning", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Right", func: "Spatial Acuity", rr: "y", pr: "n", ar: "y" },
    { lobe: "Parietal Lobe - Right", func: "Spatial Orientation", rr: "n", pr: "y", ar: "n" },
    { lobe: "Parietal Lobe - Right", func: "Symbolic Relationships", rr: "n", pr: "y", ar: "n" },
    { lobe: "Parietal Lobe - Right", func: "Functional Capacity - Parietal Lobe (R)", rr: "y", pr: "y", ar: "y" },

    // ================= TEMPORAL LOBE - RIGHT =================
    { lobe: "Temporal Lobe - Right", func: "Auditory Speech Discrimination", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Recollecting Non-Verbal Details", rr: "n", pr: "y", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Object Recognition", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Symbolic Recognition", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Facial Recognition", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Data Recognition in various context", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Auditory Acuity", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Temporal Acuity", rr: "y", pr: "n", ar: "y" },
    { lobe: "Temporal Lobe - Right", func: "Functional Capacity - Temporal Lobe (R)", rr: "y", pr: "y", ar: "y" },
  ];


  const initLobeBucket = () => ({
    sum: 0,
    count: 0,
    deltaSum: 0,
    deltaCount: 0,
    RMS: 0,
    deltaRMS: 0
  });
  
  exports.getNeuroScienceRmsValues = async (req, res) => {
    try {
      const { unitId, candidateId } = req.params;
      const { ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo } = req.query;
  
      if (!unitId || !candidateId) {
        return res.status(400).json({ message: "unitId and candidateId are required" });
      }
  
      // 1️⃣ Fetch RMS values
      const tabulationReq = { query: { unitId, ppIdFrom, ppIdTo, criticalRefDateFrom, criticalRefDateTo, candidate_id: String(candidateId) } };
      let capturedResponse;
      const tabulationRes = { status: () => ({ json: data => (capturedResponse = data) }) };
      await getPpCompetencyRatioMultipleCandidate(tabulationReq, tabulationRes);
  
      if (!capturedResponse?.results) {
        return res.status(404).json({ message: "No RMS data found" });
      }
  
      const rmsByPpId = {};
      capturedResponse.results.forEach(r => {
        if (r.ppId > 0) {
          rmsByPpId[r.ppId] = {
            unitType: r.unitType,
            RRN: r.RRN,
            PRN: r.PRN,
            ARN: r.ARN,
            deltaRRN: r.deltaRRN,
            deltaPRN: r.deltaPRN,
            deltaARN: r.deltaARN
          };
        }
      });
  
      // 2️⃣ Fetch NeuroScience YES responses
      const sessions = await NeuroScienceSession.findAll({
        where: { unitId, candidateId },
        include: [{ model: NeuroScienceResponse, as: "responses", where: { value: "Yes" } }]
      });
  
      // 3️⃣ Calculate per ppId → per lobe with combined sum for RMS
      const finalResult = [];
  
      for (const session of sessions) {
        const rms = rmsByPpId[session.ppId];
        if (!rms) continue;
  
        const lobeStats = {};
        const isThirdParameter = rms.unitType === "Third Parameter";
  
        session.responses.forEach(resp => {
          const rowDef = rows.find(r => r.lobe === resp.lobe && r.func === resp.functionName);
          if (!rowDef) return;
  
          if (!lobeStats[resp.lobe]) {
            lobeStats[resp.lobe] = initLobeBucket();
          }
  
          const bucket = lobeStats[resp.lobe];
  
          // Combined value for non-delta
          // normalize null → 0
          const RRN = rms.RRN ?? 0;
          const PRN = rms.PRN ?? 0;
          const ARN = rms.ARN ?? 0;

          const dRRN = rms.deltaRRN ?? 0;
          const dPRN = rms.deltaPRN ?? 0;
          const dARN = rms.deltaARN ?? 0;

          // ----- NON-DELTA RMS -----
          let added = false;

          if (rowDef.rr === "y") {
            bucket.sum += RRN ** 2;
            bucket.count++;
            added = true;
          }

          if (rowDef.pr === "y") {
            bucket.sum += PRN ** 2;
            bucket.count++;
            added = true;
          }

          if (isThirdParameter && rowDef.ar === "y") {
            bucket.sum += ARN ** 2;
            bucket.count++;
            added = true;
          }

          // ----- DELTA RMS -----
          if (rowDef.rr === "y") {
            bucket.deltaSum += dRRN ** 2;
            bucket.deltaCount++;
          }

          if (rowDef.pr === "y") {
            bucket.deltaSum += dPRN ** 2;
            bucket.deltaCount++;
          }

          if (isThirdParameter && rowDef.ar === "y") {
            bucket.deltaSum += dARN ** 2;
            bucket.deltaCount++;
          }

        });
  
        // Calculate RMS and deltaRMS per lobe
        Object.keys(lobeStats).forEach(lobe => {
          const bucket = lobeStats[lobe];
          bucket.RMS = bucket.count > 0 && Number.isFinite(bucket.sum) && Number.isFinite(bucket.count)
              ? Math.sqrt(bucket.sum / bucket.count) : 0;

          bucket.deltaRMS = bucket.deltaCount > 0 && Number.isFinite(bucket.deltaSum) &&
           Number.isFinite(bucket.deltaCount) ? Math.sqrt(bucket.deltaSum / bucket.deltaCount) : 0;
        });
  
        finalResult.push({
          ppId: session.ppId,
          lobes: lobeStats
        });
      }
  
      finalResult.sort((a, b) => a.ppId - b.ppId);

      return res.status(200).json({
        unitId,
        candidateId,
        count: finalResult.length,
        data: finalResult
      });
  
    } catch (error) {
      console.error("getNeuroScienceRmsValues error:", error);
      return res.status(500).json({
        message: "Error calculating neuroscience RMS values",
        error: error.message
      });
    }
  };
  
  exports.updateNeuroScience = async (req, res) => {
    const transaction = await db.sequelize.transaction();
    
    try {
        const { sessionId } = req.params;
        const { responses } = req.body;

        // 🛑 Validation
        if (!sessionId) {
            await transaction.rollback();
            return res.status(400).json({
                message: "sessionId is required in URL parameters",
            });
        }

        if (!Array.isArray(responses)) {
            await transaction.rollback();
            return res.status(400).json({
                message: "responses must be an array",
            });
        }

        // ✅ Step 1: Find the existing session
        const existingSession = await NeuroScienceSession.findByPk(sessionId, {
            include: [
                {
                    model: NeuroScienceResponse,
                    as: "responses",
                },
            ],
            transaction,
        });

        if (!existingSession) {
            await transaction.rollback();
            return res.status(404).json({
                message: "NeuroScience session not found",
            });
        }

        // ✅ Step 2: Validate that responses belong to this session
        // and prepare for update
        const responseUpdates = [];
        const responseIdsToKeep = [];

        for (const response of responses) {
            // Each response should have id for update, or will be created if not present
            if (response.id) {
                // Check if this response belongs to the session
                const existingResponse = existingSession.responses.find(
                    (r) => r.id === response.id
                );
                
                if (!existingResponse) {
                    await transaction.rollback();
                    return res.status(400).json({
                        message: `Response with id ${response.id} does not belong to session ${sessionId}`,
                    });
                }

                responseUpdates.push({
                    id: response.id,
                    lobe: response.lobe,
                    functionName: response.functionName,
                    value: response.value,
                });
                responseIdsToKeep.push(response.id);
            } else {
                // This is a new response to be created
                responseUpdates.push({
                    sessionId: sessionId,
                    lobe: response.lobe,
                    functionName: response.functionName,
                    value: response.value,
                });
            }
        }

        // ✅ Step 3: Delete responses that are not in the update list
        // (if you want to allow deletion by omission)
        const existingResponseIds = existingSession.responses.map(r => r.id);
        const responseIdsToDelete = existingResponseIds.filter(
            id => !responseIdsToKeep.includes(id)
        );

        if (responseIdsToDelete.length > 0) {
            await NeuroScienceResponse.destroy({
                where: {
                    id: responseIdsToDelete,
                    sessionId: sessionId,
                },
                transaction,
            });
        }

        // ✅ Step 4: Bulk upsert responses
        // Separate updates and creates
        const updates = responseUpdates.filter(r => r.id);
        const creates = responseUpdates.filter(r => !r.id);

        // Update existing responses
        for (const update of updates) {
            await NeuroScienceResponse.update(
                {
                    lobe: update.lobe,
                    functionName: update.functionName,
                    value: update.value,
                },
                {
                    where: {
                        id: update.id,
                        sessionId: sessionId,
                    },
                    transaction,
                }
            );
        }

        // Create new responses
        if (creates.length > 0) {
            await NeuroScienceResponse.bulkCreate(creates, {
                transaction,
            });
        }

        // ✅ Step 5: Commit transaction
        await transaction.commit();

        // ✅ Step 6: Fetch updated session with responses
        const updatedSession = await NeuroScienceSession.findByPk(sessionId, {
            include: [
                {
                    model: NeuroScienceResponse,
                    as: "responses",
                },
                {
                    model: db.Unit,
                    as: "unit",
                },
                {
                    model: db.Candidate,
                    as: "candidate",
                },
                {
                    model: db.AssessmentBlockManager,
                    as: "assessmentBlock",
                },
            ],
        });

        return res.status(200).json({
            message: "NeuroScience session updated successfully",
            session: updatedSession,
        });

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }

        console.error("Error updating NeuroScience session:", error);

        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors.map(err => ({
                    field: err.path,
                    message: err.message,
                })),
            });
        }

        return res.status(500).json({
            message: "Error updating NeuroScience session",
            error: error.message,
        });
    }
};
  
exports.createNeuroScience = async (req, res) => {
    const transaction = await db.sequelize.transaction();
  
    try {
      const {
        unitId,
        candidateId,
        assessmentBlockId,
        ppId,
        responses,
      } = req.body;
  
      // 🛑 Basic validation
      if (
        !unitId ||
        !candidateId ||
        !assessmentBlockId ||
        !ppId ||
        !Array.isArray(responses) ||
        responses.length === 0
      ) {
        await transaction.rollback();
        return res.status(400).json({
          message: "Missing required fields or responses array is empty",
        });
      }
  
      // ✅ Step 1: Create NeuroScience Session (PARENT)
      const session = await NeuroScienceSession.create(
        {
          unitId,
          candidateId,
          assessmentBlockId,
          ppId,
        },
        { transaction }
      );
  
      // ✅ Step 2: Prepare Responses (CHILD)
      const responseRows = responses.map((r) => ({
        sessionId: session.id,
        lobe: r.lobe,
        functionName: r.functionName,
        value: r.value,
      }));
  
      // ✅ Step 3: Bulk insert responses
      await NeuroScienceResponse.bulkCreate(responseRows, {
        transaction,
      });
  
      // ✅ Commit transaction
      await transaction.commit();
  
      // ✅ Step 4: Fetch full session with responses
      const createdSession = await NeuroScienceSession.findByPk(session.id, {
        include: [
          {
            model: NeuroScienceResponse,
            as: "responses",
          },
          {
            model: db.Unit,
            as: "unit",
          },
          {
            model: db.Candidate,
            as: "candidate",
          },
          {
            model: db.AssessmentBlockManager,
            as: "assessmentBlock",
          },
        ],
      });
  
      return res.status(201).json(createdSession);
    } catch (error) {
      if (!transaction.finished) {
        await transaction.rollback();
      }
  
      console.error("Error creating NeuroScience session:", error);
  
      return res.status(500).json({
        message: "Error creating NeuroScience session",
        error: error.message,
      });
    }
  };


  exports.getNeuroScienceSessionsByUnitAndCandidate = async (req, res) => {
    const { unitId, candidateId } = req.params;
  
    if (!unitId || !candidateId) {
      return res.status(400).json({ message: "unitId and candidateId are required" });
    }
  
    try {
      const sessions = await NeuroScienceSession.findAll({
        where: {
          unitId: unitId,
          candidateId: candidateId,
        },
        include: [
          {
            model: NeuroScienceResponse,
            as: "responses",
          },
          {
            model: Unit,
            as: "unit",
          },
          {
            model: Candidate,
            as: "candidate",
          },
          {
            model: AssessmentBlockManager,
            as: "assessmentBlock",
          },
        ],
        order: [["createdAt", "DESC"]], // latest sessions first
      });
  
      if (!sessions || sessions.length === 0) {
        return res.status(200).json([]); // ✅ FIX
      }
      
  
      return res.status(200).json(sessions);
    } catch (error) {
      console.error("Error fetching NeuroScience sessions:", error);
      return res.status(500).json({
        message: "Error fetching NeuroScience sessions",
        error: error.message,
      });
    }
  };
  