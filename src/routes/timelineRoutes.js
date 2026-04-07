import express from "express";
import {
  createTimeline,
  getAllTimelines,
  getTimelineById,
  updateTimeline,
  deleteTimeline,
} from "../controllers/timelineController.js";
import upload from "../middlewares/imageUploads.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin routes (CRUD)
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("media", 10),
  createTimeline,
);
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("media", 10),
  updateTimeline,
);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteTimeline);

// Public routes (GET only)
router.get("/", getAllTimelines);
router.get("/:id", getTimelineById);

export default router;
