// routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../../admin_controller/loginControll/loginControll');



router.post('/api/admin/login', authController.login);

module.exports = router;