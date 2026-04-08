import fs from "fs";
import Media from "../models/mediaModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/mediaHandler.js";

const deleteLocalFile = (url) => {
  if (!url || !url.startsWith("/uploads/media/")) return;
  const filePath = `.${url}`;
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
};

export const createMedia = async (req, res) => {
  try {
    const { type, title, newspaperName, youtubeLink } = req.body;
    if (!type) return errorResponse(res, 400, "Media type is required");

    let mediaItems = [];

    if (req.files?.length) {
      const results = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "janhit_media")),
      );

      mediaItems = results.map((result) => ({
        type,
        title,
        newspaperName: type === "newspaper" ? newspaperName : undefined,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      }));
    } else if (type === "video" && youtubeLink) {
      mediaItems.push({ type, title, url: youtubeLink });
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
    const filter = {};
    if (req.query.type) filter.type = req.query.type;

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

    const file = req.file || req.files?.[0];

    if (file) {
      if (media.publicId) {
        await deleteFromCloudinary([media]);
      } else {
        deleteLocalFile(media.url);
      }

      const result = await uploadToCloudinary(file, "janhit_media");
      media.url = result.secure_url;
      media.publicId = result.public_id;
      media.resourceType = result.resource_type;
    } else if (media.type === "video" && youtubeLink) {
      if (media.publicId) await deleteFromCloudinary([media]);
      else deleteLocalFile(media.url);

      media.publicId = undefined;
      media.resourceType = undefined;
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

    if (media.publicId) await deleteFromCloudinary([media]);
    else deleteLocalFile(media.url);

    await media.deleteOne();
    return successResponse(res, 200, "Media deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete media failed", error.message);
  }
};
