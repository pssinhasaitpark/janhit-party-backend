// memberRoutes.js
import express from "express";
import {
  createMember,
  getAllMembers,
  getMemberById,
  updateMember,
  deleteMember,
  approveMember, // <-- New
} from "../controllers/memberController.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

// Public route to register new member
router.post("/", createMember);

// Admin routes for managing members
router.get("/", authMiddleware, authorizeRoles("admin"), getAllMembers);
router.get("/:id", authMiddleware, authorizeRoles("admin"), getMemberById);
router.put("/:id", authMiddleware, authorizeRoles("admin"), updateMember);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteMember);
router.patch(
  "/:id/approve",
  authMiddleware,
  authorizeRoles("admin"),
  approveMember,
);

export default router;
