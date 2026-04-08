// import Timeline from "../models/timelineModel.js";
// import { successResponse, errorResponse } from "../utils/responseHandler.js";
// import fs from "fs";

// // Helper to delete media files
// const deleteFiles = (files) => {
//   files.forEach((file) => {
//     const filePath = `.${file.url}`;
//     if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
//   });
// };

// export const createTimeline = async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     if (!title || !date)
//       return errorResponse(res, 400, "Title and date are required");

//     const media =
//       req.files?.map((file) => {
//         const ext = file.filename.split(".").pop().toLowerCase();
//         const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
//           ? "video"
//           : "image";
//         return { url: `/uploads/media/${file.filename}`, type };
//       }) || [];

//     const timeline = await Timeline.create({ title, description, date, media });
//     return successResponse(
//       res,
//       201,
//       "Timeline milestone created successfully",
//       timeline,
//     );
//   } catch (error) {
//     return errorResponse(res, 500, "Create milestone failed", error.message);
//   }
// };

// export const getAllTimelines = async (req, res) => {
//   try {
//     const { status, startDate, endDate } = req.query;

//     let filter = {};

//     // Filter by status (upcoming / past)
//     if (status) {
//       filter.status = status.toLowerCase();
//     }

//     // Optional date range filter
//     if (startDate || endDate) {
//       filter.date = {};
//       if (startDate) filter.date.$gte = new Date(startDate);
//       if (endDate) filter.date.$lte = new Date(endDate);
//     }

//     const timelines = await Timeline.find(filter).sort({ date: 1 });

//     return successResponse(
//       res,
//       200,
//       "Timelines fetched successfully",
//       timelines,
//     );
//   } catch (error) {
//     return errorResponse(res, 500, "Fetch timelines failed", error.message);
//   }
// };

// export const getTimelineById = async (req, res) => {
//   try {
//     const timeline = await Timeline.findById(req.params.id);
//     if (!timeline)
//       return errorResponse(res, 404, "Timeline milestone not found");
//     return successResponse(res, 200, "Timeline fetched successfully", timeline);
//   } catch (error) {
//     return errorResponse(res, 500, "Fetch timeline failed", error.message);
//   }
// };

// export const updateTimeline = async (req, res) => {
//   try {
//     const { title, description, date } = req.body;
//     const timeline = await Timeline.findById(req.params.id);
//     if (!timeline)
//       return errorResponse(res, 404, "Timeline milestone not found");

//     const updateData = { title, description, date };

//     if (req.files && req.files.length > 0) {
//       if (timeline.media && timeline.media.length > 0)
//         deleteFiles(timeline.media);
//       updateData.media = req.files.map((file) => {
//         const ext = file.filename.split(".").pop().toLowerCase();
//         const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
//           ? "video"
//           : "image";
//         return { url: `/uploads/media/${file.filename}`, type };
//       });
//     }

//     const updatedTimeline = await Timeline.findByIdAndUpdate(
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
//       "Timeline updated successfully",
//       updatedTimeline,
//     );
//   } catch (error) {
//     return errorResponse(res, 500, "Update milestone failed", error.message);
//   }
// };

// export const deleteTimeline = async (req, res) => {
//   try {
//     const timeline = await Timeline.findById(req.params.id);
//     if (!timeline)
//       return errorResponse(res, 404, "Timeline milestone not found");

//     if (timeline.media && timeline.media.length > 0)
//       deleteFiles(timeline.media);

//     await timeline.deleteOne();
//     return successResponse(res, 200, "Timeline milestone deleted successfully");
//   } catch (error) {
//     return errorResponse(res, 500, "Delete milestone failed", error.message);
//   }
// };
import Timeline from "../models/timelineModel.js";
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
        folder: "timeline",
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

export const createTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title || !date) {
      return errorResponse(res, 400, "Title and date are required");
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

    const timeline = await Timeline.create({
      title,
      description,
      date,
      media,
    });

    return successResponse(
      res,
      201,
      "Timeline milestone created successfully",
      timeline,
    );
  } catch (error) {
    return errorResponse(res, 500, "Create milestone failed", error.message);
  }
};

export const getAllTimelines = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    let filter = {};

    if (status) {
      filter.status = status.toLowerCase();
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const timelines = await Timeline.find(filter).sort({ date: 1 });

    return successResponse(
      res,
      200,
      "Timelines fetched successfully",
      timelines,
    );
  } catch (error) {
    return errorResponse(res, 500, "Fetch timelines failed", error.message);
  }
};

export const getTimelineById = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return errorResponse(res, 404, "Timeline milestone not found");
    }

    return successResponse(res, 200, "Timeline fetched successfully", timeline);
  } catch (error) {
    return errorResponse(res, 500, "Fetch timeline failed", error.message);
  }
};

export const updateTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    const timeline = await Timeline.findById(req.params.id);
    if (!timeline) {
      return errorResponse(res, 404, "Timeline milestone not found");
    }

    let updateData = { title, description, date };

    if (req.files && req.files.length > 0) {
      // 🔹 delete old media
      if (timeline.media?.length) {
        await deleteFromCloudinary(timeline.media);
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

    const updatedTimeline = await Timeline.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );

    return successResponse(
      res,
      200,
      "Timeline updated successfully",
      updatedTimeline,
    );
  } catch (error) {
    return errorResponse(res, 500, "Update milestone failed", error.message);
  }
};

export const deleteTimeline = async (req, res) => {
  try {
    const timeline = await Timeline.findById(req.params.id);

    if (!timeline) {
      return errorResponse(res, 404, "Timeline milestone not found");
    }

    // 🔹 delete from cloudinary
    if (timeline.media?.length) {
      await deleteFromCloudinary(timeline.media);
    }

    await timeline.deleteOne();

    return successResponse(res, 200, "Timeline milestone deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete milestone failed", error.message);
  }
};
