const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const { pool: db, testConnection, closePool } = require("./config/db");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const activityRoutes = require("./routes/activities");
const recordRoutes = require("./routes/records");
const appealRoutes = require("./routes/appeals");
const statisticsRoutes = require("./routes/statistics");
const dashboardRoutes = require("./routes/dashboard");
const reportRoutes = require("./routes/reports");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// API 路由
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/records", recordRoutes);
app.use("/api/appeals", appealRoutes);
app.use("/api/statistics", statisticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);

// 托管前端静态文件（生产环境）
const frontendDist = path.join(__dirname, "../frontend/dist");
app.use(express.static(frontendDist));

// 所有非 API 路由返回前端页面（支持 SPA 路由），Express 4 兼容
app.get("*", (req, res) => {
  if (!req.path.startsWith("/api")) {
    res.sendFile(path.join(frontendDist, "index.html"));
  } else {
    res.status(404).json({ message: "API route not found" });
  }
});

// 启动服务器
const startServer = async () => {
  try {
    await testConnection();
    console.log("[Server] 数据库连接成功");

    const server = app.listen(PORT, () => {
      console.log(`[Server] 服务运行在 http://localhost:${PORT}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n[Server] 收到 ${signal}，正在优雅关闭...`);
      server.close(async () => {
        console.log("[Server] HTTP 服务器已关闭");
        await closePool();
        process.exit(0);
      });

      setTimeout(() => {
        console.error("[Server] 强制退出（超时）");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  } catch (error) {
    console.error("[Server] 启动失败:", error);
    process.exit(1);
  }
};

startServer();
