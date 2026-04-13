// import express from "express";
// import dotenv from "dotenv";
// import cors from "cors";
// import morgan from "morgan";
// import allRoutes from "./src/routes/index.js";
// import connectDB from "./src/configs/dbConnection.js";

// dotenv.config();
// const app = express();

// const allowedOrigins = [
//   "https://janhit-party-web.vercel.app",
//   "https://janhit-party-admin.vercel.app",
//   "http://192.168.0.137:5173",
//   "http://192.168.0.137:5174",
//   "http://localhost:5173",
//   "http://localhost:5174",
//   "https://janhitparty.com",
// ];
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin) return callback(null, true);
//       if (allowedOrigins.indexOf(origin) === -1) {
//         const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
//         return callback(new Error(msg), false);
//       }
//       return callback(null, true);
//     },
//     credentials: true,
//   }),
// );
// app.use(express.json({ limit: "100mb" }));
// app.use(express.urlencoded({ limit: "100mb", extended: true }));
// app.use(
//   morgan(":method :url :status :res[content-length] - :response-time ms"),
// );
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
import morgan from "morgan";
import allRoutes from "./src/routes/index.js";
import connectDB from "./src/configs/dbConnection.js";

dotenv.config();
const app = express();

// Correct CORS setup
const allowedOrigins = [
  "https://janhit-party-web.vercel.app",
  "https://janhit-party-admin.vercel.app",
  "http://192.168.0.137:5173",
  "http://192.168.0.137:5174",
  "http://localhost:5173",
  "http://localhost:5174",
  "https://janhitparty.com",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
  }),
);

// Middleware for parsing JSON
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));

app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms"),
);

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
