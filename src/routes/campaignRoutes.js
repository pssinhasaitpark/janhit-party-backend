import express from "express";
import {
  createCampaign,
  getAllCampaigns,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
} from "../controllers/campaignController.js";
import upload from "../middlewares/imageUploads.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("media", 10),
  createCampaign,
);
router.patch(
  "/:id",
  authMiddleware,
  authorizeRoles("admin"),
  upload.array("media", 10),
  updateCampaign,
);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteCampaign);

router.get("/", getAllCampaigns);
router.get("/:id", getCampaignById);

export default router;
