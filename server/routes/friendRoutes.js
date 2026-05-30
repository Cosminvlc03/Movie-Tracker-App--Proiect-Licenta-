import express from "express";
import { requireAuth } from "./authRoutes.js";
import { 
  searchUsers, 
  sendFriendRequest, 
  respondToRequest, 
  getNotifications, 
  getFriendsData,
  removeFriend 
} from "../controllers/friendController.js";

const router = express.Router();
router.get("/friends/search", requireAuth, searchUsers);
router.post("/friends/request", requireAuth, sendFriendRequest);
router.put("/friends/respond", requireAuth, respondToRequest);
router.get("/friends/notifications", requireAuth, getNotifications);
router.get("/friends", requireAuth, getFriendsData);
router.delete("/friends/remove", requireAuth, removeFriend);

export default router;