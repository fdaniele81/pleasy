import express from "express";
import "dotenv/config";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import logger from "./utils/logger.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { version } = JSON.parse(readFileSync(join(__dirname, "../../version.json"), "utf-8"));

import authRoutes from "./routes/auth.routes.js";
import companyRoutes from "./routes/company.routes.js";
import userRoutes from "./routes/users.routes.js";
import clientRoutes from "./routes/client.routes.js";
import projectRoutes from "./routes/project.routes.js";
import taskRoutes from "./routes/tasks.routes.js";
import taskEtcRoutes from "./routes/task_etc.routes.js";
import timesheetRoutes from "./routes/timesheet.routes.js";
import timeoffRoutes from "./routes/timeoff.routes.js";
import holidaysRoutes from "./routes/holidays.routes.js";
import reconciliationRoutes from "./routes/reconciliation.routes.js";
import estimateRoutes from "./routes/estimate.routes.js";
import projectDraftRoutes from "./routes/projectDraft.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";

const requiredEnvVars = ["PORT", "PGHOST", "PGDATABASE", "PGUSER", "PGPASSWORD", "JWT_SECRET"];
const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  logger.error("Missing required environment variables", { missing: missingEnvVars });
  console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const app = express();
const port = process.env.PORT;

const normalizeOrigin = (o) => o.trim().replace(/:80$/, '').replace(/:443$/, '');

const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map(normalizeOrigin)
  : ["http://localhost:5173"];

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:"],
      connectSrc: ["'self'", ...allowedOrigins],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(compression());

app.use(cookieParser());

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(normalizeOrigin(origin))) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  maxAge: 86400,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.get("/api/version", (_req, res) => res.json({ version }));

app.use("/api/auth", authRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/user", userRoutes);
app.use("/api/client", clientRoutes);
app.use("/api/project", projectRoutes);
app.use("/api/task", taskRoutes);
app.use("/api/task-etc", taskEtcRoutes);
app.use("/api/timesheet", timesheetRoutes);
app.use("/api/timeoff", timeoffRoutes);
app.use("/api/holidays", holidaysRoutes);
app.use("/api/reconciliation", reconciliationRoutes);
app.use("/api/estimate", estimateRoutes);
app.use("/api/project-draft", projectDraftRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(port, () => {
  logger.info("Server started", { port, env: process.env.NODE_ENV || "development" });
});
