import express from "express";
import { rateLimit } from "express-rate-limit";
import { checkSession, login, signup, recoverPassword, resetPassword, getAccount, logout, deleteAccount } from "../controllers/authController.js";

const router = express.Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { message: "Prea multe încercări eșuate. Te rugăm să aștepți 15 minute." },
  standardHeaders: true,
  legacyHeaders: false,
});

const emailLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { message: "Ai atins limita cererilor de resetare. Încearcă din nou mai târziu." },
});

export const preventBrowserCache = (req, res, next) => {
  res.set("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.set("Expires", "0");
  res.set("Pragma", "no-cache");
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.session?.isAuthenticated) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
};

router.get("/session", preventBrowserCache, checkSession);
router.post("/login", preventBrowserCache, loginLimiter, login);
router.post("/signup", signup); 
router.post("/recover-password", emailLimiter, recoverPassword);
router.post("/reset-password", resetPassword);
router.get("/account", requireAuth, getAccount);
router.post("/logout", requireAuth, logout);
router.delete("/account", requireAuth, deleteAccount);

export default router;