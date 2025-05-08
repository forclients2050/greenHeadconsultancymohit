const express = require("express");

const router = express.Router();

const {adminsignup}= require('../../admin_controller/singupControll/singupControll');

router.route('/api/admin/register').post(adminsignup);


module.exports = router;