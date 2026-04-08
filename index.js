// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import path from "path";
// import allRoutes from "./src/routes/index.js";
// import connectDB from "./src/configs/dbConnection.js";

// dotenv.config();
// const app = express();

// app.use(cors());
// app.use(express.json());

// app.get("/", (req, res) => {
//   res.send("Welcome to Janhit Party Backend!");
// });

// app.use("/uploads", express.static("uploads"));
// allRoutes(app);

// const PORT = process.env.PORT || 3000;
// const HOST = process.env.HOST || "localhost";

// async function startServer() {
//   try {
//     await connectDB();
//     app.listen(PORT, HOST, () => {
//       console.log(`Server is running on http://${HOST}:${PORT}`);
//     });
//   } catch (error) {
//     console.error("Failed to start server:", error.message);
//     process.exit(1);
//   }
// }

// startServer();

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import allRoutes from "./src/routes/index.js";
import connectDB from "./src/configs/dbConnection.js";

dotenv.config();
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to Janhit Party Backend!");
});

// Routes
allRoutes(app);

// Connect to DB
async function connectToDB() {
  try {
    await connectDB();
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
}

// Export the Express app as a Vercel serverless function
export default async function handler(req, res) {
  try {
    await connectToDB();
    return app(req, res);
  } catch (error) {
    console.error("Serverless function error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
