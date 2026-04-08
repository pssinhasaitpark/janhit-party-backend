import Event from "../models/eventModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import {
  uploadToCloudinary,
  deleteFromCloudinary,
} from "../utils/mediaHandler.js";

const determineEventStatus = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(eventDate);
  date.setHours(0, 0, 0, 0);

  if (date < today) return "past";
  else if (date.getTime() === today.getTime()) return "current";
  else return "upcoming";
};

export const createEvent = async (req, res) => {
  try {
    const { name, location, theme, date, time } = req.body;
    if (!name || !location || !date || !time) {
      return errorResponse(res, 400, "All required fields must be provided");
    }

    let media = [];
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "events")),
      );

      media = uploads.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
        type: result.resource_type === "video" ? "video" : "image",
      }));
    }

    const status = determineEventStatus(date);

    const event = await Event.create({
      name,
      location,
      theme,
      date,
      time,
      media,
      status,
    });
    return successResponse(res, 201, "Event created successfully", event);
  } catch (error) {
    return errorResponse(res, 500, "Create event failed", error.message);
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { theme: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Event.countDocuments(filter);

    const events = await Event.find(filter)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return successResponse(res, 200, "Events fetched successfully", {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      events,
    });
  } catch (error) {
    return errorResponse(res, 500, "Fetch events failed", error.message);
  }
};

export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 404, "Event not found");

    return successResponse(res, 200, "Event fetched successfully", event);
  } catch (error) {
    return errorResponse(res, 500, "Fetch event failed", error.message);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { name, location, theme, date, time } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 404, "Event not found");

    const updateData = { name, location, theme, date, time };
    if (date) updateData.status = determineEventStatus(date);

    if (req.files?.length) {
      if (event.media?.length) await deleteFromCloudinary(event.media);

      const uploads = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file, "events")),
      );

      updateData.media = uploads.map((result) => ({
        url: result.secure_url,
        public_id: result.public_id,
        type: result.resource_type === "video" ? "video" : "image",
      }));
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    );
    return successResponse(
      res,
      200,
      "Event updated successfully",
      updatedEvent,
    );
  } catch (error) {
    return errorResponse(res, 500, "Update event failed", error.message);
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 404, "Event not found");

    if (event.media?.length) await deleteFromCloudinary(event.media);
    await event.deleteOne();

    return successResponse(res, 200, "Event deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete event failed", error.message);
  }
};
