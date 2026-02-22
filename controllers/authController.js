const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const otpStore = {}; // TEMP in-memory store for OTPs (later use DB or Redis);
const Otp = require("../models/Otp");
const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * REGISTER
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, mobile, course } = req.body;

    // 1️⃣ Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required",
      });
    }

    // 2️⃣ Check existing user
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        message: "User already exists with this email",
      });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create user (IGNORE role from frontend)
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      mobile,
      course,
      role: "student", // 🔐 force role
    });

    // 5️⃣ Create token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6️⃣ Send response
    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.sendOtp = async (req, res) => {
  try {
    const { name, email, password, mobile } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    console.log("🔥 GENERATED OTP:", otp);

    await Otp.deleteMany({ email });

    await Otp.create({
  name: req.body.name,
  email: req.body.email,
  password: req.body.password,
  mobile: req.body.mobile,   // ✅ MUST BE HERE
  otp,
  expiresAt: new Date(Date.now() + 5 * 60 * 1000)
});

     await resend.emails.send({
  from: "EarnProjectAcademy <onboarding@resend.dev>",
  to: req.body.email,
  subject: "Your OTP Code",
  html: `<h2>Your OTP is ${otp}</h2>
         <p>This OTP is valid for 5 minutes.</p>`
});

    res.json({ message: "OTP sent successfully" });

  } catch (error) {
    console.error("SEND OTP ERROR:", error);
    res.status(500).json({ message: "Failed to send OTP" });
  }
};

 
exports.verifyOtpAndRegister = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const otpRecord = await Otp.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not found" });
    }

    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otpRecord.expiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already registered" });
    }

    const hashedPassword = await bcrypt.hash(otpRecord.password, 10);

    const user = new User({
      name: otpRecord.name,
      email: otpRecord.email,
      password: hashedPassword,
      mobile: otpRecord.phone
    });

    await user.save();
    await Otp.deleteMany({ email });

    res.json({ message: "User registered successfully" });

  } catch (error) {
    console.error("VERIFY OTP ERROR:", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

/**
 * LOGIN
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1️⃣ Validate request body
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // 2️⃣ Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // 3️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    // 4️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 5️⃣ Send response
    res.status(200).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Login error:", error.message);
    res.status(500).json({
      message: "Server error during login",
    });
  }
};

/**
 * FORGOT PASSWORD
 */




exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "User not found with this email",
      });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    const resetUrl = `http://localhost:3002/reset-password/${resetToken}`;

    // ✉️ Setup transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✉️ Email message
    const message = `
      You requested a password reset.

      Click the link below:
      ${resetUrl}

      This link expires in 15 minutes.
    `;

    await transporter.sendMail({
      from: `"EarnProjectAcademy" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Request",
      text: message,
    });

    res.status(200).json({
      message: "Reset link sent to your email",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const crypto = require("crypto");

    // Hash token from URL
    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired token",
      });
    }

    // Hash new password
    const bcrypt = require("bcryptjs");
    user.password = await bcrypt.hash(req.body.password, 10);

    // Clear reset fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({
      message: "Password reset successful",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};