import express from "express";
import {
  createEvent,
  getAllEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import upload from "../middlewares/imageUploads.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  upload.array("media", 10),
  authMiddleware,
  authorizeRoles("admin"),
  createEvent,
);

// Public route to get all events (with optional status filter)

router.get("/", getAllEvents);

router.get("/:id", getEventById);

router.patch(
  "/:id",
  upload.array("media", 10),
  authMiddleware,
  authorizeRoles("admin"),
  updateEvent,
);

router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteEvent);

export default router;
