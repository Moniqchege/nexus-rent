import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import notificationsRoutes from "./routes/notifications.js";
import rolesRoutes from "./routes/roles.js";
import usersRoutes from "./routes/users.js";
import propertiesRoutes from "./routes/properties.js";
import adminRoutes from "./routes/admin.js";
import { setupOAuth } from "./services/oauthStrategies.js";




console.log('INDEX.TS LOADED AT:', new Date().toISOString());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:8081",
    "https://resume-builder-frontend-6w43zpqnp-moniqcheges-projects.vercel.app/",
  ],
  credentials: true,
}));

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
app.use("/notifications", notificationsRoutes);
app.use("/api/roles", rolesRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/properties", propertiesRoutes);
app.use("/api/admin", adminRoutes);
app.listen(process.env.PORT || 4000, () => console.log("Server running"));


