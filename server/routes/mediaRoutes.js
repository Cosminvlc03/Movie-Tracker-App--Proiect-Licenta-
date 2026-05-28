import express from "express";
import { 
  fetchWatchlist, 
  searchMedia, 
  getMediaDetails, 
  addFavourite, 
  removeFavourite, 
  getFavouriteDetails,
  upsertRating,
  getMovieRatings
} from "../controllers/mediaController.js";
import { requireAuth } from "./authRoutes.js";

const router = express.Router();

router.get("/watchlist", requireAuth, fetchWatchlist);
router.post("/search", requireAuth, searchMedia);
router.get("/media/:mediaId", requireAuth, getMediaDetails);
router.post("/favourite", requireAuth, addFavourite);
router.get("/watchlist/media/:tmdbId", requireAuth, getFavouriteDetails);
router.delete("/favourite/:tmdbId", requireAuth, removeFavourite);
router.post("/ratings", requireAuth, upsertRating);
router.get("/ratings/:tmdbId", requireAuth, getMovieRatings);

export default router;