import Timeline from "../models/timelineModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/mediaHandler.js";

export const createTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    if (!title || !date)
      return errorResponse(res, 400, "Title and date are required");

    let media = [];
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadToCloudinary(file, "timeline");
          return {
            url: result.secure_url,
            publicId: result.public_id,
            type: result.resource_type === "video" ? "video" : "image",
          };
        }),
      );
      media = uploads;
    }

    const timeline = await Timeline.create({ title, description, date, media });
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

    if (status) filter.status = status.toLowerCase();
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
    if (!timeline)
      return errorResponse(res, 404, "Timeline milestone not found");
    return successResponse(res, 200, "Timeline fetched successfully", timeline);
  } catch (error) {
    return errorResponse(res, 500, "Fetch timeline failed", error.message);
  }
};

export const updateTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    const timeline = await Timeline.findById(req.params.id);
    if (!timeline)
      return errorResponse(res, 404, "Timeline milestone not found");

    const updateData = { title, description, date };

    if (req.files?.length) {
      if (timeline.media?.length) await deleteFromCloudinary(timeline.media);

      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const result = await uploadToCloudinary(file, "timeline");
          return {
            url: result.secure_url,
            publicId: result.public_id,
            type: result.resource_type === "video" ? "video" : "image",
          };
        }),
      );

      updateData.media = uploads;
    }

    const updatedTimeline = await Timeline.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      },
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
    if (!timeline)
      return errorResponse(res, 404, "Timeline milestone not found");

    if (timeline.media?.length) await deleteFromCloudinary(timeline.media);

    await timeline.deleteOne();
    return successResponse(res, 200, "Timeline milestone deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete milestone failed", error.message);
  }
};
