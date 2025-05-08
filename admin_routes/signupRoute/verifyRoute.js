const express = require('express');

const router = express.Router();

const {adminverifyOTP} = require('../../admin_controller/singupControll/verifySignControll');

router.route('/api/verify/admin/signup').post(adminverifyOTP);


module.exports = router;