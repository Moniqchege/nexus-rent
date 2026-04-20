import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import notificationsRoutes from "./routes/notifications.js";
import rolesRoutes from "./routes/roles.js";
import usersRoutes from "./routes/users.js";
import propertiesRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import servicesRoutes from "./routes/services.js";
import contactsRoutes from "./routes/contacts.js";
import auditRoutes from "./routes/audit-trails.js";
import paymentRoutes, { stripeWebhookHandler } from "./routes/payments.js";

import { setupOAuth } from "./services/oauthStrategies.js";

console.log('INDEX.TS LOADED AT:', new Date().toISOString());
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../uploads/leases");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

app.post(
  "/api/payments/webhooks/stripe",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler
);

app.use(express.json());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    if (
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.includes("192.168") ||
      origin.includes("10.") ||
      origin.includes("exp.direct") ||
      origin.includes("vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// app.options("*", cors());

// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true);

//    if (
//   origin.includes("localhost") ||
//   origin.includes("127.0.0.1") ||
//   origin.includes("192.168") ||
//   origin.includes("exp.direct") ||
//   origin.includes("vercel.app")
// ) {
//       return callback(null, true);
//     }

//     return callback(new Error("Not allowed by CORS"));
//   },
//   credentials: true,
// }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
setupOAuth();
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);
app.use("/auth", authRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/services", servicesRoutes);
app.use("/api/contacts", contactsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/audit-trails", auditRoutes);
app.use("/api/payments", paymentRoutes);

// Start cron
await import('./services/paymentService.js').then(m => m.startCronJobs());

app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));



