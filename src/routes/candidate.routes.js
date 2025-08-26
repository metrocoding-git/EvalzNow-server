const express = require('express');
const router = express.Router();
const CandidateController = require('../controllers/candidate.controller');

router.get('/', CandidateController.getCandidates);
router.post('/', CandidateController.createCandidate);
router.put('/:id', CandidateController.updateCandidate);
router.delete('/:id', CandidateController.deleteCandidate);

module.exports = router;