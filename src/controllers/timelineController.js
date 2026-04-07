import Timeline from "../models/timelineModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";

// Helper to delete media files
const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = `.${file.url}`;
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  });
};

export const createTimeline = async (req, res) => {
  try {
    const { title, description, date } = req.body;
    if (!title || !date)
      return errorResponse(res, 400, "Title and date are required");

    const media =
      req.files?.map((file) => {
        const ext = file.filename.split(".").pop().toLowerCase();
        const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
          ? "video"
          : "image";
        return { url: `/uploads/media/${file.filename}`, type };
      }) || [];

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

    // Filter by status (upcoming / past)
    if (status) {
      filter.status = status.toLowerCase();
    }

    // Optional date range filter
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

    if (req.files && req.files.length > 0) {
      if (timeline.media && timeline.media.length > 0)
        deleteFiles(timeline.media);
      updateData.media = req.files.map((file) => {
        const ext = file.filename.split(".").pop().toLowerCase();
        const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
          ? "video"
          : "image";
        return { url: `/uploads/media/${file.filename}`, type };
      });
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

    if (timeline.media && timeline.media.length > 0)
      deleteFiles(timeline.media);

    await timeline.deleteOne();
    return successResponse(res, 200, "Timeline milestone deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete milestone failed", error.message);
  }
};
