import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import allRoutes from "./src/routes/index.js";
import connectDB from "./src/configs/dbConnection.js";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Welcome to Janhit Party Backend!");
});

app.use("/uploads", express.static("uploads"));
allRoutes(app);

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
