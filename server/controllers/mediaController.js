import db from "../config/db.js";
import axios from "axios";
import { getSessionCredentials } from "./authController.js";

const apiKey = process.env.API_KEY;
const baseURL = "https://api.themoviedb.org/3";

export const getWatchlist = async (username) => {
  const userMovies = `
    SELECT m.tmdb_id, m.title, m.release_year, m.media_type, m.poster_path, m.description, m.actors
    FROM media m
    JOIN watchlist w ON m.id = w.movie_id
    JOIN users u ON w.user_id = u.id
    WHERE u.username = $1
  `;
  const watchlistResult = await db.query(userMovies, [username]);
  return watchlistResult.rows;
};

const getMovieDetails = async (mediaId, mediaType = "movie") => {
  try {
    const detailsUrl = `${baseURL}/${mediaType}/${mediaId}?api_key=${apiKey}&append_to_response=credits`;
    const response = await axios.get(detailsUrl);
    const data = response.data;
    const mainActors = (data.credits?.cast || [])
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5)
      .map((actor) => actor.name);
    const releaseDate = data.release_date || data.first_air_date;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";

    return {
      id: mediaId,
      title: data.title || data.name,
      releaseYear,
      genres: data.genres?.map((genre) => genre.name) || [],
      photo: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path.trim()}` : null,
      posterPath: data.poster_path || null,
      description: data.overview,
      mainActors,
    };
  } catch (err) {
    console.error(`Error fetching details for ID ${mediaId}`, err);
    return null;
  }
};

const searchAndGetDetails = async (query, noOfResults) => {
  try {
    const searchUrl = `${baseURL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl);
    const searchResults = response.data.results;

    if (!searchResults || searchResults.length === 0) return [];

    const mediaToFetch = searchResults
      .filter((result) => result.media_type === "movie")
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, noOfResults);

    const selectedMedia = mediaToFetch.map((result) => getMovieDetails(result.id, result.media_type));
    const detailedResults = await Promise.all(selectedMedia);
    return detailedResults.filter(Boolean);
  } catch (err) {
    console.error(err);
    return [];
  }
};

export const fetchWatchlist = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const watchlist = await getWatchlist(username);
    res.json({ username, watchlist });
  } catch (err) {
    res.status(500).json({ message: "Could not load watchlist" });
  }
};

export const searchMedia = async (req, res) => {
  try {
    const details = await searchAndGetDetails(req.body.search, 4);
    const media = details.map((item) => ({
      title: item.title,
      image: item.photo && item.photo.trim() !== "" ? item.photo.trim() : null,
      id: item.id,
    }));
    res.json({ media });
  } catch (err) {
    res.status(500).json({ message: "Search failed" });
  }
};

export const getMediaDetails = async (req, res) => {
  try {
    const details = await getMovieDetails(req.params.mediaId, "movie");
    if (!details) return res.status(404).json({ message: "Media not found" });

    res.json({
      mediaId: req.params.mediaId,
      title: details.title,
      year: details.releaseYear,
      type: details.genres.join(", "),
      photo: details.photo,
      description: details.description,
      actors: details.mainActors,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load media details" });
  }
};

export const addFavourite = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { mediaId, title, year, type, photo, description, actors } = req.body;

    await db.query(
      "INSERT INTO media (tmdb_id, title, release_year, media_type, poster_path, description, actors) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(tmdb_id) DO UPDATE SET title = EXCLUDED.title RETURNING id",
      [mediaId, title, year, type, photo, description, Array.isArray(actors) ? actors.join(", ") : actors]
    );

    await db.query(
      "INSERT INTO watchlist (user_id, movie_id) VALUES ((SELECT id FROM users WHERE username = $1), (SELECT id FROM media WHERE tmdb_id = $2)) ON CONFLICT DO NOTHING",
      [username, mediaId]
    );

    const watchlist = await getWatchlist(username);
    res.status(201).json({ username, watchlist });
  } catch (err) {
    res.status(500).json({ message: "Could not add favourite" });
  }
};

export const getFavouriteDetails = async (req, res) => {
  try {
    const watchlistResult = await db.query("SELECT * FROM media WHERE tmdb_id = ($1)", [req.params.tmdbId]);
    const result = watchlistResult.rows[0];

    if (!result) return res.status(404).json({ message: "Media not found" });

    res.json({
      title: result.title,
      year: result.release_year,
      type: result.media_type,
      photo: result.poster_path,
      description: result.description,
      actors: result.actors,
      mediaId: result.id,
      tmdb_id: result.tmdb_id,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load favourite details" });
  }
};

export const removeFavourite = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    await db.query(
      "DELETE FROM watchlist WHERE user_id = (SELECT id FROM users WHERE username = $1) AND movie_id = (SELECT id FROM media WHERE tmdb_id = $2)",
      [username, req.params.tmdbId]
    );

    const watchlist = await getWatchlist(username);
    res.json({ username, watchlist });
  } catch (err) {
    res.status(500).json({ message: "Could not remove favourite" });
  }
};