import express from "express";
import {
  createDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
} from "../controllers/documentController.js";
import upload from "../middlewares/documentUpload.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Admin routes
router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("document"),
  createDocument,
);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteDocument);

// Public routes
router.get("/", getAllDocuments);
router.get("/:id", getDocumentById);

export default router;
