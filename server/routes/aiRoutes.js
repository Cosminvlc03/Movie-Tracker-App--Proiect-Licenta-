import express from "express";
import { requireAuth } from "./authRoutes.js";
import { chatWithAI, getAIRecommendations } from "../controllers/aiController.js";

const router = express.Router();
router.post("/ai/chat", requireAuth, chatWithAI);
router.get("/ai/recommendations", requireAuth, getAIRecommendations);

export default router;