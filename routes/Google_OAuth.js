const passport = require('passport');
const express = require('express');
const GoogleAuth = express.Router();
const dotenv = require('dotenv');

dotenv.config();

GoogleAuth.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

GoogleAuth.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  (req, res) => {
    const token = req.user.token;

    // console.log(token);

    res.cookie('token', token, {
      httpOnly: true, // Prevents client-side JS from accessing the cookie
      secure: process.env.NODE_ENV === 'production', // Ensures the cookie is sent over HTTPS in production
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    res.redirect('/home');
  }
);

module.exports = GoogleAuth;
