const express = require('express');
const router = express.Router();
const projectionController = require('../controllers/projectionController.controller');
// const { route } = require('./projection.routes');

router.get('/unit/:unitId/candidate/:candidateId', projectionController.getProjectionSessions);
router.post('/', projectionController.createProjectionSession);
router.put('/:sessionId/points', projectionController.updateProjectionPoints);
// router.delete('/:id', insertScoreController.deleteInsertScore);
router.get('/:id', projectionController.getProjectionSessionById);


module.exports = router;