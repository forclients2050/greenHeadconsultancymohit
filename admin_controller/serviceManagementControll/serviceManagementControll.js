// serviceController.js
const mongoose = require('mongoose');
const Service = require('../../admin_mongodb/serviceManagementMongo/serviceManagementMongo');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper function to extract public ID from Cloudinary URL
const getPublicIdFromUrl = (url) => {
  const parts = url.split('/');
  const fileName = parts[parts.length - 1]; // Get the last segment
  const publicId = fileName.split('.')[0]; // Remove extension
  return `services/${publicId}`; // Prepend folder
};

// Helper function to process base64 images and upload to Cloudinary
const processImagesInContent = async (content) => {
  const base64Regex = /data:image\/(jpeg|png|gif);base64,([^"]+)/g;
  let modifiedContent = content;
  const matches = content.matchAll(base64Regex);

  for (const match of matches) {
    const mimeType = `image/${match[1]}`;
    const base64Data = match[2];

    if (!['image/jpeg', 'image/png', 'image/gif'].includes(mimeType)) {
      throw new Error('Invalid image type in content. Use JPEG, PNG, or GIF.');
    }

    const buffer = Buffer.from(base64Data, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      throw new Error('An image in content exceeds 5MB. Please use a smaller image.');
    }

    const result = await cloudinary.uploader.upload(`data:${mimeType};base64,${base64Data}`, {
      folder: 'services',
      resource_type: 'image',
      transformation: { quality: 'auto', fetch_format: 'auto' },
    });

   

    modifiedContent = modifiedContent.replace(
      `data:${mimeType};base64,${base64Data}`,
      result.secure_url
    );
  }

  return modifiedContent;
};

// Helper function to fetch and process services
const fetchServices = async (filter, res) => {
  try {
    const services = await Service.find({ ...filter, isDeleted: false })
      .select('_id title content category subcategory seoKeywords shortDescription')
      .lean();

    if (services.length === 0) {
      return res.status(404).json({
        message: 'No services found',
        data: [],
      });
    }

    const processedServices = await Promise.all(
      services.map(async (service) => {
        const urlRegex = /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^/]+\/services\/[^/]+/g;
        const imageUrls = service.content.match(urlRegex) || [];
      

        const imageDetails = await Promise.all(
          imageUrls.map(async (url) => {
            const publicId = getPublicIdFromUrl(url);
          
            try {
              const result = await cloudinary.api.resource(publicId, {
                resource_type: 'image',
              });
              return {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
              };
            } catch (error) {
              console.error(`Error fetching Cloudinary resource for ${publicId}:`, error.message);
              return null; // Skip invalid images
            }
          })
        );

        const validImageDetails = imageDetails.filter((detail) => detail !== null);
        return { ...service, images: validImageDetails };
      })
    );

    res.status(200).json({
      message: 'Services retrieved successfully',
      data: processedServices,
    });
  } catch (error) {
    console.error('Error retrieving services:', error);
    res.status(500).json({ error: 'Error retrieving services' });
  }
};

exports.createService = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Request body is missing' });
    }

    const { title, content, category, subcategory, seoKeywords, shortDescription } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    if (typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Category must be a non-empty string' });
    }
    if (subcategory && (typeof subcategory !== 'string' || subcategory.trim() === '')) {
      return res.status(400).json({ error: 'Subcategory must be a non-empty string' });
    }

    let processedContent;
    try {
      processedContent = await processImagesInContent(content);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const serviceData = {
      title,
      content: processedContent,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      seoKeywords: seoKeywords || [],
      shortDescription: shortDescription || '',
      isDeleted: false,
    };

    const service = new Service(serviceData);
    await service.save();

    res.status(201).json({
      message: 'Service added successfully',
      data: service.toObject(),
    });
  } catch (error) {
    console.error('Error saving service:', error);
    res.status(500).json({ error: 'Error adding service' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, subcategory, seoKeywords, shortDescription } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Title, content, and category are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    if (typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Category must be a non-empty string' });
    }
    if (subcategory && (typeof subcategory !== 'string' || subcategory.trim() === '')) {
      return res.status(400).json({ error: 'Subcategory must be a non-empty string' });
    }

    let processedContent;
    try {
      processedContent = await processImagesInContent(content);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const serviceData = {
      title,
      content: processedContent,
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : '',
      seoKeywords: seoKeywords || [],
      shortDescription: shortDescription || '',
      updatedAt: Date.now(),
    };

    const updatedService = await Service.findByIdAndUpdate(id, serviceData, { new: true });

    if (!updatedService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.status(200).json({
      message: 'Service updated successfully',
      data: updatedService.toObject(),
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ error: 'Error updating service' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const urlRegex = /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/[^/]+\/services\/[^/]+/g;
    const imageUrls = service.content.match(urlRegex) || [];
    for (const url of imageUrls) {
      const publicId = getPublicIdFromUrl(url);
      try {
        await cloudinary.uploader.destroy(publicId);
       
      } catch (error) {
        console.error(`Error deleting Cloudinary resource ${publicId}:`, error.message);
      }
    }

    await Service.findByIdAndDelete(id);

    res.status(200).json({ message: 'Service permanently deleted successfully' });
  } catch (error) {
    console.error('Error permanently deleting service:', error);
    res.status(500).json({ error: 'Error permanently deleting service' });
  }
};

exports.getAllServices = async (req, res) => {
  try {
    const services = await Service.find({ isDeleted: false }).lean();
    const total = await Service.countDocuments({ isDeleted: false });

    res.status(200).json({
      message: 'Services retrieved successfully',
      data: services,
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const service = await Service.findOne({ _id: id, isDeleted: false })
      .select('_id title content category subcategory seoKeywords shortDescription')
      .lean();

    if (!service) {
      return res.status(404).json({
        message: 'Service not found',
        data: null,
      });
    }

    res.status(200).json({
      message: 'Service retrieved successfully',
      data: service,
    });
  } catch (error) {
    console.error('Error retrieving service:', error);
    res.status(500).json({ error: 'Error retrieving service' });
  }
};



exports.getServicesByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    if (typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Invalid category name' });
    }

    const services = await Service.find({
      category: { $regex: `^${category.trim()}$`, $options: 'i' },
      isDeleted: false,
    })
      .select('_id title content category subcategory seoKeywords shortDescription')
      .lean();

    if (services.length === 0) {
      return res.status(404).json({
        message: 'No services found for this category',
        data: [],
      });
    }

    // Process each service to fetch image metadata from Cloudinary
    const processedServices = await Promise.all(
      services.map(async (service) => {
        const urlRegex = /https:\/\/res\.cloudinary\.com\/[^\s"]+/g;
        const imageUrls = service.content.match(urlRegex) || [];
        const imageDetails = await Promise.all(
          imageUrls.map(async (url) => {
            // Extract public ID from URL
            const urlParts = url.split('/');
            const fileName = urlParts.pop().split('.')[0]; // e.g., 'tqotjlclvk5qsjugdqwe'
            // Find the index of 'upload' and skip the version number (e.g., 'v1748271301')
            const uploadIndex = urlParts.indexOf('upload') + 1; // After 'upload'
            const versionOrFolder = urlParts[uploadIndex]; // Either version (e.g., 'v1748271301') or folder
            const folderStartIndex = versionOrFolder.startsWith('v') && !isNaN(versionOrFolder.slice(1))
              ? uploadIndex + 1 // Skip version
              : uploadIndex; // No version, start with folder
            const folderParts = urlParts.slice(folderStartIndex); // e.g., ['services']
            const publicId = folderParts.join('/') + '/' + fileName; // e.g., 'services/tqotjlclvk5qsjugdqwe'

            // Validate public ID format
            if (!publicId || publicId.includes('..') || publicId.length > 255) {
              console.warn(`Invalid public ID derived from URL: ${url}, publicId: ${publicId}`);
              return { url, error: 'Invalid public ID' };
            }

            try {
              // Fetch resource metadata
              const result = await cloudinary.api.resource(publicId, {
                resource_type: 'image',
              });
              return {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
              };
            } catch (error) {
              console.error(`Error fetching Cloudinary resource for ${publicId}:`, {
                url,
                publicId,
                error: error.message || error,
                http_code: error.http_code || 'N/A',
              });
              return { url, error: 'Failed to fetch image metadata' };
            }
          })
        );

        // Filter out images with errors to reduce frontend issues
        const validImageDetails = imageDetails.filter((img) => !img.error);
        return { ...service, images: validImageDetails.length > 0 ? validImageDetails : [] };
      })
    );

    res.status(200).json({
      message: 'Services retrieved successfully',
      data: processedServices,
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

    if (typeof subcategory !== 'string' || subcategory.trim() === '') {
      return res.status(400).json({ error: 'Invalid subcategory' });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const services = await Service.find({ subcategory: subcategory.trim(), isDeleted: false })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .select('_id title content category subcategory seoKeywords shortDescription')
      .lean();

    if (services.length === 0) {
      return res.status(404).json({
        message: 'No services found for this subcategory',
        data: [],
        pagination: { total: 0, page: pageNum, pages: 0, limit: limitNum },
      });
    }

    // Process each service to fetch image metadata from Cloudinary
    const processedServices = await Promise.all(
      services.map(async (service) => {
        const urlRegex = /https:\/\/res\.cloudinary\.com\/[^\s"]+/g;
        const imageUrls = service.content.match(urlRegex) || [];
        const imageDetails = await Promise.all(
          imageUrls.map(async (url) => {
            const publicId = url.split('/').pop().split('.')[0];
            try {
              const result = await cloudinary.api.resource(`services/${publicId}`, {
                resource_type: 'image',
              });
              return {
                url: result.secure_url,
                public_id: result.public_id,
                format: result.format,
                width: result.width,
                height: result.height,
              };
            } catch (error) {
              console.error(`Error fetching Cloudinary resource for ${publicId}:`, error);
              return { url, error: 'Failed to fetch image metadata' };
            }
          })
        );
        return { ...service, images: imageDetails };
      })
    );

    const total = await Service.countDocuments({
      subcategory: subcategory.trim(),
      isDeleted: false,
    });

    res.status(200).json({
      message: 'Services retrieved successfully',
      data: processedServices,
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

    if (!keywords || typeof keywords !== 'string') {
      return res.status(400).json({ error: 'Keywords are required' });
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const keywordArray = keywords.split(',').map((kw) => kw.trim()).filter((kw) => kw);
    const regexArray = keywordArray.map((kw) => new RegExp(kw, 'i'));

    const services = await Service.find({
      seoKeywords: { $in: regexArray },
      isDeleted: false,
    })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments({
      seoKeywords: { $in: regexArray },
      isDeleted: false,
    });

    res.status(200).json({
      message: 'Services retrieved successfully',
      data: services,
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

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    if (isNaN(pageNum) || pageNum < 1 || isNaN(limitNum) || limitNum < 1) {
      return res.status(400).json({ error: 'Invalid pagination parameters' });
    }

    const services = await Service.find({ isDeleted: true })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();

    const total = await Service.countDocuments({ isDeleted: true });

    res.status(200).json({
      message: 'Deleted services retrieved successfully',
      data: services,
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

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const service = await Service.findById(id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    if (!service.isDeleted) {
      return res.status(400).json({ error: 'Service is not deleted' });
    }

    const restoredService = await Service.findByIdAndUpdate(
      id,
      { isDeleted: false, updatedAt: Date.now() },
      { new: true }
    );

    res.status(200).json({
      message: 'Service restored successfully',
      data: restoredService.toObject(),
    });
  } catch (error) {
    console.error('Error restoring service:', error);
    res.status(500).json({ error: 'Error restoring service' });
  }
};
