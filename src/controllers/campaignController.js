import Campaign from "../models/campaignsModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/mediaHandler.js";

export const createCampaign = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || !category) {
      return errorResponse(res, 400, "Name and category are required");
    }

    let media = [];
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "campaigns")),
      );

      media = uploads.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
        type: result.resource_type === "video" ? "video" : "image",
      }));
    }

    const campaign = await Campaign.create({
      name,
      description,
      category,
      media,
    });

    return successResponse(res, 201, "Campaign created successfully", campaign);
  } catch (error) {
    return errorResponse(res, 500, "Create campaign failed", error.message);
  }
};

export const getAllCampaigns = async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Campaign.countDocuments(filter);

    const campaigns = await Campaign.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, "Campaigns fetched successfully", {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      campaigns,
    });
  } catch (error) {
    return errorResponse(res, 500, "Fetch campaigns failed", error.message);
  }
};

export const getCampaignById = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return errorResponse(res, 404, "Campaign not found");

    return successResponse(res, 200, "Campaign fetched successfully", campaign);
  } catch (error) {
    return errorResponse(res, 500, "Fetch campaign failed", error.message);
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { name, description, category, status } = req.body;
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return errorResponse(res, 404, "Campaign not found");

    const updateData = { name, description, category, status };

    if (req.files?.length) {
      if (campaign.media?.length) await deleteFromCloudinary(campaign.media);

      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "campaigns")),
      );

      updateData.media = uploads.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
        type: result.resource_type === "video" ? "video" : "image",
      }));
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    return successResponse(
      res,
      200,
      "Campaign updated successfully",
      updatedCampaign,
    );
  } catch (error) {
    return errorResponse(res, 500, "Update campaign failed", error.message);
  }
};

export const deleteCampaign = async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return errorResponse(res, 404, "Campaign not found");

    if (campaign.media?.length) await deleteFromCloudinary(campaign.media);

    await campaign.deleteOne();

    return successResponse(res, 200, "Campaign deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete campaign failed", error.message);
  }
};
