import Event from "../models/eventModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import cloudinary from "../configs/cloudinaryConfig.js";
import streamifier from "streamifier";

// 🔹 Upload to Cloudinary using buffer
const uploadToCloudinary = (file) => {
  return new Promise((resolve, reject) => {
    if (!file || !file.buffer) {
      return reject(new Error("Invalid file: buffer is missing"));
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder: "events", resource_type: "auto" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      },
    );

    streamifier.createReadStream(file.buffer).pipe(stream);
  });
};

// 🔹 Delete media from Cloudinary
const deleteFromCloudinary = async (media) => {
  for (const file of media) {
    if (file.public_id) {
      await cloudinary.uploader.destroy(file.public_id, {
        resource_type: file.type === "video" ? "video" : "image",
      });
    }
  }
};

// 🔹 Determine event status: past / current / upcoming
const determineEventStatus = (eventDate) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const date = new Date(eventDate);
  date.setHours(0, 0, 0, 0);

  if (date < today) return "past";
  else if (date.getTime() === today.getTime()) return "current";
  else return "upcoming";
};

// ================= CREATE EVENT =================
export const createEvent = async (req, res) => {
  try {
    const { name, location, theme, date, time } = req.body;

    if (!name || !location || !date || !time) {
      return errorResponse(res, 400, "All required fields must be provided");
    }

    // Upload media to Cloudinary
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

// ================= GET ALL EVENTS =================
export const getAllEvents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let filter = {};
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

// ================= GET EVENT BY ID =================
export const getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 404, "Event not found");

    return successResponse(res, 200, "Event fetched successfully", event);
  } catch (error) {
    return errorResponse(res, 500, "Fetch event failed", error.message);
  }
};

// ================= UPDATE EVENT =================
export const updateEvent = async (req, res) => {
  try {
    const { name, location, theme, date, time } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return errorResponse(res, 404, "Event not found");

    let updateData = { name, location, theme, date, time };

    // Update status if date changes
    if (date) {
      updateData.status = determineEventStatus(date);
    }

    // Replace media if new files are uploaded
    if (req.files && req.files.length > 0) {
      if (event.media?.length) await deleteFromCloudinary(event.media);

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

// ================= DELETE EVENT =================
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
