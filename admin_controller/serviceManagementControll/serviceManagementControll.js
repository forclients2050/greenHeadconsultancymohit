const mongoose = require('mongoose');
const Service = require('../../admin_mongodb/serviceManagementMongo/serviceManagementMongo');

exports.createService = async (req, res) => {
    try {
        const {
            title,
            content,
            category,
            subcategory,
            seoKeywords,
            shortDescription,
            image,
            imageType,
        } = req.body;

        // Validate required fields
        if (!title || !content || !category) {
            return res.status(400).json({ error: 'Title, content, and category are required' });
        }

        // Validate category as a non-empty string
        if (typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'Category must be a non-empty string' });
        }

        // Validate subcategory if provided
        if (subcategory && (typeof subcategory !== 'string' || subcategory.trim() === '')) {
            return res.status(400).json({ error: 'Subcategory must be a non-empty string if provided' });
        }

        // Validate image size (5MB limit)
        if (image && Buffer.from(image, 'base64').length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image size exceeds 5MB. Please use a smaller image.' });
        }

        // Prepare service data
        const serviceData = {
            title,
            content,
            category: category.trim(),
            subcategory: subcategory ? subcategory.trim() : '', // Save empty string if subcategory is not provided
            seoKeywords: seoKeywords || [],
            shortDescription: shortDescription || '',
            isDeleted: false,
        };

        // Handle image if provided
        if (image && imageType) {
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(imageType)) {
                return res.status(400).json({ error: 'Invalid image type. Use JPEG, PNG, or GIF.' });
            }
            serviceData.image = Buffer.from(image, 'base64');
            serviceData.imageType = imageType;
        }

        // Create and save service
        const service = new Service(serviceData);
        await service.save();

        res.status(201).json({
            message: 'Service added successfully',
            data: {
                ...service.toObject(),
                image: service.image ? service.image.toString('base64') : null,
            },
        });
    } catch (error) {
        console.error('Error saving service:', error);
        res.status(500).json({ error: 'Error adding service' });
    }
};

exports.updateService = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            content,
            category,
            subcategory,
            seoKeywords,
            shortDescription,
            image,
            imageType,
        } = req.body;

        // Validate required fields
        if (!title || !content || !category ) {
            return res.status(400).json({ error: 'Title, content, category, and subcategory are required' });
        }

        // Validate ObjectId for id
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }

        // Validate category and subcategory as non-empty strings
        if (typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'Category must be a non-empty string' });
        }
        

        // Validate image size (5MB limit)
        if (image && Buffer.from(image, 'base64').length > 5 * 1024 * 1024) {
            return res.status(400).json({ error: 'Image size exceeds 5MB. Please use a smaller image.' });
        }

        // Prepare update data
        const serviceData = {
            title,
            content,
            category: category.trim(),
            subcategory:subcategory.trim(),
            seoKeywords: seoKeywords || [],
            shortDescription: shortDescription || '',
            updatedAt: Date.now(),
        };

        // Handle image if provided
        if (image && imageType) {
            if (!['image/jpeg', 'image/png', 'image/gif'].includes(imageType)) {
                return res.status(400).json({ error: 'Invalid image type. Use JPEG, PNG, or GIF.' });
            }
            serviceData.image = Buffer.from(image, 'base64');
            serviceData.imageType = imageType;
        } else {
            serviceData.image = null;
            serviceData.imageType = null;
        }

        // Update service
        const updatedService = await Service.findByIdAndUpdate(id, serviceData, { new: true });

        if (!updatedService) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.status(200).json({
            message: 'Service updated successfully',
            data: {
                ...updatedService.toObject(),
                image: updatedService.image ? updatedService.image.toString('base64') : null,
            },
        });
    } catch (error) {
        console.error('Error updating service:', error);
        res.status(500).json({ error: 'Error updating service' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }

        // Soft delete by setting isDeleted to true
        const deletedService = await Service.findByIdAndUpdate(
            id,
            { isDeleted: true, updatedAt: Date.now() },
            { new: true }
        );

        if (!deletedService) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.status(200).json({ message: 'Service soft-deleted successfully' });
    } catch (error) {
        console.error('Error soft-deleting service:', error);
        res.status(500).json({ error: 'Error soft-deleting service' });
    }
};

exports.permanentDeleteService = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }

        // Find and permanently delete the service
        const deletedService = await Service.findByIdAndDelete(id);

        if (!deletedService) {
            return res.status(404).json({ error: 'Service not found' });
        }

        res.status(200).json({ message: 'Service permanently deleted successfully' });
    } catch (error) {
        console.error('Error permanently deleting service:', error);
        res.status(500).json({ error: 'Error permanently deleting service' });
    }
};


exports.getAllServices = async (req, res) => {
    try {
        // Fetch all services, excluding deleted ones
        const services = await Service.find({ isDeleted: false })
            .lean();

        // Count total services
        const total = await Service.countDocuments({ isDeleted: false });

        // Convert image Buffer to base64
        const formattedServices = services.map((service) => ({
            ...service,
            image: service.image ? service.image.toString('base64') : null,
        }));

        res.status(200).json({
            message: 'Services retrieved successfully',
            data: formattedServices,
            total,
        });
    } catch (error) {
        console.error('Error retrieving services:', error);
        res.status(500).json({ error: 'Error retrieving services' });
    }
};



exports.getServiceById = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }

        // Fetch service
        const service = await Service.findOne({ _id: id, isDeleted: false })
            .select('_id title content category seoKeywords shortDescription image imageType')
            .lean();

        if (!service) {
            return res.status(404).json({ 
                message: 'Service not found',
                data: null
            });
        }

        // Convert image Buffer to base64
        const formattedService = {
            _id: service._id,
            title: service.title,
            content: service.content,
            category: service.category,
            seoKeywords: service.seoKeywords || [],
            shortDescription: service.shortDescription || '',
            image: service.image ? service.image.toString('base64') : null,
            imageType: service.imageType || null,
        };

        res.status(200).json({
            message: 'Service retrieved successfully',
            data: formattedService,
        });
    } catch (error) {
        console.error('Error retrieving service:', error);
        res.status(500).json({ error: 'Error retrieving service' });
    }
};



exports.getServicesByCategory = async (req, res) => {
    try {
        const { category } = req.params;

        // Validate category name (ensuring it's a non-empty string)
        if (typeof category !== 'string' || category.trim() === '') {
            return res.status(400).json({ error: 'Invalid category name' });
        }

        // Fetch all services by category name (case-insensitive) with all relevant fields
        const services = await Service.find({ 
            category: { $regex: `^${category.trim()}$`, $options: 'i' }, 
            isDeleted: false 
        })
            .select('_id title content category subcategory seoKeywords shortDescription image imageType') // Added subcategory
            .lean();

        // Check if no services were found
        if (services.length === 0) {
            return res.status(404).json({ 
                message: 'No services found for this category',
                data: [],
            });
        }

        // Convert image Buffer to base64 and format response
        const formattedServices = services.map((service) => ({
            _id: service._id,
            title: service.title,
            content: service.content,
            category: service.category,
            subcategory: service.subcategory || '', // Ensure empty string if subcategory is not set
            seoKeywords: service.seoKeywords || [],
            shortDescription: service.shortDescription || '',
            image: service.image ? service.image.toString('base64') : null,
            imageType: service.imageType || null,
        }));

        res.status(200).json({
            message: 'Services retrieved successfully',
            data: formattedServices,
        });
    } catch (error) {
        console.error('Error retrieving services by category:', error);
        res.status(500).json({ error: 'Error retrieving services' });
    }
};


exports.getServicesBySubcategory = async (req, res) => {
    try {
        const { subcategory } = req.params;
        const { page = 1, limit = 10 } = req.query;

        // Validate subcategory
        if (typeof subcategory !== 'string' || subcategory.trim() === '') {
            return res.status(400).json({ error: 'Invalid subcategory' });
        }

        // Validate pagination parameters
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid pagination parameters' });
        }

        // Fetch services by subcategory
        const services = await Service.find({ subcategory: subcategory.trim(), isDeleted: false })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        // Count total services in subcategory
        const total = await Service.countDocuments({ subcategory: subcategory.trim(), isDeleted: false });

        // Convert image Buffer to base64
        const formattedServices = services.map((service) => ({
            ...service,
            image: service.image ? service.image.toString('base64') : null,
        }));

        res.status(200).json({
            message: 'Services retrieved successfully',
            data: formattedServices,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error('Error retrieving services by subcategory:', error);
        res.status(500).json({ error: 'Error retrieving services' });
    }
};

exports.searchServicesByKeywords = async (req, res) => {
    try {
        const { keywords, page = 1, limit = 10 } = req.query;

        // Validate keywords
        if (!keywords || typeof keywords !== 'string') {
            return res.status(400).json({ error: 'Keywords are required' });
        }

        // Validate pagination parameters
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid pagination parameters' });
        }

        // Split keywords and create regex for case-insensitive search
        const keywordArray = keywords.split(',').map((kw) => kw.trim()).filter((kw) => kw);
        const regexArray = keywordArray.map((kw) => new RegExp(kw, 'i'));

        // Fetch services by keywords
        const services = await Service.find({
            seoKeywords: { $in: regexArray },
            isDeleted: false,
        })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        // Count total matching services
        const total = await Service.countDocuments({
            seoKeywords: { $in: regexArray },
            isDeleted: false,
        });

        // Convert image Buffer to base64
        const formattedServices = services.map((service) => ({
            ...service,
            image: service.image ? service.image.toString('base64') : null,
        }));

        res.status(200).json({
            message: 'Services retrieved successfully',
            data: formattedServices,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error('Error searching services:', error);
        res.status(500).json({ error: 'Error searching services' });
    }
};

exports.getDeletedServices = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Validate pagination parameters
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
            return res.status(400).json({ error: 'Invalid pagination parameters' });
        }

        // Fetch deleted services
        const services = await Service.find({ isDeleted: true })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();

        // Count total deleted services
        const total = await Service.countDocuments({ isDeleted: true });

        // Convert image Buffer to base64
        const formattedServices = services.map((service) => ({
            ...service,
            image: service.image ? service.image.toString('base64') : null,
        }));

        res.status(200).json({
            message: 'Deleted services retrieved successfully',
            data: formattedServices,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum,
            },
        });
    } catch (error) {
        console.error('Error retrieving deleted services:', error);
        res.status(500).json({ error: 'Error retrieving deleted services' });
    }
};


exports.restoreService = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid service ID' });
        }

        // Find the service and ensure it is deleted
        const service = await Service.findById(id);
        if (!service) {
            return res.status(404).json({ error: 'Service not found' });
        }
        if (!service.isDeleted) {
            return res.status(400).json({ error: 'Service is not deleted' });
        }

        // Restore the service
        const restoredService = await Service.findByIdAndUpdate(
            id,
            { isDeleted: false, updatedAt: Date.now() },
            { new: true }
        );

        res.status(200).json({
            message: 'Service restored successfully',
            data: {
                ...restoredService.toObject(),
                image: restoredService.image ? restoredService.image.toString('base64') : null,
            },
        });
    } catch (error) {
        console.error('Error restoring service:', error);
        res.status(500).json({ error: 'Error restoring service' });
    }
};