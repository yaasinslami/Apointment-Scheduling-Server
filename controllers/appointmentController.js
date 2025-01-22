const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Service = require('../models/Service');

// create a new appointment
exports.createAppointment = async (req, res) => {
    try {
        const { client, provider, service, servicePrice, appointmentDate, location, additionalInfo, attachment_passed } = req.body;
        let attachments = [];

        if (!client || !provider || !service || !servicePrice || !appointmentDate || !location) {
            return res.status(400).json({
                error: 'All required fields (client, provider, service, servicePrice, appointmentDate, location) must be provided.'
            });
        }

        if (attachment_passed === 'true') {
            attachments = req.files.map(file => file.path);
        }

        // Validate data types
        if (typeof servicePrice !== 'number' || servicePrice <= 0) {
            return res.status(400).json({
                error: 'Service price must be a positive number.'
            });
        }

        if (typeof location !== 'string') {
            return res.status(400).json({
                error: 'Location must be a string.'
            });
        }

        if (additionalInfo && typeof additionalInfo !== 'string') {
            return res.status(400).json({
                error: 'Additional info must be a string if provided.'
            });
        }

        if (attachments && (!Array.isArray(attachments) || attachments.some(file => typeof file !== 'string'))) {
            return res.status(400).json({
                error: 'Attachments must be an array of strings representing file paths.'
            });
        }

        // Validate that the appointment date is in the future
        const appointmentDateObj = new Date(appointmentDate);
        if (isNaN(appointmentDateObj.getTime()) || appointmentDateObj <= Date.now()) {
            return res.status(400).json({
                error: 'Appointment date must be a valid future date.'
            });
        }

        // Check if client and provider are valid users
        const clientUser = await User.findById(client);
        const providerUser = await User.findById(provider);

        if (!clientUser) {
            return res.status(404).json({ error: 'Client user not found.' });
        }
        if (!providerUser) {
            return res.status(404).json({ error: 'Provider user not found.' });
        }

        // Check if service exists
        const serviceData = await Service.findById(service);
        if (!serviceData) {
            return res.status(404).json({ error: 'Service not found.' });
        }

        // Ensure service price matches the service data
        if (serviceData.price !== servicePrice) {
            return res.status(400).json({
                error: 'Provided service price does not match the actual service price.'
            });
        }

        const newAppointmentStart = appointmentDateObj;
        const newAppointmentEnd = new Date(newAppointmentStart.getTime() + (serviceData.duration * 60000) + (serviceData.preparationTime * 60000)); // Convert minutes to milliseconds

        console.log(newAppointmentStart);
        console.log(newAppointmentEnd);

        // Check if the service already has an appointment at the given time
        const appointmentExists = serviceData.appointments.some(app => {
            const appStartDate = new Date(app.appointmentDate);
            const appEndDate = new Date(appStartDate.getTime() + (serviceData.duration * 60000) + (serviceData.preparationTime * 60000)); // Convert minutes to milliseconds

            // Check for intersection
            return (newAppointmentStart < appEndDate && newAppointmentEnd > appStartDate);
        });

        if (appointmentExists) {
            console.log("Here !!!");
            return res.status(400).json({
                error: 'This service is already booked for the selected date and time.'
            });
        }


        // Create the new appointment
        const newAppointment = new Appointment({
            client,
            provider,
            service,
            servicePrice,
            appointmentDate,
            location,
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

// list all the appointments for a user (client or provider)
exports.getAppointments = async (req, res) => {
    const { userId } = req.user;

    try {
        const user = await User({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // Get all appointments for the user
        const appointments = await Appointment.find({ $or: [{ client: userId }, { provider: userId }] });
        if (!appointments) {
            return res.status(404).json({ error: 'No appointments found for this user.' });
        }

        return res.status(200).json({ appointments });
    }
    catch (error) {
        console.error('Error getting appointments:', error);
        return res.status(500).json({
            error: 'An error occurred while getting the appointments. Please try again later.'
        });
    }
};

// get details of a specific appointment
exports.getAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    const { userId } = req.user;

    try {

        const user = await User({ _id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found.' });
        }

        // check if the user is the client or the provider of the appointment
        const appointment = await Appointment.findOne({ _id: appointmentId, $or: [{ client: userId }, { provider: userId }] });

        if (!appointment) {
            return res.status(404).json({ error: 'Appointment not found.' });
        }

        return res.status(200).json({ appointment });
    }
    catch (error) {
        console.error('Error getting appointment:', error);
        return res.status(500).json({
            error: 'An error occurred while getting the appointment. Please try again later.'
        });
    }
}
