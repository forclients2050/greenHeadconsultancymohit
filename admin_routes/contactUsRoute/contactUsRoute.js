const express = require('express');
const router = express.Router();
const { contactUs } = require('../../admin_controller/contactUsControll/contactUsControll');

// POST route for contact us form submission
router.post('/api/contact', contactUs);

module.exports = router;