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
console.log("DATABASE_URL:", process.env.DATABASE_URL);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

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
app.use("/api/admin", adminRoutes);
app.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));


