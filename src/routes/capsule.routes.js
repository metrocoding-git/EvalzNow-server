const express = require('express');
const router = express.Router();
const c = require('../controllers/capsule.controller');

// Capsule ownership is checked in the controller (capsule → clientId) for every route;
// ":clientId" and ":candidateId" are also checked by the tenant param guards (routes/index.js).

// Capsules
router.get('/client/:clientId', c.getCapsulesByClient);
router.get('/store/:clientId', c.getStore);
router.get('/id/:id', c.getCapsuleById);
router.post('/', c.createCapsule);
router.put('/:id', c.updateCapsule);
router.delete('/:id', c.deleteCapsule);

// Roster
router.get('/roster/client/:clientId', c.getRosterByClient);
router.get('/roster/capsule/:id', c.getRosterByCapsule);
router.get('/roster/candidate/:candidateId', c.getCapsulesByCandidate);
router.post('/roster', c.createRoster);
router.put('/roster/:rowId', c.updateRoster);
router.delete('/roster/:rowId', c.deleteRoster);

// Assessment blocks
router.get('/blocks/:id/:candidateId', c.getBlocks);
router.post('/blocks', c.createBlock);
router.put('/blocks/:rowId', c.updateBlock);
router.delete('/blocks/:rowId', c.deleteBlock);

// Insert Scores for Capacity Accounting
router.get('/scores/:id', c.getScoresByCapsule);
router.get('/scores/:id/:candidateId', c.getScoresByCandidate);
router.get('/scores/:id/:candidateId/critical-range', c.getCriticalRange);
router.post('/scores', c.createScore);
router.put('/scores/:rowId', c.updateScore);
router.delete('/scores/:rowId', c.deleteScore);

// Clinical marker names
router.get('/markers/:id', c.getMarkerNames);
router.put('/markers/:id/:index', c.updateMarkerName);

// Growth projections
router.get('/projection/:id/:candidateId', c.getProjections);
router.post('/projection', c.createProjection);
router.put('/projection/:rowId', c.updateProjection);

// Effectivity
router.get('/effectivity/:id', c.getEffectivity);
router.post('/effectivity', c.saveEffectivity);
router.delete('/effectivity/:rowId', c.deleteEffectivity);

// Auxiliary Resultants records (kind = candidateMarks | needAssessments | improvements | chains | leaderMarks)
router.get('/aux/:kind/:id', c.getAuxRecords);
router.post('/aux/:kind', c.createAuxRecord);
router.put('/aux/:kind/:rowId', c.updateAuxRecord);
router.delete('/aux/:kind/:rowId', c.deleteAuxRecord);

module.exports = router;
