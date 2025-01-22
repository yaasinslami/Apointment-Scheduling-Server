const bull = require('bull');
const dotenv = require('dotenv');
const mailgun = require('mailgun-js');
const moment = require('moment');

dotenv.config();

const emailQueue = new bull('emailQueue', process.env.REDIS_URL || 'redis://localhost:6379');

const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
});

emailQueue.process(async (job) => {
    const { emailData } = job.data;

    const data = {
        from: process.env.EMAIL_FROM,
        to: emailData.email,
        subject: emailData.subject,
        html: emailData.html,
    };

    try {
        await mg.messages().send(data);
        console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Email sent to: ${emailData.email}, Subject: ${emailData.subject}`);
    } catch (error) {
        console.error(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Failed to send email to: ${emailData.email}, Error: ${error.message}`);
        throw error;
    }
});

emailQueue.on('completed', (job) => {
    console.log(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Job with id ${job.id} has been completed. Email was sent successfully.`);
});

emailQueue.on('failed', (job, error) => {
    console.error(`[${moment().format('YYYY-MM-DD HH:mm:ss')}] Job with id ${job.id} failed. Error: ${error.message}`);
});

module.exports = emailQueue;
