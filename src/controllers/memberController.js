import Member from "../models/memberSchema.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { sendWelcomeEmail } from "../utils/emailService.js";

export const createMember = async (req, res) => {
  try {
    const { name, email, mobile, city, agreedToPolicy } = req.body;

    if (!name || !email || !mobile || !city || !agreedToPolicy) {
      return errorResponse(res, 400, "All fields are required");
    }

    const existingMember = await Member.findOne({ email });
    if (existingMember) {
      return errorResponse(res, 400, "Email already registered");
    }

    const member = await Member.create({
      name,
      email,
      mobile,
      city,
      agreedToPolicy,
    });

    await sendWelcomeEmail(email, name);

    return successResponse(res, 201, "Member registered successfully", member);
  } catch (error) {
    return errorResponse(res, 500, "Member registration failed", error.message);
  }
};

export const getAllMembers = async (req, res) => {
  try {
    const members = await Member.find().sort({ createdAt: -1 });
    return successResponse(res, 200, "Members fetched successfully", members);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch members", error.message);
  }
};

export const getMemberById = async (req, res) => {
  try {
    const member = await Member.findById(req.params.id);
    if (!member) return errorResponse(res, 404, "Member not found");

    return successResponse(res, 200, "Member fetched successfully", member);
  } catch (error) {
    return errorResponse(res, 500, "Failed to fetch member", error.message);
  }
};

export const updateMember = async (req, res) => {
  try {
    const { name, email, mobile, city, agreedToPolicy } = req.body;

    const updateData = { name, email, mobile, city, agreedToPolicy };

    const member = await Member.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!member) return errorResponse(res, 404, "Member not found");

    return successResponse(res, 200, "Member updated successfully", member);
  } catch (error) {
    return errorResponse(res, 500, "Failed to update member", error.message);
  }
};

export const deleteMember = async (req, res) => {
  try {
    const member = await Member.findByIdAndDelete(req.params.id);
    if (!member) return errorResponse(res, 404, "Member not found");

    return successResponse(res, 200, "Member deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Failed to delete member", error.message);
  }
};
