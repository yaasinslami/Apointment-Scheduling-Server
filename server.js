// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const AuthRouter = require('./routes/auth');
const ServiceRouter = require('./routes/service');
const GoogleAuth = require('./routes/Google_OAuth');
const AppointmentRouter = require('./routes/appointment');
const protect = require('./middlewares/protect');

require('./config/passport');
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(cookieParser());


const PORT = process.env.PORT || 3000;

connectDB();

app.use('/api/auth', AuthRouter);
app.use('/api/services', ServiceRouter);
app.use('/api/appointments', AppointmentRouter);
app.use('/api', GoogleAuth);


app.get('/home', protect, (req, res) => {
  res.send(`Welcome to your appointments scheduler app, ${req.user.name}!`);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
