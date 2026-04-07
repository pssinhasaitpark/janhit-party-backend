import Event from "../models/eventModel.js";
import { successResponse, errorResponse } from "../utils/responseHandler.js";
import fs from "fs";

const deleteFiles = (files) => {
  files.forEach((file) => {
    const filePath = `.${file.url}`;
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
};

export const createEvent = async (req, res) => {
  try {
    const { name, location, theme, date, time } = req.body;

    if (!name || !location || !date || !time) {
      return errorResponse(res, 400, "All required fields must be provided");
    }

    const media =
      req.files?.map((file) => {
        const ext = file.filename.split(".").pop().toLowerCase();
        const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
          ? "video"
          : "image";
        return { url: `/uploads/media/${file.filename}`, type };
      }) || [];

    const event = await Event.create({
      name,
      location,
      theme,
      date,
      time,
      media,
    });

    return successResponse(res, 201, "Event created successfully", event);
  } catch (error) {
    return errorResponse(res, 500, "Create event failed", error.message);
  }
};

// export const getAllEvents = async (req, res) => {
//   try {
//     const { status } = req.query;

//     let filter = {};
//     if (status) filter.status = status;

//     const events = await Event.find(filter).sort({ date: -1 });

//     return successResponse(res, 200, "Events fetched successfully", events);
//   } catch (error) {
//     return errorResponse(res, 500, "Fetch events failed", error.message);
//   }
// };

export const getAllEvents = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    let filter = {};

    // Filter by status (upcoming, past, etc.)
    if (status) filter.status = status;

    // Search by name, location, or theme
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { theme: { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
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

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    return successResponse(res, 200, "Event fetched successfully", event);
  } catch (error) {
    return errorResponse(res, 500, "Fetch event failed", error.message);
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { name, location, theme, date, time } = req.body;

    let updateData = { name, location, theme, date, time };

    const event = await Event.findById(req.params.id);
    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    // Handle new media upload
    if (req.files && req.files.length > 0) {
      // Delete old media from disk
      if (event.media && event.media.length > 0) deleteFiles(event.media);

      updateData.media = req.files.map((file) => {
        const ext = file.filename.split(".").pop().toLowerCase();
        const type = ["mp4", "mov", "avi", "mkv"].includes(ext)
          ? "video"
          : "image";
        return { url: `/uploads/media/${file.filename}`, type };
      });
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

    if (!event) {
      return errorResponse(res, 404, "Event not found");
    }

    // Delete media files from disk
    if (event.media && event.media.length > 0) deleteFiles(event.media);

    await event.deleteOne();

    return successResponse(res, 200, "Event deleted successfully");
  } catch (error) {
    return errorResponse(res, 500, "Delete event failed", error.message);
  }
};
