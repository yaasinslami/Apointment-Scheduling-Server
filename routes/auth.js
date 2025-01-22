 // auth routes

const express = require('express');
const authController = require('../controllers/authController');
const protect = require('../middlewares/protect');

const AuthRouter = express.Router();

AuthRouter.post('/login', authController.login);
AuthRouter.post('/verify-otp', authController.verifyOtp);
AuthRouter.post('/resend-otp', authController.resendOtp);
AuthRouter.post('/signup', authController.signup);
AuthRouter.post('/forgot-password', authController.forgotPassword);
AuthRouter.patch('/reset-password/:token', authController.resetPassword);
AuthRouter.post('/logout', protect, authController.logout);

module.exports = AuthRouter;
