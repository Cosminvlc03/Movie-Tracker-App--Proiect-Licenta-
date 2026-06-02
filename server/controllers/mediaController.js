import db from "../config/db.js";
import axios from "axios";
import { getSessionCredentials } from "./authController.js";

const apiKey = process.env.API_KEY;
const baseURL = "https://api.themoviedb.org/3";

export const getWatchlist = async (username) => {
  const userMovies = `
    SELECT 
      m.tmdb_id, 
      m.title, 
      m.release_year, 
      m.media_type, 
      m.poster_path, 
      m.description, 
      m.actors,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS average_rating,
      COUNT(r.id) AS review_count
    FROM media m
    JOIN watchlist w ON m.id = w.movie_id
    JOIN users u ON w.user_id = u.id
    LEFT JOIN ratings r ON m.id = r.movie_id
    WHERE u.username = $1
    GROUP BY m.id, m.tmdb_id, m.title, m.release_year, m.media_type, m.poster_path, m.description, m.actors
  `;
  const watchlistResult = await db.query(userMovies, [username]);
  return watchlistResult.rows;
};

const getMovieDetails = async (mediaId, mediaType = "movie", language = "en-US") => {
  try {
    const langCode = language.substring(0, 2);
    const detailsUrl = `${baseURL}/${mediaType}/${mediaId}?api_key=${apiKey}&language=${language}&append_to_response=credits,videos&include_video_language=${langCode},en`;
    const response = await axios.get(detailsUrl);
    const data = response.data;
    const mainActors = (data.credits?.cast || [])
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 5)
      .map((actor) => actor.name);
    const releaseDate = data.release_date || data.first_air_date;
    const releaseYear = releaseDate ? new Date(releaseDate).getFullYear() : "N/A";

    const videos = data.videos?.results || [];
    const trailer = videos.find((v) => v.site === "YouTube" && v.type === "Trailer");

    return {
      id: mediaId,
      title: data.title || data.name,
      releaseYear,
      genres: data.genres?.map((genre) => genre.name) || [],
      photo: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path.trim()}` : null,
      posterPath: data.poster_path || null,
      description: data.overview,
      mainActors,
      trailerKey: trailer ? trailer.key : null,
    };
  } catch (err) {
    console.error(`Error fetching details for ID ${mediaId}`, err);
    return null;
  }
};

export const searchAndGetDetails = async (query, noOfResults, language = "en-US") => {
  try {
    const searchUrl = `${baseURL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=${language}`;
    const response = await axios.get(searchUrl);
    const searchResults = response.data.results;
    console.log("Rezultate brute TMDB:", searchResults.length);
    if (!searchResults || searchResults.length === 0) return [];

    const mediaToFetch = searchResults
      .filter((result) => result.media_type === "movie")
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, noOfResults);
    console.log("Filme după filtrare:", mediaToFetch.length);
    const selectedMedia = mediaToFetch.map((result) => getMovieDetails(result.id, result.media_type, language));
    const detailedResults = await Promise.all(selectedMedia);
    console.log("Rezultate detaliate finalizate:", detailedResults.length);
    return detailedResults.filter(Boolean);
  } catch (err) {
    console.error(err);
    console.error("Eroare în searchAndGetDetails:", err);
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
  console.log("Date primite:", req.body);
  try {
    const language = req.body.language || 'en-US';
    const details = await searchAndGetDetails(req.body.search, 10, language);
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
    const language = req.query.language || 'en-US';
    const details = await getMovieDetails(req.params.mediaId, "movie", language);
    if (!details) return res.status(404).json({ message: "Media not found" });

    res.json({
      mediaId: req.params.mediaId,
      title: details.title,
      year: details.releaseYear,
      type: details.genres.join(", "),
      photo: details.photo,
      description: details.description,
      actors: details.mainActors,
      trailerKey: details.trailerKey,
    });
  } catch (err) {
    res.status(500).json({ message: "Could not load media details" });
  }
};

export const addFavourite = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { tmdb_id, title, release_year, media_type, poster_path, description, actors } = req.body;
    if (!tmdb_id) {
        return res.status(400).json({ message: "ID-ul filmului lipsește!" });
    }
    await db.query(
      "INSERT INTO media (tmdb_id, title, release_year, media_type, poster_path, description, actors) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(tmdb_id) DO UPDATE SET title = EXCLUDED.title RETURNING id",
      [tmdb_id, title, release_year, media_type, poster_path, description, actors]
    );
    await db.query(
      "INSERT INTO watchlist (user_id, movie_id) VALUES ((SELECT id FROM users WHERE username = $1), (SELECT id FROM media WHERE tmdb_id = $2)) ON CONFLICT DO NOTHING",
      [username, tmdb_id]
    );
    const watchlist = await getWatchlist(username);
    res.status(201).json({ username, watchlist });
  } catch (err) {
    console.error("EROARE CRITICĂ ÎN ADD FAVOURITE:", err);
    res.status(500).json({ message: "Could not add favourite" });
  }
};

export const getFavouriteDetails = async (req, res) => {
  try {
    const watchlistResult = await db.query("SELECT * FROM media WHERE tmdb_id = ($1)", [req.params.tmdbId]);
    const result = watchlistResult.rows[0];

    if (!result) return res.status(404).json({ message: "Media not found" });
    let trailerKey = null;
    try {
      const language = req.query.language || 'en-US';
      const langCode = language.substring(0, 2);
      const videoUrl = `${baseURL}/movie/${result.tmdb_id}/videos?api_key=${apiKey}&language=${language}&include_video_language=${langCode},en`;
      const videoResponse = await axios.get(videoUrl);
      const videos = videoResponse.data.results || [];
      const trailer = videos.find((v) => v.site === "YouTube" && v.type === "Trailer");
      if (trailer) trailerKey = trailer.key;
    } catch (apiErr) {
      console.error("Nu am putut încărca videoclipurile de la TMDB:", apiErr.message);
    }

    res.json({
      title: result.title,
      year: result.release_year,
      type: result.media_type,
      photo: result.poster_path,
      description: result.description,
      actors: result.actors,
      mediaId: result.id,
      tmdb_id: result.tmdb_id,
      trailerKey: trailerKey,
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

export const upsertRating = async (req, res) => {
  try {
    const { username } = getSessionCredentials(req);
    const { tmdb_id, title, release_year, media_type, poster_path, description, actors, rating, comments } = req.body;
    if (!tmdb_id || rating < 1 || rating > 10) {
      return res.status(400).json({ message: "Date invalide! ID lipsă sau rating în afara intervalului 1-10." });
    }
    const mediaResult = await db.query(
      "INSERT INTO media (tmdb_id, title, release_year, media_type, poster_path, description, actors) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(tmdb_id) DO UPDATE SET title = EXCLUDED.title RETURNING id",
      [tmdb_id, title, release_year, media_type, poster_path, description, actors]
    );
    const movieId = mediaResult.rows[0].id;
    await db.query(
      `INSERT INTO ratings (user_id, movie_id, rating, comments) 
       VALUES ((SELECT id FROM users WHERE username = $1), $2, $3, $4) 
       ON CONFLICT (user_id, movie_id) 
       DO UPDATE SET rating = EXCLUDED.rating, comments = EXCLUDED.comments, created_at = CURRENT_TIMESTAMP`,
      [username, movieId, rating, comments]
    );

    res.status(200).json({ message: "Review salvat cu succes!" });
  } catch (err) {
    console.error("Eroare la salvarea rating-ului:", err);
    res.status(500).json({ message: "Eroare internă la salvarea review-ului." });
  }
};

export const getMovieRatings = async (req, res) => {
  try {
    const tmdbId = req.params.tmdbId;
    const ratingsQuery = `
      SELECT r.rating, r.comments, r.created_at, u.username
      FROM ratings r
      JOIN users u ON r.user_id = u.id
      JOIN media m ON r.movie_id = m.id
      WHERE m.tmdb_id = $1
      ORDER BY r.created_at DESC
    `;

    const result = await db.query(ratingsQuery, [tmdbId]);

    if (result.rows.length === 0) {
      return res.json({ averageRating: null, reviews: [] });
    }
    const totalRating = result.rows.reduce((sum, row) => sum + row.rating, 0);
    const averageRating = (totalRating / result.rows.length).toFixed(1);

    res.json({
      averageRating,
      reviews: result.rows
    });
  } catch (err) {
    console.error("Eroare la încărcarea rating-urilor:", err);
    res.status(500).json({ message: "Nu am putut încărca review-urile." });
  }
};