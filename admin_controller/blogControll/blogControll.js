const News = require('../../admin_mongodb/blogMongo/blogMongo');

exports.createNews = async (req, res) => {
    try {
        const { title, content, keywords, image, imageType } = req.body;
        
        if (!title || !content || !keywords) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const newsData = {
            title,
            content,
            keywords
        };

        // If image binary data is provided
        if (image && imageType) {
            newsData.image = Buffer.from(image, 'base64'); // Convert base64 to Buffer
            newsData.imageType = imageType;
        }

        const news = new News(newsData);
        await news.save();

        res.status(201).json({
            message: 'News added successfully',
            data: {
                ...news.toObject(),
                // Convert Buffer to base64 for response
                image: news.image ? news.image.toString('base64') : null
            }
        });
    } catch (error) {
        console.error('Error saving news:', error);
        res.status(500).json({ error: 'Error adding news' });
    }
};


exports.updateNews = async (req, res) => {
    try {
        const { id } = req.params; // Get the news ID from the URL parameter
        const { title, content, keywords, image, imageType } = req.body;

        // Validate required fields
        if (!title || !content || !keywords) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Prepare the data to update
        const newsData = {
            title,
            content,
            keywords,
        };

        // If image binary data is provided, convert base64 to Buffer
        if (image && imageType) {
            newsData.image = Buffer.from(image, 'base64'); // Convert base64 to Buffer
            newsData.imageType = imageType;
        } else {
            // If no new image is provided, ensure the image fields are not overwritten with null
            delete newsData.image;
            delete newsData.imageType;
        }

        // Find and update the news post by ID
        const updatedNews = await News.findByIdAndUpdate(
            id,
            newsData,
            { new: true } // Return the updated document
        );

        // Check if the news post was found
        if (!updatedNews) {
            return res.status(404).json({ error: 'News post not found' });
        }

        res.status(200).json({
            message: 'News updated successfully',
            data: {
                ...updatedNews.toObject(),
                // Convert Buffer to base64 for response
                image: updatedNews.image ? updatedNews.image.toString('base64') : null,
            },
        });
    } catch (error) {
        console.error('Error updating news:', error);
        res.status(500).json({ error: 'Error updating news' });
    }
};

exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find().sort({ createdAt: -1 });
        // Convert binary image to base64 for client
        const newsWithBase64 = news.map(item => ({
            ...item.toObject(),
            image: item.image ? item.image.toString('base64') : null
        }));
        res.json(newsWithBase64);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Error fetching news' });
    }
};

exports.getNewsById = async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) {
            return res.status(404).json({ error: 'News not found' });
        }
        // Convert binary image to base64 for client
        const newsWithBase64 = {
            ...news.toObject(),
            image: news.image ? news.image.toString('base64') : null
        };
        res.json(newsWithBase64);
    } catch (error) {
        console.error('Error fetching news:', error);
        res.status(500).json({ error: 'Error fetching news' });
    }
};

exports.deleteNews = async (req, res) => {
    try {
      const news = await News.findByIdAndDelete(req.params.id);
      if (!news) {
        return res.status(404).json({ error: 'News not found' });
      }
      res.json({ message: 'News deleted successfully' });
    } catch (error) {
      console.error('Error deleting news:', error);
      res.status(500).json({ error: 'Error deleting news' });
    }
  };