import Document from "../models/documentModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";

export const createDocument = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !req.file)
      return errorResponse(res, 400, "Title and file required");

    const doc = await Document.create({
      title,
      description,
      url: `/uploads/documents/${req.file.filename}`,
    });

    return successResponse(res, 201, "Document uploaded successfully", doc);
  } catch (error) {
    return errorResponse(res, 500, "Document upload failed", error.message);
  }
};

// export const getAllDocuments = async (req, res) => {
//   try {
//     const docs = await Document.find().sort({ createdAt: -1 });
//     return successResponse(res, 200, "Documents fetched successfully", docs);
//   } catch (error) {
//     return errorResponse(res, 500, "Fetch documents failed", error.message);
//   }
// };

export const getAllDocuments = async (req, res) => {
  try {
    const { category, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    // Filter by category if provided
    if (category) filter.category = category;

    // Search by title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Document.countDocuments(filter);

    const docs = await Document.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, "Documents fetched successfully", {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      documents: docs,
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

    // Delete the file from local storage
    const filePath = `.${doc.url}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await doc.deleteOne();
    return successResponse(res, 200, "Document deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete document failed", error.message);
  }
};
