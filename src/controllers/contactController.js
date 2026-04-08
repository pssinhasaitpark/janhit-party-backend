import Contact from "../models/contactModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";

export const createContact = async (req, res) => {
  try {
    const { name, mobile, subject, message } = req.body;

    if (!name || !mobile || !message) {
      return errorResponse(res, 400, "All required fields must be provided");
    }

    const contact = await Contact.create({
      name,
      mobile,
      subject,
      message,
    });

    return successResponse(res, 201, "Message sent successfully", contact);
  } catch (error) {
    return errorResponse(res, 500, "Create contact failed", error.message);
  }
};

export const getAllContacts = async (req, res) => {
  try {
    const { isResolved, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    if (isResolved !== undefined) {
      filter.isResolved = isResolved === "true";
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { subject: { $regex: search, $options: "i" } },
        { message: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Contact.countDocuments(filter);

    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, "Contacts fetched successfully", {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      contacts,
    });
  } catch (error) {
    return errorResponse(res, 500, "Fetch contacts failed", error.message);
  }
};

export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return errorResponse(res, 404, "Contact not found");

    return successResponse(res, 200, "Contact fetched successfully", contact);
  } catch (error) {
    return errorResponse(res, 500, "Fetch contact failed", error.message);
  }
};

export const resolveContact = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) return errorResponse(res, 404, "Contact not found");

    contact.isResolved = true;
    await contact.save();

    return successResponse(res, 200, "Contact marked as resolved", contact);
  } catch (error) {
    return errorResponse(res, 500, "Update failed", error.message);
  }
};

export const deleteContact = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) return errorResponse(res, 404, "Contact not found");

    return successResponse(res, 200, "Contact deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete failed", error.message);
  }
};
