import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import sendEmail from "../utils/sendEmail.js";

const buildAuthResponse = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  profileImage: user.profileImage || "",
  token: generateToken(user._id),
});

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, profileImage } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const userExists = await User.findOne({ email: normalizedEmail });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      profileImage: profileImage || "",
    });

    return res.status(201).json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message || "Registration failed" });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    const normalizedPassword = password.trim();

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let isPasswordValid = false;

    if (user.password?.startsWith("$2")) {
      isPasswordValid = await bcrypt.compare(normalizedPassword, user.password);
    } else {
      // Support legacy accounts that may still have unhashed passwords stored.
      isPasswordValid = normalizedPassword === String(user.password || "").trim();

      if (isPasswordValid) {
        user.password = await bcrypt.hash(normalizedPassword, 10);
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    user.lastSeen = new Date();
    await user.save();

    return res.json(buildAuthResponse(user));
  } catch (error) {
    return res.status(500).json({ message: error.message || "Login failed" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const resetUrl = `${frontendBaseUrl.replace(/\/$/, "")}/reset-password/${resetToken}`;
    const emailResult = await sendEmail({
      to: user.email,
      subject: "HireHub password reset",
      text: `Reset your password using this link: ${resetUrl}`,
      html: `<p>Reset your password using this link:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });

    return res.json({
      message: emailResult.skipped
        ? "Password reset link generated. SMTP is not configured, so email was skipped."
        : "Password reset link sent to your email.",
      resetUrl,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to send reset email" });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Reset failed" });
  }
};
