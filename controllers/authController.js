import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import crypto from "crypto";
import { User, Instance, Challan } from "../models/reqmodel.js";

/* HELPER FUNCTIONS */
const createSendToken = (user, statusCode, req, res) => {
  const token = jwt.sign({ id: user._id }, process.env.JWT_TOKEN_SECRET, {
    expiresIn: process.env.JWT_TOKEN_EXPIRES_IN,
  });

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    secure: true, // if 'true' it ensures that cookie is sent only on an encrypted connection i.e. https // change it in production
    httpOnly: true, // this ensures that cookie is not accessed or modified by the browser
    sameSite: "none", // Allow cross-site requests
  };

  res.cookie("jwt", token, cookieOptions);
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

/* REGISTERING A USER */
export const register = async (req, res) => {
  try {
    const {
      name,
      phoneNumber,
      uniqueKey,
      password,
      address,
      email,
      emergencyContacts,
    } = req.body;

    // Validate that emergencyContacts is provided
    if (
      !emergencyContacts ||
      !Array.isArray(emergencyContacts) ||
      emergencyContacts.length === 0
    ) {
      return res.status(400).json({
        status: "failure",
        message: "Emergency contacts are required.",
      });
    }

    const salt = await bcrypt.genSalt();
    const passwordHash = await bcrypt.hash(password, salt);
    // Create the new user
    const newUser = await User({
      name,
      email,
      password: passwordHash,
      address,
      uniqueKey,
      phoneNumber,
      emergencyContacts,
    });

    const savedUser = await newUser.save();

    // Send the response with the token
    createSendToken(savedUser, 200, req, res);
  } catch (err) {
    res.status(500).json({ status: "failure", error: err.message });
  }
};

/* LOGGING IN A USER */
export const login = async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ msg: "Enter data..." });
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ msg: "User not found..." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials..." });
    }

    createSendToken(user, 200, req, res);
  } catch (err) {
    res.status(500).json({
      status: "failure",
      message: err.message,
    });
  }
};

/* LOGGING OUT A USER */
export const logout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, secure: true, sameSite: "None" });
  res.status(200).json({
    status: "success",
  });
};

/* CHECKING IF A USER IS LOGGED IN */
export const protect = async (req, res, next) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({ status: "failed", msg: "Unauthorized" });
    }

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_TOKEN_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ status: "failed", msg: "Unauthorized" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ status: "failed", msg: "Unauthorized" });
  }
};

/* CHECK IF COOKIE IS CORRECT */
export const checkAuth = async (req, res) => {
  try {
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(200).json({ status: "failed", msg: "Login first..." });
    }

    const decoded = await promisify(jwt.verify)(
      token,
      process.env.JWT_TOKEN_SECRET
    );

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(200).json({
        status: "failed",
        msg: "User does not exist. Sign up first...",
      });
    }

    res.status(200).json({
      status: "success",
      msg: "Authorized",
    });
  } catch (err) {
    res.status(200).json({ status: "failed", msg: "Unauthorized" });
  }
};
