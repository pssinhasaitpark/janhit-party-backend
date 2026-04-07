import express from "express";
import {
  createMedia,
  getAllMedia,
  getMediaById,
  updateMedia,
  deleteMedia,
} from "../controllers/mediaController.js";
import upload from "../middlewares/imageUploads.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin routes (CRUD)
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("media", 70),
  createMedia,
);
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("media"),
  updateMedia,
);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteMedia);

// Public routes (GET only)
router.get("/", getAllMedia);
router.get("/:id", getMediaById);

export default router;
