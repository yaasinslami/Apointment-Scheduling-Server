const dotenv = require("dotenv");
const { geocodeCity } = require('../utils/geocode');
const emailqueue = require("../workers/emailqueue");
const Service = require("../models/Service");
const User = require("../models/User")
const { validationResult } = require("express-validator");
const NewServiceEmailTemplate = require("../templates/NewServiceEmailTemplate");
const { parseInteger, validateString, deleteOldImages, deleteUploadedFiles } = require("../config/helpers")

dotenv.config();

// create a new service
exports.createService = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ status: 'fail', errors: errors.array() });
        }

        const { name, description, category, price, duration, preparationTime, cleanupTime } = req.body;

        validateString(name, 'Service name');
        validateString(description, 'Description');

        const parsedPrice = parseInteger(price, 'Price', 1);
        const parsedDuration = parseInteger(duration, 'Duration', 1);
        const parsedPreparationTime = preparationTime ? parseInteger(preparationTime, 'Preparation time') : undefined;
        const parsedCleanupTime = cleanupTime ? parseInteger(cleanupTime, 'Cleanup time') : undefined;

        const uploadedFiles = req.files;
        if (!uploadedFiles || uploadedFiles.length === 0) {
            return res.status(400).json({ status: 'fail', message: 'At least one image is required.' });
        }

        const imagePaths = uploadedFiles.map((file) => file.path);

        const existingService = await Service.findOne({ provider: req.user.id, name });
        if (existingService) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ status: 'fail', message: 'A service with this name already exists.' });
        }

        const newService = new Service({
            provider: req.user.id,
            name,
            description,
            images: imagePaths,
            price: parsedPrice,
            duration: parsedDuration,
            preparationTime: parsedPreparationTime,
            cleanupTime: parsedCleanupTime,
            category,
        });

        await newService.save();

        const emailData = {
            email: req.user.email,
            subject: `New Service Created: ${newService.name}`,
            html: NewServiceEmailTemplate(newService, req.user.name),
        };
        emailqueue.add({ emailData });

        res.status(201).json({ status: 'success', data: newService });
    } catch (error) {
        console.error('Service creation error:', error);
        deleteUploadedFiles(req.files);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// update an existing service
exports.updateService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        if (!serviceId) {
            deleteUploadedFiles(req.files);
            return res.status(400).json({ status: 'fail', message: 'Service ID is required.' });
        }

        const service = await Service.findById(serviceId);
        if (!service) {
            deleteUploadedFiles(req.files);
            return res.status(404).json({ status: 'fail', message: 'Service not found.' });
        }

        const allowedFields = ["name", "description", "price", "duration", "preparationTime", "cleanupTime", "images", "category"];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field]?.trim()) {
                updates[field] = req.body[field];
            }
        }

        const uploadedFiles = req.files || [];
        const keepOldImages = req.body.keepOldImages === 'true';

        // Handle image logic
        if (uploadedFiles.length > 0) {
            const newImages = uploadedFiles.map((file) => file.path);
            updates.images = keepOldImages ? [...service.images, ...newImages] : newImages;
        } else if (!keepOldImages) {
            // Remove images if no new images are uploaded and `keepOldImages` is false
            updates.images = [];
            try {
                deleteOldImages(service.images);
            } catch (error) {
                console.error("Failed to delete old images:", error);
            }
        } else if (updates.images) {
            // If updates include `images`, filter out empty values
            updates.images = updates.images.filter((img) => img.trim());
        }

        // Validate other fields
        if (updates.price) updates.price = parseInteger(updates.price, 'Price', 1);
        if (updates.duration) updates.duration = parseInteger(updates.duration, 'Duration', 1);
        if (updates.name) validateString(updates.name, 'Service name');
        if (updates.description) validateString(updates.description, 'Description');

        // Update the service document

        // console.log(updates);
        const updatedService = await Service.findByIdAndUpdate(serviceId, updates, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({ status: 'success', data: updatedService });
    } catch (error) {
        console.error('Service update error:', error);
        deleteUploadedFiles(req.files);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// get a service by id
exports.getService = async (req, res) => {
    try {
        const { serviceId } = req.params;
        if (!serviceId) {
            return res.status(400).json({ status: 'fail', message: 'Service ID is required.' });
        }

        const service = await Service.findById(serviceId)
            .populate({
                path: 'provider',
                select: 'name email providerDetails'
            });

        if (!service) {
            return res.status(404).json({ status: 'fail', message: 'Service not found.' });
        }

        res.status(200).json({
            status: 'success',
            data: {
                service,
            }
        });
    } catch (error) {
        console.error('Error fetching service:', error);
        res.status(400).json({ status: 'fail', message: error.message });
    }
};

// delete a service
exports.deleteService = async (req, res) => {
    try {
        const { serviceId } = req.params;

        if (!serviceId) {
            return res.status(400).json({ status: 'fail', message: 'Service ID is required.' });
        }

        const service = await Service.findById(serviceId);

        if (!service) {
            return res.status(404).json({ status: 'fail', message: 'Service not found.' });
        }

        if (service.images && service.images.length > 0) {
            await deleteOldImages(service.images);
        }

        // Delete the service from the database
        await Service.findByIdAndDelete(serviceId);

        res.status(200).json({ status: 'success', message: 'Service and associated media deleted successfully.' });
    } catch (error) {
        console.error('Error deleting service:', error);
        res.status(500).json({ status: 'fail', message: error.message });
    }
};

// get services for a user
exports.getServicesByUserId = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, category } = req.query;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: 'fail', message: 'User not found.' });
        }

        if (user.role !== 'provider') {
            return res.status(400).json({ status: 'fail', message: 'Only providers can have services.' });
        }

        let query = { provider: userId };

        if (name) {
            query.name = { $regex: name, $options: 'i' };
        }

        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        const services = await Service.find(query).populate('provider', 'name email providerDetails');

        return res.status(200).json({
            status: 'success',
            data: services,
        });

    } catch (error) {
        console.error('Error fetching services:', error);
        return res.status(500).json({ status: 'fail', message: error.message });
    }
};

// Search providers based on city, name, and category
exports.searchProviders = async (req, res) => {
    try {
        const { name, category, city, minPrice, maxPrice, minDuration, maxDuration, rating, businessName, page = 1, limit = 10 } = req.query;

        let query = {};

        if (businessName) {
            query['providerDetails.businessName'] = { $regex: businessName, $options: 'i' };
        }

        if (name) {
            query['providerDetails.name'] = { $regex: name, $options: 'i' };
        }

        if (category) {
            query.category = { $regex: category, $options: 'i' };
        }

        if (city) {
            const coordinates =  await geocodeCity(city);

            console.log('coordinates:', coordinates);

            if (!coordinates) {
                return res.status(404).json({ status: 'fail', message: 'City not found.' });
            }

            console.log(`${city} : `, coordinates);

            const radiusInMeters = 20000;
            const radiusInRadians = radiusInMeters / 6371000;
            query['providerDetails.location'] = {
                $geoWithin: {
                    $centerSphere: [coordinates, radiusInRadians]
                }
            };
        }

        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = minPrice;
            if (maxPrice) query.price.$lte = maxPrice;
        }

        if (minDuration || maxDuration) {
            query.duration = {};
            if (minDuration) query.duration.$gte = minDuration;
            if (maxDuration) query.duration.$lte = maxDuration;
        }

        if (rating) {
            query['providerDetails.rating'] = { $gte: rating };
        }

        const services = await Service.aggregate([
            {
                $lookup: {
                    from: 'users', // name of the collection for 'User' model
                    localField: 'provider', // Assuming 'provider' is the reference to the user
                    foreignField: '_id',
                    as: 'providerDetails'
                }
            },
            {
                $unwind: {
                    path: '$providerDetails',
                    preserveNullAndEmptyArrays: true // this makes sure we keep services without provider details
                }
            },
            {
                $match: {
                    'providerDetails.role': 'provider', // Ensure we are fetching only providers
                    ...query // Add the dynamic filters here, including geo filter
                }
            },
            {
                $skip: (page - 1) * limit
            },
            {
                $limit: parseInt(limit)
            },
            {
                $sort: { 'providerDetails.rating': -1, 'providerDetails.completedAppointments': -1 }
            }
        ]);

        if (services.length === 0) {
            return res.status(404).json({ status: 'fail', message: 'No services found matching the criteria.' });
        }

        return res.status(200).json({
            status: 'success',
            data: services,
        });

    } catch (error) {
        console.error('Error searching for providers:', error);
        return res.status(500).json({ status: 'fail', message: error.message });
    }
};
