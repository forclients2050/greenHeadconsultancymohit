const express = require('express');

const router = express.Router();

const {createCategory,createSubcategory, upadetCategory, updateSubcategory, deleteCategory,deleteSubcategory, getAll_Category, getSubcategoryApi, getDeleteSubcategoryApi, categoryRestoreApi, subCategoryRestoreApi, deletedCategoriesApi, categoryDeleteCompletelyApi, subcategoryDeleteCompletelyApi, get_all_subcategory} = require('../../admin_controller/categorySubControll/categorySubControll');


router.route('/api/categories').post(createCategory);
router.route('/api/categories/:categoryId/subcategories').post(createSubcategory);

router.route('/api/categories/:categoryId').put(upadetCategory);
router.route('/api/categories/:categoryId/subcategories/:subcategoryId').put(updateSubcategory);

router.route('/api/categories/:categoryId').delete(deleteCategory);
router.route('/api/categories/:categoryId/subcategories/:subcategoryId').delete(deleteSubcategory);


//!Restore the Category 
router.route('/api/categories/:categoryId/restore').put(categoryRestoreApi)
router.route('/api/categories/:categoryId/subcategories/:subcategoryId/restore').put(subCategoryRestoreApi)


//!Completely Delete the Category
router.route('/api/categories/delete/category/:categoryId').delete(categoryDeleteCompletelyApi)
router.route('/api/categories/delete/:categoryId/subcategory/:subcategoryId').delete(subcategoryDeleteCompletelyApi)




////! For Getting the Category & Subcategory

router.route('/api/bilvani/get/category').get(getAll_Category)
router.route('/api/bilvani/get/subcategory').get(get_all_subcategory)

router.route('/api/bilvani/get/:categoryId/subcategories').get(getSubcategoryApi);

//!Fetch the Delete Category from the backend 
router.route('/api/bilvani/get/delete-category').get(deletedCategoriesApi)

router.route('/api/bilvani/get/:categoryId/delete-subcategory').get(getDeleteSubcategoryApi);




module.exports = router ; 