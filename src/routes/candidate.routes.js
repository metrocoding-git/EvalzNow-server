const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidate.controller');
const auth = require('../middlewares/authentication.middleware');

router.get('/:clientId', auth.authenticateToken,  CandidateController.getCandidates);
router.get('/ethnicities', CandidateController.getEthnicities);
router.get('/incomes', CandidateController.getIncomes);
router.post('/', CandidateController.createCandidate);
router.put('/:id', CandidateController.updateCandidate);
router.delete('/:id', CandidateController.deleteCandidate);

module.exports = router;