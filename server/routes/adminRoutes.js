import express from "express";
import { requireAdmin } from "./authRoutes.js";
import { getDashboardStats, getAdminUsers, deleteUserAsAdmin, getAdminReviews, deleteReviewAsAdmin } from "../controllers/adminController.js";

const router = express.Router();
router.get("/admin/stats", requireAdmin, getDashboardStats);
router.get("/admin/users", requireAdmin, getAdminUsers);
router.delete("/admin/users/:userId", requireAdmin, deleteUserAsAdmin);
router.get("/admin/reviews", requireAdmin, getAdminReviews);
router.delete("/admin/reviews/:reviewId", requireAdmin, deleteReviewAsAdmin);

export default router;