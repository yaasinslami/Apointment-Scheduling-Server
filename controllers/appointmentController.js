const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Service = require('../models/Service');

exports.createAppointment = async (req, res) => {
    try {
        const { client, provider, service, servicePrice, appointmentDate, additionalInfo, attachment_passed } = req.body;
        let attachments = [];

        if (!client || !provider || !service || !servicePrice || !appointmentDate) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide all required fields.'
            });
        }

        if (attachment_passed === 'true') {
            attachments = req.files.map(file => file.path);
        }

        if (typeof servicePrice !== 'number' || servicePrice <= 0) {
            return res.status(400).json({
                status: 'error',
                message: 'Service price must be a positive number.'
            });
        }

        if (additionalInfo && typeof additionalInfo !== 'string') {
            return res.status(400).json({
                status: 'error',
                message: 'Additional info must be a string.'
            });
        }

        if (attachments && (!Array.isArray(attachments) || attachments.some(file => typeof file !== 'string'))) {
            return res.status(400).json({
                status: 'error',
                message: 'Attachments must be an array of strings.'
            });
        }

        // Validate that the appointment date is in the future
        const appointmentDateObj = new Date(appointmentDate);
        if (isNaN(appointmentDateObj.getTime()) || appointmentDateObj <= Date.now()) {
            return res.status(400).json({
                status: 'error',
                message: 'Appointment date must be a valid date in the future.'
            });
        }

        // Check if client and provider are valid users
        const clientUser = await User.findById(client);
        const providerUser = await User.findById(provider);

        if (!clientUser) {
            return res.status(404).json({
                status: 'error',
                message: 'Client user not found.'
            });
        }
        if (!providerUser) {
            return res.status(404).json({
                status: 'error',
                message: 'Provider user not found.'
            });
        }

        // Check if service exists
        const serviceData = await Service.findById(service);
        if (!serviceData) {
            return res.status(404).json({
                status: 'error',
                message: 'Service not found.'
            });
        }

        // Ensure service price matches the service data
        if (serviceData.price !== servicePrice) {
            return res.status(400).json({
                status: 'error',
                message: 'Service price does not match the service data.'
            });
        }

        const newAppointmentStart = appointmentDateObj;
        const newAppointmentEnd = new Date(newAppointmentStart.getTime() + (serviceData.duration * 60000) + (serviceData.preparationTime * 60000));

        // Check if the service already has an appointment at the given time
        const appointmentExists = serviceData.appointments.some(app => {
            const appStartDate = new Date(app.appointmentDate);
            const appEndDate = new Date(appStartDate.getTime() + (serviceData.duration * 60000) + (serviceData.preparationTime * 60000));

            return (newAppointmentStart < appEndDate && newAppointmentEnd > appStartDate);
        });

        if (appointmentExists) {
            return res.status(400).json({
                status: 'error',
                message: 'This service is already booked for the selected date and time.'
            });
        }

        // Create the new appointment
        const newAppointment = new Appointment({
            client,
            provider,
            service,
            servicePrice,
            appointmentDate,
            additionalInfo: additionalInfo || '',
            attachments: attachments || []
        });

        const savedAppointment = await newAppointment.save();

        // Add the appointment to the service's appointment list
        serviceData.appointments.push({
            appointmentDate: newAppointment.appointmentDate,
            appointmentId: savedAppointment._id
        });

        // Save the updated service data
        await serviceData.save();

        return res.status(201).json({
            message: 'Appointment created successfully.',
            appointment: savedAppointment
        });
    } catch (error) {
        console.error('Error creating appointment:', error);
        return res.status(500).json({
            error: 'An error occurred while creating the appointment. Please try again later.'
        });
    }
};

exports.getAppointments = async (req, res) => {
    const { userId } = req.user;

    try {
        const user = await User({ _id: userId });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found.'
            });
        }

        const appointments = await Appointment.find({ client: userId });
        if (!appointments) {
            return res.status(404).json({
                status: 'error',
                message: 'No appointments found.'
            });
        }

        return res.status(200).json({
            status: 'success',
            appointments
        });
    }
    catch (error) {
        console.error('Error getting appointments:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while getting the appointments. Please try again later.'
        });
    }
};

exports.getAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { userId } = req.user;

    try {

        const user = await User({ _id: userId });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found.'
            });
        }

        const appointment = await Appointment.findOne({ _id: appointmentId, client: userId });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found.'
            });
        }

        return res.status(200).json({
            status: 'success',
            appointment
        });
    }
    catch (error) {
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while getting the appointment. Please try again later.'
        });
    }
}

exports.updateAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { userId } = req.user;
    const { client, provider, service, servicePrice, appointmentDate, additionalInfo, attachment_passed } = req.body;
    let attachments = [];

    try {
        const user = await User({ _id: userId });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found.'
            });
        }

        const appointment = await Appointment.findOne({ _id: appointmentId, client: userId });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found.'
            });
        }

        if (client && client !== appointment.client) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not allowed to change the client of the appointment.'
            });
        }

        if (provider && provider !== appointment.provider) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not allowed to change the provider of the appointment'
            });
        }

        if (service && service !== appointment.service) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not allowed to change the service of the appointment.',
            });
        }

        if (servicePrice && servicePrice !== appointment.servicePrice) {
            return res.status(403).json({
                status: 'error',
                message: 'You are not allowed to change the service price of the appointment.'
            });
        }

        if (appointmentDate) {
            const serviceData = await Service.findById(appointment.service);
            if (!serviceData) {
                return res.status(404).json({
                    status: 'error',
                    message: 'Service not found.'
                });
            }
            const newAppointmentStart = new Date(appointmentDate);
            const newAppointmentEnd = new Date(newAppointmentStart.getTime() + (serviceData.duration * 60000) + (appointment.serviceData.preparationTime * 60000));

            const appointmentExists = serviceData.appointments.some(app => {
                const appStartDate = new Date(app.appointmentDate);
                const appEndDate = new Date(appStartDate.getTime() + (serviceData.duration * 60000) + (appointment.serviceData.preparationTime * 60000));

                return (newAppointmentStart < appEndDate && newAppointmentEnd > appStartDate);
            });

            if (appointmentExists) {
                return res.status(400).json({
                    status: 'error',
                    message: 'This service is already booked for the selected date and time.'
                });
            }

            serviceData.appointments = serviceData.appointments.filter(app => app.appointmentId !== appointmentId);
            serviceData.appointments.push({
                appointmentDate: newAppointmentStart,
                appointmentId: appointmentId
            });
            appointment.appointmentDate = appointmentDate;
        }

        if (additionalInfo) {
            appointment.additionalInfo = additionalInfo;
        }

        if (attachment_passed === 'true') {
            attachments = req.files.map(file => file.path);
            appointment.attachments = attachments;
        }

        const updatedAppointment = await appointment.save();

        return res.status(200).json({
            status: 'success',
            message: 'Appointment updated successfully.',
            appointment: updatedAppointment
        });
    }
    catch (error) {
        console.error('Error updating appointment:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while updating the appointment. Please try again later.'
        });
    }
};

exports.deleteAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { userId } = req.user;

    try {
        const user = await User({ _id: userId });
        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found.'
            });
        }

        const appointment = await Appointment.findOne({ _id: appointmentId, client: userId });

        if (!appointment) {
            return res.status(404).json({
                status: 'error',
                message: 'Appointment not found.'
            });
        }

        const service = await Service.findOne({ _id: appointment.service });

        if (!service) {
            return res.status(404).json({
                status: 'error',
                message: 'Service not found.'
            });
        }

        service.appointments = service.appointments.filter(app => app.appointmentId !== appointmentId);

        await service.save();
        await appointment.delete();

        return res.status(200).json({
            status: 'success',
            message: 'Appointment deleted successfully.'
        });
    }
    catch (error) {
        console.error('Error deleting appointment:', error);
        return res.status(500).json({
            status: 'error',
            message: 'An error occurred while deleting the appointment. Please try again later.'
        });

    }
};
