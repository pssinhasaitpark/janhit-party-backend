// import Campaign from "../models/campaignsModel.js";
// import { successResponse, errorResponse } from "../utils/responseHandler.js";
// import fs from "fs";

// // Helper: delete media files
// const deleteFiles = (files) => {
//   files.forEach((file) => {
//     const filePath = `.${file.url}`;
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//   });
// };

// export const createCampaign = async (req, res) => {
//   try {
//     const { name, description, category } = req.body;
//     if (!name || !category)
//       return errorResponse(res, 400, "Name and category are required");

//     const media =
//       req.files?.map((file) => {
//         const ext = file.filename.split(".").pop().toLowerCase();
//         const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
//           ? "video"
//           : "image";
//         return { url: `/uploads/media/${file.filename}`, type };
//       }) || [];

//     const campaign = await Campaign.create({
//       name,
//       description,
//       category,
//       media,
//     });
//     return successResponse(res, 201, "Campaign created successfully", campaign);
//   } catch (error) {
//     return errorResponse(res, 500, "Create campaign failed", error.message);
//   }
// };

// export const getAllCampaigns = async (req, res) => {
//   try {
//     const { category, status, search, page = 1, limit = 10 } = req.query;

//     let filter = {};

//     // Filter by category
//     if (category) filter.category = category;

//     // Filter by status (e.g., active/inactive)
//     if (status) filter.status = status;

//     // Search by title or description
//     if (search) {
//       filter.$or = [
//         { title: { $regex: search, $options: "i" } },
//         { description: { $regex: search, $options: "i" } },
//       ];
//     }

//     // Pagination
//     const skip = (parseInt(page) - 1) * parseInt(limit);
//     const total = await Campaign.countDocuments(filter);

//     const campaigns = await Campaign.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit));

//     return successResponse(res, 200, "Campaigns fetched successfully", {
//       total,
//       page: parseInt(page),
//       limit: parseInt(limit),
//       totalPages: Math.ceil(total / limit),
//       campaigns,
//     });
//   } catch (error) {
//     return errorResponse(res, 500, "Fetch campaigns failed", error.message);
//   }
// };

// export const getCampaignById = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);
//     if (!campaign) return errorResponse(res, 404, "Campaign not found");
//     return successResponse(res, 200, "Campaign fetched successfully", campaign);
//   } catch (error) {
//     return errorResponse(res, 500, "Fetch campaign failed", error.message);
//   }
// };

// export const updateCampaign = async (req, res) => {
//   try {
//     const { name, description, category, status } = req.body;
//     const campaign = await Campaign.findById(req.params.id);
//     if (!campaign) return errorResponse(res, 404, "Campaign not found");

//     const updateData = { name, description, category, status };

//     if (req.files && req.files.length > 0) {
//       // delete old media files
//       if (campaign.media && campaign.media.length > 0)
//         deleteFiles(campaign.media);

//       updateData.media = req.files.map((file) => {
//         const ext = file.filename.split(".").pop().toLowerCase();
//         const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
//           ? "video"
//           : "image";
//         return { url: `/uploads/media/${file.filename}`, type };
//       });
//     }

//     const updatedCampaign = await Campaign.findByIdAndUpdate(
//       req.params.id,
//       updateData,
//       {
//         new: true,
//         runValidators: true,
//       },
//     );

//     return successResponse(
//       res,
//       200,
//       "Campaign updated successfully",
//       updatedCampaign,
//     );
//   } catch (error) {
//     return errorResponse(res, 500, "Update campaign failed", error.message);
//   }
// };

// export const deleteCampaign = async (req, res) => {
//   try {
//     const campaign = await Campaign.findById(req.params.id);
//     if (!campaign) return errorResponse(res, 404, "Campaign not found");

//     if (campaign.media && campaign.media.length > 0)
//       deleteFiles(campaign.media);

//     await campaign.deleteOne();
//     return successResponse(res, 200, "Campaign deleted successfully");
//   } catch (error) {
//     return errorResponse(res, 500, "Delete campaign failed", error.message);
//   }
// };

import Campaign from "../models/campaignsModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import streamifier from "streamifier";

// 🔹 Upload helper
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Invalid file: buffer is missing"));
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "campaigns",
        resource_type: "auto",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// 🔹 Delete helper
const deleteFromCloudinary = async (media) => {
  for (const file of media) {
    if (file.public_id) {
      await cloudinary.uploader.destroy(file.public_id, {
        resource_type: file.type === "video" ? "video" : "image",
      });
    }
  }
};

export const createCampaign = async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name || !category) {
      return errorResponse(res, 400, "Name and category are required");
    }

    let media = [];

    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadToCloudinary(file);

          return {
            url: result.secure_url,
            public_id: result.public_id,
            type: result.resource_type === "video" ? "video" : "image",
          };
        }),
      );

      media = uploads;
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

    let filter = {};

    if (category) filter.category = category;
    if (status) filter.status = status;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } }, // ⚠️ FIXED (was title)
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

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    return successResponse(res, 200, "Campaign fetched successfully", campaign);
  } catch (error) {
    return errorResponse(res, 500, "Fetch campaign failed", error.message);
  }
};

export const updateCampaign = async (req, res) => {
  try {
    const { name, description, category, status } = req.body;

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    let updateData = { name, description, category, status };

    if (req.files && req.files.length > 0) {
      // 🔹 delete old media
      if (campaign.media?.length) {
        await deleteFromCloudinary(campaign.media);
      }

      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadToCloudinary(file);

          return {
            url: result.secure_url,
            public_id: result.public_id,
            type: result.resource_type === "video" ? "video" : "image",
          };
        }),
      );

      updateData.media = uploads;
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

    if (!campaign) {
      return errorResponse(res, 404, "Campaign not found");
    }

    // 🔹 delete media from cloudinary
    if (campaign.media?.length) {
      await deleteFromCloudinary(campaign.media);
    }

    await campaign.deleteOne();

    return successResponse(res, 200, "Campaign deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete campaign failed", error.message);
  }
};
