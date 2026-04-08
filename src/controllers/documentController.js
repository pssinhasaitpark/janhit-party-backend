import Document from "../models/documentModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import streamifier from "streamifier";

// 🔹 Upload document to Cloudinary
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Invalid file: buffer is missing"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "documents",
        resource_type: "raw",
        type: "upload",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// 🔹 Delete from Cloudinary
const deleteFromCloudinary = async (public_id) => {
  if (public_id) {
    await cloudinary.uploader.destroy(public_id, {
      resource_type: "raw",
    });
  }
};

export const createDocument = async (req, res) => {
  try {
    const { title, description, category } = req.body;

    if (!title || !req.file) {
      return errorResponse(res, 400, "Title and file required");
    }

    const result = await uploadToCloudinary(req.file);

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

    if (!doc) {
      return errorResponse(res, 404, "Document not found");
    }

    return successResponse(res, 200, "Document fetched successfully", doc);
  } catch (error) {
    return errorResponse(res, 500, "Fetch document failed", error.message);
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return errorResponse(res, 404, "Document not found");
    }

    await deleteFromCloudinary(doc.public_id);

    await doc.deleteOne();

    return successResponse(res, 200, "Document deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete document failed", error.message);
  }
};
