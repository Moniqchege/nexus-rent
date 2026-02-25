import dotenv from "dotenv";
dotenv.config();

import cors from "cors";
import express from "express";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";


console.log('INDEX.TS LOADED AT:', new Date().toISOString());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());
app.use(cors({
  origin:[ 
  "http://localhost:5173",
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
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);
app.listen(process.env.PORT || 4000, () => console.log("Server running"));