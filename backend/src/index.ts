import express from "express";
import cors from "cors";
import "dotenv/config"; // ✅ loads .env automatically
import problemRoutes from "./routes/problemRoutes";
import submitRoutes from "./routes/submitRoutes";

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Debug log for env
console.log("GROQ_API_KEY loaded:", process.env.GROQ_API_KEY ? "YES" : "NO");

// ✅ Routes
app.use("/api/problems", problemRoutes);   // Problem-related APIs
app.use("/api/submit", submitRoutes);      // Code submission APIs

// ✅ Health check route
app.get("/", (req, res) => {
  res.send("🚀 Backend server is running...");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
