import Member from "../models/memberSchema.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import { sendWelcomeEmail } from "../utils/emailService.js";

export const createMember = async (req, res) => {
  try {
    const {
      name,
      email,
      mobile,
      city,
      state,
      address,
      age,
      gender,
      occupation,
      agreedToPolicy,
    } = req.body;

    if (!name || !email || !mobile || !city || !state || !gender) {
      return errorResponse(res, 400, "All required fields must be provided");
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
      state,
      address,
      age,
      gender,
      occupation,
      agreedToPolicy,
      approved: false,
    });

    return successResponse(
      res,
      201,
      "Registration successful. Awaiting admin approval.",
      member,
    );
  } catch (error) {
    return errorResponse(res, 500, "Member registration failed", error.message);
  }
};

export const approveMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Member.findById(id);

    if (!member) {
      return errorResponse(res, 404, "Member not found");
    }

    if (member.approved) {
      return errorResponse(res, 400, "Member already approved");
    }

    member.approved = true;
    await member.save();

    await sendWelcomeEmail(member);

    return successResponse(
      res,
      200,
      "Member approved and welcome email sent",
      member,
    );
  } catch (error) {
    return errorResponse(res, 500, "Failed to approve member", error.message);
  }
};

export const getAllMembers = async (req, res) => {
  try {
    const { approved, city, occupation, search } = req.query;

    let filter = {};

    if (approved !== undefined) {
      filter.approved = approved === "true";
    }

    if (city) filter.city = city;
    if (occupation) filter.occupation = occupation;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile: { $regex: search, $options: "i" } },
      ];
    }

    const members = await Member.find(filter).sort({ createdAt: -1 });

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
    const {
      name,
      email,
      mobile,
      city,
      state,
      address,
      age,
      gender,
      occupation,
      agreedToPolicy,
    } = req.body;

    const updateData = {
      name,
      email,
      mobile,
      city,
      state,
      address,
      age,
      gender,
      occupation,
      agreedToPolicy,
    };

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
