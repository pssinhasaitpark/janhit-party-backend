import fs from "fs";
import Media from "../models/mediaModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import streamifier from "streamifier";

const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Invalid file: buffer is missing"));
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "janhit_media",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(uploadStream);
  });
};

const destroyCloudinaryAsset = async (publicId, resourceType = "auto") => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  } catch (error) {
    console.error("Cloudinary delete failed:", error.message || error);
  }
};

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

    if (req.files && req.files.length > 0) {
      const uploadResults = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file)),
      );

      mediaItems = uploadResults.map((result) => ({
        type,
        title,
        newspaperName: type === "newspaper" ? newspaperName : undefined,
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type,
      }));
    } else if (type === "video" && youtubeLink) {
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

    const file = req.file || (req.files && req.files[0]);

    if (file) {
      if (media.publicId) {
        await destroyCloudinaryAsset(media.publicId, media.resourceType);
      } else {
        deleteLocalFile(media.url);
      }
      const result = await uploadToCloudinary(file);
      media.url = result.secure_url;
      media.publicId = result.public_id;
      media.resourceType = result.resource_type;
    } else if (media.type === "video" && youtubeLink) {
      if (media.publicId) {
        await destroyCloudinaryAsset(media.publicId, media.resourceType);
      } else {
        deleteLocalFile(media.url);
      }
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

    if (media.publicId) {
      await destroyCloudinaryAsset(media.publicId, media.resourceType);
    } else {
      deleteLocalFile(media.url);
    }

    await media.deleteOne();
    return successResponse(res, 200, "Media deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete media failed", error.message);
  }
};
