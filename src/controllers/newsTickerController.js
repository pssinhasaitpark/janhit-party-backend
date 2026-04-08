import NewsTicker from "../models/newsTickerSchema.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/mediaHandler.js";

export const createNewsTicker = async (req, res) => {
  try {
    const { title, description, category, order, isActive } = req.body;

    if (!category || !req.files?.length) {
      return errorResponse(
        res,
        400,
        "Category and at least one media file are required",
      );
    }

    const items = await Promise.all(
      req.files.map(async (file, idx) => {
        const result = await uploadToCloudinary(file, "news-ticker");

        return {
          imageUrl: result.secure_url,
          public_id: result.public_id,
          mediaType: result.resource_type === "video" ? "video" : "image",

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
      }),
    );

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

    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === "true";

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

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
    const news = await NewsTicker.findById(req.params.id);
    if (!news) return errorResponse(res, 404, "News ticker item not found");

    let updateData = { title, description, category, order, isActive };

    if (req.file) {
      await deleteFromCloudinary(news);

      const result = await uploadToCloudinary(req.file, "news-ticker");
      updateData.imageUrl = result.secure_url;
      updateData.public_id = result.public_id;
      updateData.mediaType =
        result.resource_type === "video" ? "video" : "image";
    }

    const updatedNews = await NewsTicker.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    return successResponse(res, 200, "News ticker item updated", updatedNews);
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

    await deleteFromCloudinary(news);
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
