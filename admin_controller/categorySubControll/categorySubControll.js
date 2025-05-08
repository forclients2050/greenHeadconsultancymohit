const Category = require("../../admin_mongodb/categorySubcatMongo/categorySubcatMongo");



////Category Add
module.exports.createCategory = async (req, res) => {
  try {
    const { name, subcategories } = req.body;
    const token = req.cookies.token;  // Get the token from the cookies

    // Ensure token exists in the cookies
    if (!token) {
      return res.status(400).send('Token not found in cookies');
    }

    // Create a new category with the token included
    const category = new Category({ 
      name, 
      subcategories, 
      token 
    });

    // Save the category to the database
    await category.save();

    // Send response with the saved category
    res.status(201).send(category);
  } catch (err) {
    console.error(err);
    res.status(400).send(err.message);
  }
};


//// Add subcategor to the exist category
module.exports.createSubcategory = async (req, res) => {
  try {
    const { subcategory } = req.body;

    // Check if any category contains the subcategory with the same name (case-insensitive check)
    const categoryWithSameSubcategory = await Category.findOne({
      "subcategories.name": { $regex: new RegExp(`^${subcategory}$`, "i") },
    });

    if (categoryWithSameSubcategory) {
      return res
        .status(400)
        .send("Subcategory with this name already exists globally");
    }

    // Find the category by its ID
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    // Add the new subcategory
    category.subcategories.push({ name: subcategory });
    await category.save();

    res.send(category);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

////Update the Category

module.exports.upadetCategory = async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.categoryId,
      { name },
      { new: true }
    );
    if (!category) return res.status(404).send("Category not found");
    res.send(category);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

///// Update the Subcategory

module.exports.updateSubcategory = async (req, res) => {
  const { categoryId, subcategoryId } = req.params;
  const { subcategory } = req.body;

  try {
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(400).send("Category not found");
    }

    // Check if another subcategory with the same name exists (ignore the current one being updated)
    const existingSubcategory = category.subcategories.find(
      (subcat) =>
        subcat.name.toLowerCase() === subcategory.toLowerCase() &&
        subcat._id.toString() !== subcategoryId
    );

    if (existingSubcategory) {
      return res
        .status(400)
        .send("Subcategory name must be unique within the category");
    }

    // Find the subcategory to update
    const subcategoryIndex = category.subcategories.findIndex(
      (subcat) => subcat._id.toString() === subcategoryId
    );
    if (subcategoryIndex === -1) {
      return res.status(400).send("Invalid subcategory index");
    }

    // Update subcategory name
    category.subcategories[subcategoryIndex].name = subcategory;
    await category.save();

    res.status(200).send("Subcategory updated successfully");
  } catch (error) {
    res.status(500).send("Error updating subcategory");
  }
};

//// Delete Category

module.exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    category.isDeleted = true; // Mark category as deleted
    await category.save();

    res.send("Category marked as deleted");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

///// Delete Subcategory
module.exports.deleteSubcategory = async (req, res) => {
  try {
    const categoryId = req.params.categoryId;
    const subcategoryId = req.params.subcategoryId; 

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Find the subcategory to delete
    const subcategoryIndex = category.subcategories.findIndex(
      (sub) => sub._id == subcategoryId
    ); // Use == for comparison due to potential type mismatch
    if (subcategoryIndex === -1) {
      return res.status(404).send("Subcategory not found");
    }

    // Mark the subcategory as deleted instead of directly removing it
    category.subcategories[subcategoryIndex].isDeleted = true;
    await category.save();

    res.send(category);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//! Delete Category Completely
module.exports.categoryDeleteCompletelyApi = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    res.send("Category deleted completely");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

//! Delete Subcategory Completely
module.exports.subcategoryDeleteCompletelyApi = async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).send("Category not found");
    }

    // Find the index of the subcategory to delete
    const subcategoryIndex = category.subcategories.findIndex(
      (sub) => sub._id.toString() === subcategoryId
    );
    if (subcategoryIndex === -1) {
      return res.status(404).send("Subcategory not found");
    }

    // Remove the subcategory from the array
    category.subcategories.splice(subcategoryIndex, 1);
    await category.save();

    res.send("Subcategory deleted completely");
  } catch (err) {
    res.status(400).send(err.message);
  }
};


//! Restore Category
module.exports.categoryRestoreApi = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    if (!category.isDeleted) {
      return res.status(400).send("Category is not marked as deleted");
    }

    category.isDeleted = false; // Unmark category as deleted
    await category.save();

    res.send("Category restored successfully");
  } catch (err) {
    res.status(400).send(err.message);
  }
};

module.exports.subCategoryRestoreApi = async (req, res) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    const subcategoryId = req.params.subcategoryId;

    // Find the index of the subcategory to be restored
    const subcategoryIndex = category.subcategories.findIndex(
      (subcategory) => subcategory._id.toString() === subcategoryId
    );

    if (subcategoryIndex === -1) {
      return res.status(404).send("Subcategory not found");
    }

    // Unmark the subcategory as deleted
    category.subcategories[subcategoryIndex].isDeleted = false;

    // Save the updated category
    await category.save();

    res.send(category);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

////! For Getting the Category and Subcategory

module.exports.getAll_Category = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: { $ne: true } }); // Exclude deleted categories
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports.get_all_subcategory = async (req, res) => {
  try {
    // Fetch all categories that are not deleted
    const categories = await Category.find({ isDeleted: { $ne: true } });

    // Extract and flatten the subcategories
    const subcategories = categories.flatMap(category => 
      category.subcategories.filter(subcategory => !subcategory.isDeleted)
    );

    res.json(subcategories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


  module.exports.getSubcategoryApi = async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.categoryId);
      if (!category) return res.status(404).send("Category not found");

      // Filter out deleted subcategories
      const activeSubcategories = category.subcategories.filter(
        (subcategory) => !subcategory.isDeleted
      );

      res.send(activeSubcategories);
    } catch (err) {
      res.status(400).send(err.message);
    }
  };

// Fetch deleted categories
module.exports.deletedCategoriesApi = async (req, res) => {
  try {
    const deletedCategories = await Category.find({ isDeleted: true });
    res.send(deletedCategories);
  } catch (err) {
    res.status(400).send(err.message);
  }
};

// Fetch deleted subcategories by category ID
module.exports.getDeleteSubcategoryApi = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.categoryId);
    if (!category) return res.status(404).send("Category not found");

    // Filter out deleted subcategories
    const deletedSubcategories = category.subcategories.filter(
      (subcategory) => subcategory.isDeleted
    );

    res.send(deletedSubcategories);
  } catch (err) {
    res.status(400).send(err.message);
  }
};
