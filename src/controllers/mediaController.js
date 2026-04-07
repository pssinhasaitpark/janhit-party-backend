import Media from "../models/mediaModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";

// Helper to delete uploaded files
const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = `.${file.url}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

export const createMedia = async (req, res) => {
  try {
    const { type, title, newspaperName, youtubeLink } = req.body;

    if (!type) return errorResponse(res, 400, "Media type is required");

    let mediaItems = [];

    if (req.files && req.files.length > 0) {
      // For uploaded photos/videos
      mediaItems = req.files.map((file) => ({
        type,
        title,
        newspaperName: type === "newspaper" ? newspaperName : undefined,
        url: `/uploads/media/${file.filename}`,
      }));
    } else if (type === "video" && youtubeLink) {
      // For YouTube videos
      mediaItems.push({
        type,
        title,
        url: youtubeLink,
      });
    } else {
      return errorResponse(
        res,
        400,
        "No files uploaded or YouTube link provided",
      );
    }

    const media = await Media.insertMany(mediaItems);

    return successResponse(res, 201, "Media added successfully", media);
  } catch (error) {
    return errorResponse(res, 500, "Create media failed", error.message);
  }
};

export const getAllMedia = async (req, res) => {
  try {
    const { type } = req.query;
    let filter = {};
    if (type) filter.type = type;

    const media = await Media.find(filter).sort({ createdAt: -1 });
    return successResponse(res, 200, "Media fetched successfully", media);
  } catch (error) {
    return errorResponse(res, 500, "Fetch media failed", error.message);
  }
};

export const getMediaById = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return errorResponse(res, 404, "Media not found");
    return successResponse(res, 200, "Media fetched successfully", media);
  } catch (error) {
    return errorResponse(res, 500, "Fetch media failed", error.message);
  }
};

export const updateMedia = async (req, res) => {
  try {
    const { title, newspaperName, youtubeLink } = req.body;

    const media = await Media.findById(req.params.id);
    if (!media) return errorResponse(res, 404, "Media not found");

    if (req.files && req.files.length > 0) {
      // Delete old file if exists
      if (!media.url.startsWith("http")) deleteFiles([media]);
      media.url = `/uploads/media/${req.files[0].filename}`;
    } else if (media.type === "video" && youtubeLink) {
      media.url = youtubeLink;
    }

    if (title) media.title = title;
    if (newspaperName) media.newspaperName = newspaperName;

    await media.save();
    return successResponse(res, 200, "Media updated successfully", media);
  } catch (error) {
    return errorResponse(res, 500, "Update media failed", error.message);
  }
};

export const deleteMedia = async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return errorResponse(res, 404, "Media not found");

    if (!media.url.startsWith("http")) deleteFiles([media]);

    await media.deleteOne();
    return successResponse(res, 200, "Media deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete media failed", error.message);
  }
};
