import express from "express";
import {
  createContact,
  getAllContacts,
  getContactById,
  resolveContact,
  deleteContact,
} from "../controllers/contactController.js";
import { authMiddleware } from "../middlewares/authmiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();

router.post("/", createContact);

router.get("/", authMiddleware, authorizeRoles("admin"), getAllContacts);

router.get("/:id", authMiddleware, authorizeRoles("admin"), getContactById);

router.patch(
  "/:id/resolve",
  authMiddleware,
  authorizeRoles("admin"),
  resolveContact,
);

router.delete("/:id", authMiddleware, authorizeRoles("admin"), deleteContact);

export default router;
