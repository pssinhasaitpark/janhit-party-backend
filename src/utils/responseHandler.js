export const successResponse = (
  res,
  status = 200,
  message = "Request successful",
  data = {},
  extra,
) => {
  return res.status(status).json({
    success: true,
    message,
    data,
    ...extra,
  });
};

export const errorResponse = (
  res,
  status = 500,
  message = "Something went wrong",
  error,
) => {
  return res.status(status).json({
    success: false,
    message,
    error:
      process.env.NODE_ENV === "development"
        ? error
        : error?.message || undefined,
  });
};
