import { errorResponse } from "../utils/responseHandler.js";

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return errorResponse(
        res,
        403,
        `Role (${req.user.role}) is not allowed to access this resource`,
      );
    }
    next();
  };
};
