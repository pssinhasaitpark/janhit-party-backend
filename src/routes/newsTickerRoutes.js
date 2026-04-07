import express from "express";
import {
  createNewsTicker,
  getAllNewsTicker,
  getNewsTickerById,
  updateNewsTicker,
  deleteNewsTicker,
} from "../controllers/newsTickerController.js";
import upload from "../middlewares/imageUploads.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("media", 70),
  createNewsTicker,
);

router.get("/", getAllNewsTicker);

router.get("/:id", getNewsTickerById);

router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  upload.single("media"),
  updateNewsTicker,
);

router.delete(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  deleteNewsTicker,
);

export default router;
