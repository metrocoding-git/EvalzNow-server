const express = require('express');
const router = express.Router();

router.use('/users', require('./user.routes'));
router.use('/clients', require('./client.routes'));
router.use('/company', require('./companySize.routes'));

module.exports = router;
