import express from "express";
import bodyParser from "body-parser";
import session from "express-session";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

import authRoutes from "./routes/authRoutes.js";
import mediaRoutes from "./routes/mediaRoutes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const port = process.env.PORT || 3000;

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, httpOnly: true, sameSite: "strict", maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api", authRoutes);
app.use("/api", mediaRoutes);

const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));
app.use("/misc", express.static(path.join(__dirname, "../client/public/misc")));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Movie Tracker API listening at http://localhost:${port}`);
});