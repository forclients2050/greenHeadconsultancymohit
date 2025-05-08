const express = require('express');
const router = express.Router();
const newsController = require('../../admin_controller/blogControll/blogControll');


router.post('/', newsController.createNews);
router.put('/update/:id', newsController.updateNews);

router.get('/get', newsController.getAllNews);
router.get('/single/:id', newsController.getNewsById);
router.delete('/delete/:id', newsController.deleteNews)

module.exports = router;