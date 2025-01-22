const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const dotenv = require("dotenv");
const User = require("../models/User");
const { getAsync, setExAsync, delAsync } = require("../config/cache");
const emailqueue = require("../workers/emailqueue");
const otpEmailTemplate = require("../templates/otpTemplate");
const resetPasswordEmailTemplate = require("../templates/resetPwd");

dotenv.config();

// JWT Signing function
const signToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// signup a new user
exports.signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirm, role, location } = req.body;

    if (!name || !email || !password || !passwordConfirm || !role) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide all required fields",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    // Role validation (ensure only allowed roles can be registered)
    const allowedRoles = ["client", "provider", "admin"];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid role. Allowed roles are client, provider, admin",
      });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        status: "fail",
        message: "User with this email already exists",
      });
    }

    // Create the new user
    const user = await User.create({
      name,
      email,
      password,
      role,
      location,
    });

    // Send OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000);
    const emailData = {
      email: user.email,
      subject: "Verify your Email",
      html: otpEmailTemplate(otp),
    };
    await emailqueue.add({ emailData });

    // Save OTP in Redis for 5 minutes
    await setExAsync(`otp_${user.email}`, 60 * 5, String(otp));

    res.status(201).json({
      status: "success",
      message: "User registered successfully, OTP sent to email",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// resendOtp to email if the otp expired or not received
exports.resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Missing email"
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User Not found",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        status: "fail",
        message: "Email already verified",
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000);
    const emailData = {
      email: user.email,
      subject: "Verify your Email",
      html: otpEmailTemplate(otp),
    };

    await emailqueue.add({ emailData });

    // Save OTP in Redis for 5 minutes
    await setExAsync(`otp_${user.email}`, 60 * 5, String(otp));

    return res.status(200).json({
      status: "success",
      message: "Otp resent successfully, check your email",
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// login route for existing verfied users
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide an email",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "Incorrect email or password",
      });
    }

    if (!user.emailVerified) {
      return res.status(401).json({
        status: "fail",
        message: "Please verify your email first",
      });
    }

    // Skip password check for Google-authenticated users
    if (!user.googleId) {
      if (!password || !(await user.matchPassword(password))) {
        return res.status(401).json({
          status: "fail",
          message: "Incorrect email or password",
        });
      }
    }

    // Sign JWT token with user ID and role
    const token = signToken(user._id, user.role);

    // Save token in Redis for 4 hours
    await setExAsync(`auth_${user._id}`, 60 * 60 * 4, token);

    res.status(200).json({
      status: "success",
      message: "User logged in successfully",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      status: "fail",
      message: error.message,
    });
  }
};

// OTP Verification function
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and OTP",
      });
    }

    // Check OTP in Redis
    const storedOtp = await getAsync(`otp_${email}`);
    if (!storedOtp || storedOtp !== otp) {
      return res.status(401).json({
        status: "fail",
        message: "Invalid or expired OTP",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email",
      });
    }

    // Update user emailVerified status
    user.emailVerified = true;
    await user.save({ validateBeforeSave: false });

    // Remove OTP from Redis after successful verification
    await delAsync(`otp_${email}`);

    res.status(200).json({
      status: "success",
      message: "User verified successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Forgot Password function
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide an email",
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: "fail",
        message: "User not found",
      });
    }

    // Create password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get("host")}/api/auth/reset-password/${resetToken}`;
    const emailData = {
      email: user.email,
      subject: "Reset your password",
      html: resetPasswordEmailTemplate(resetUrl),
    };
    await emailqueue.add({ emailData });

    res.status(200).json({
      status: "success",
      message: "Password reset email sent successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Reset Password function
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { email, password, passwordConfirm } = req.body;

    // Validate input
    if (!email || !password || !passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide email and both password and passwordConfirm",
      });
    }

    if (password !== passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message: "Passwords do not match",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid email",
      });
    }

    if (!user || !user.compareResetToken(token) || user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid or expired token",
      });
    }


    // Update user password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log user in after password reset
    const newToken = signToken(user._id, user.role);

    // Save token in Redis for 4 hour
    await setExAsync(`auth_${user._id}`, 60 * 60, newToken);

    res.status(200).json({
      status: "success",
      message: "Password reset successfully",
      token: newToken,
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};

// Logout function (removing token from Redis)
exports.logout = async (req, res) => {
  try {
    await delAsync(`auth_${req.user._id}`);
    res.status(200).json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(400).json({
      status: "fail",
      message: error.message,
    });
  }
};
