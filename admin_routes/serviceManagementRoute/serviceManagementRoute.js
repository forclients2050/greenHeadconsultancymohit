const express = require('express');
const router = express.Router();
const serviceController = require('../../admin_controller/serviceManagementControll/serviceManagementControll');

// CRUD Operations
router.post('/api/create/service', serviceController.createService);
router.put('/api/create/update/service/:id', serviceController.updateService);
router.delete('/api/mark/delete/:id', serviceController.deleteService); // Soft delete
router.delete('/api/permanent/delete/:id', serviceController.permanentDeleteService); // Permanent delete
router.put('/api/restore/service/:id', serviceController.restoreService);

// Retrieval Operations
router.get('/api/all/service', serviceController.getAllServices);
router.get('/api/mark/delete/service', serviceController.getDeletedServices);
router.get('/api/single/service/:id', serviceController.getServiceById);
router.get('/api/category/:category', serviceController.getServicesByCategory);
router.get('/api/subcategory/:subcategoryId', serviceController.getServicesBySubcategory);
router.get('/api/keyword/search', serviceController.searchServicesByKeywords);

module.exports = router;