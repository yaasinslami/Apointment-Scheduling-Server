// express routes

const express = require('express');
const appointmentController = require('../controllers/appointmentController');
const protect = require('../middlewares/protect');
const upload = require('../middlewares/attachmentUpload')

const AppointmentRouter = express.Router();

AppointmentRouter.post('/', protect, upload.array('attachments', 5), appointmentController.createAppointment);
// AppointmentRouter.get('/', protect, appointmentController.getAppointments);
// AppointmentRouter.get('/', protect);
// AppointmentRouter.put('/', protect);
// AppointmentRouter.patch('/', protect);

module.exports = AppointmentRouter;
