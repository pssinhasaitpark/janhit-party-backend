import authRoutes from "./authRoutes.js";
import eventRoutes from "./eventRoutes.js";
import campaignRoutes from "./campaignRoutes.js";
import timelineRoutes from "./timelineRoutes.js";
import mediaRoutes from "./mediaRoutes.js";
import documentRoutes from "./documentRoutes.js";
import newsTickerRoutes from "./newsTickerRoutes.js";
import memberRoutes from "./memberRoutes.js";

const allRoutes = (app) => {
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/events", eventRoutes);
  app.use("/api/v1/campaigns", campaignRoutes);
  app.use("/api/v1/timelines", timelineRoutes);
  app.use("/api/v1/media", mediaRoutes);
  app.use("/api/v1/documents", documentRoutes);
  app.use("/api/v1/news-ticker", newsTickerRoutes);
  app.use("/api/v1/members", memberRoutes);

  //admin routes
  app.use("/api/v1/admin/events", eventRoutes);
  app.use("/api/v1/admin/campaigns", campaignRoutes);
  app.use("/api/v1/admin/timelines", timelineRoutes);
  app.use("/api/v1/admin/media", mediaRoutes);
  app.use("/api/v1/admin/documents", documentRoutes);
  app.use("/api/v1/admin/news-ticker", newsTickerRoutes);
  app.use("/api/v1/admin/members", memberRoutes);
};

export default allRoutes;
