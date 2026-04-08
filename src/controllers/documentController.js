import Document from "../models/documentModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/mediaHandler.js";

export const createDocument = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !req.file) {
      return errorResponse(res, 400, "Title and file are required");
    }

    const result = await uploadToCloudinary(req.file, "documents", "raw");

    const doc = await Document.create({
      title,
      description,
      category,
      url: result.secure_url,
      public_id: result.public_id,
    });

    return successResponse(res, 201, "Document uploaded successfully", doc);
  } catch (error) {
    return errorResponse(res, 500, "Document upload failed", error.message);
  }
};

export const getAllDocuments = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let filter = {};
    if (category) filter.category = category;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Document.countDocuments(filter);

    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, "Documents fetched successfully", {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      documents,
    });
  } catch (error) {
    return errorResponse(res, 500, "Fetch documents failed", error.message);
  }
};

export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return errorResponse(res, 404, "Document not found");

    return successResponse(res, 200, "Document fetched successfully", doc);
  } catch (error) {
    return errorResponse(res, 500, "Fetch document failed", error.message);
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return errorResponse(res, 404, "Document not found");

    await deleteFromCloudinary([{ public_id: doc.public_id, type: "raw" }]);

    await doc.deleteOne();
    return successResponse(res, 200, "Document deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete document failed", error.message);
  }
};
