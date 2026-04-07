import { errorResponse } from "../utils/responseHandler.js";
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, 401, "Token is missing.");
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.log("Server error:", error);

    if (
      error.name == "JsonwebTokenError" ||
      error.name == "TokenExpiredError"
    ) {
      return errorResponse(res, 401, "Invalid or Expired Token.");
    }

    return errorResponse(res, 500, "Internal server error.", error);
  }
};
