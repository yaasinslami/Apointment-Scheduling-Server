// service routes

const express = require('express');
const serviceController = require('../controllers/serviceController');
const protect = require('../middlewares/protect');
const verifyProviderRole = require('../middlewares/ProviderRole')
const { validateCreateService } = require('../middlewares/serviceValidation');
const upload = require('../middlewares/mediaUpload');

const ServiceRouter = express.Router();

ServiceRouter.get('/search', protect, serviceController.searchProviders);
ServiceRouter.post('/', protect, verifyProviderRole, upload.array('images', 5), validateCreateService, serviceController.createService);
ServiceRouter.patch('/:serviceId', protect, verifyProviderRole, upload.array('images', 5), serviceController.updateService);
ServiceRouter.get('/:serviceId', protect, serviceController.getService);
ServiceRouter.delete('/:serviceId', protect, verifyProviderRole, serviceController.deleteService);
ServiceRouter.get('/user/:userId', protect, serviceController.getServicesByUserId);

module.exports = ServiceRouter;
