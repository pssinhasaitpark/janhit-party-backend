import User from "../models/userModel.js";
import jwt from "jsonwebtoken";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return errorResponse(res, 400, "All fields are required");
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return errorResponse(res, 400, "Email already in use");
    }

    const newUser = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    const userResponse = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
    };

    return successResponse(res, 201, "User registered successfully", {
      user: userResponse,
    });
  } catch (error) {
    return errorResponse(res, 500, "Registration failed", error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, "Email and password are required");
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return errorResponse(res, 400, "Invalid email or password");
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return errorResponse(res, 400, "Invalid email or password");
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "7d",
      },
    );
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    return successResponse(res, 200, "User logged in successfully", {
      user: userResponse,
      token,
    });
  } catch (error) {
    return errorResponse(res, 500, "Login failed", error.message);
  }
};
