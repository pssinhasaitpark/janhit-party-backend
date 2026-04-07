import NewsTicker from "../models/newsTickerSchema.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";
import path from "path";

export const createNewsTicker = async (req, res) => {
  try {
    const { title, description, category, order, isActive } = req.body;
    if (!category || !req.files || req.files.length === 0) {
      return errorResponse(
        res,
        400,
        "Category and at least one media file are required",
      );
    }

    const videoExtensions = [".mp4", ".mov", ".avi", ".mkv"];

    // Support uploading many files at once. Apply same category/order/isActive to all.
    const items = req.files.map((file, idx) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const mediaType = videoExtensions.includes(ext) ? "video" : "image";

      return {
        imageUrl: `/uploads/media/${file.filename}`,
        mediaType,
        title: Array.isArray(title)
          ? title[idx] || file.originalname
          : title || file.originalname,
        description: Array.isArray(description)
          ? description[idx]
          : description,
        category,
        order: order ? Number(order) : 0,
        isActive: isActive !== undefined ? isActive : true,
      };
    });

    const newsItems = await NewsTicker.insertMany(items);
    return successResponse(res, 201, "News ticker items created", newsItems);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to create news ticker items",
      error.message,
    );
  }
};

export const getAllNewsTicker = async (req, res) => {
  try {
    const { category, isActive, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    // Filter by category
    if (category) filter.category = category;

    // Filter by active status
    if (isActive !== undefined) filter.isActive = isActive === "true";

    // Search by title or description
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await NewsTicker.countDocuments(filter);

    const news = await NewsTicker.find(filter)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, "News ticker items fetched", {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      news,
    });
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to fetch news ticker items",
      error.message,
    );
  }
};

export const getNewsTickerById = async (req, res) => {
  try {
    const news = await NewsTicker.findById(req.params.id);
    if (!news) return errorResponse(res, 404, "News ticker item not found");
    return successResponse(res, 200, "News ticker item fetched", news);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to fetch news ticker item",
      error.message,
    );
  }
};

export const updateNewsTicker = async (req, res) => {
  try {
    const { title, description, category, order, isActive } = req.body;
    let updateData = { title, description, category, order, isActive };

    if (req.file) {
      updateData.imageUrl = `/uploads/media/${req.file.filename}`;
      const ext = path.extname(req.file.originalname).toLowerCase();
      const videoExtensions = [".mp4", ".mov", ".avi", ".mkv"];
      updateData.mediaType = videoExtensions.includes(ext) ? "video" : "image";
    }

    const news = await NewsTicker.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!news) return errorResponse(res, 404, "News ticker item not found");

    return successResponse(res, 200, "News ticker item updated", news);
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to update news ticker item",
      error.message,
    );
  }
};

export const deleteNewsTicker = async (req, res) => {
  try {
    const news = await NewsTicker.findById(req.params.id);
    if (!news) return errorResponse(res, 404, "News ticker item not found");

    const filePath = `.${news.imageUrl}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await news.deleteOne();
    return successResponse(res, 200, "News ticker item deleted");
  } catch (error) {
    return errorResponse(
      res,
      500,
      "Failed to delete news ticker item",
      error.message,
    );
  }
};
