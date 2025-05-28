const express = require('express');
const router = express.Router();
const { consultExpert } = require('../../admin_controller/consultExpert/consultExpert');

// POST route for contact us form submission
router.post('/api/consult/expert', consultExpert);

module.exports = router;
