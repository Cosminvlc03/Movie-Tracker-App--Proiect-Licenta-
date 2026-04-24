import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";
import pg from "pg";
import session from "express-session";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({path: path.resolve(__dirname, "../.env")});

const app = express();
const port = process.env.PORT || 3000;

const requiredEnv = ["API_KEY", "DB_PASS", "SESSION_SECRET"];
for (const key of requiredEnv) {
  if(!process.env[key]){
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const apiKey = process.env.API_KEY;
const baseURL = "https://api.themoviedb.org/3";

app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = new pg.Client({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "movies",
  password: process.env.DB_PASS,
  port: Number(process.env.DB_PORT || 5432),
});

db.connect();

function preventBrowserCache(req, res, next) {
  res.set("Cache-Control", "no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0");
  res.set("Expires", "0");
  res.set("Pragma", "no-cache");
  next();
}

function requireAuth(req, res, next) {
  if (!req.session?.isAuthenticated) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

function getSessionCredentials(req) {
  return {
    username: req.session.username,
    password: req.session.password,
  };
}

async function getWatchlist(username, password) {
  const userMovies = `
    SELECT m.tmdb_id, m.title, m.release_year, m.media_type, m.poster_path, m.description, m.actors
    FROM media m
    JOIN watchlist w ON m.id = w.movie_id
    JOIN users u ON w.user_id = u.id
    WHERE u.username = ($1) AND u.password = ($2)
  `;
  const watchlistResult = await db.query(userMovies, [username, password]);
  return watchlistResult.rows;
}

async function getMovieDetails(mediaId, mediaType = "movie") {
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
    console.log(`Error fetching details for ID ${mediaId}`, err);
    return null;
  }
}

async function searchAndGetDetails(query, noOfResults) {
  console.log(`Searching for ${query}`);
  try {
    const searchUrl = `${baseURL}/search/multi?api_key=${apiKey}&query=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl);
    const searchResults = response.data.results;

    if (!searchResults || searchResults.length === 0) {
      console.log("No results found");
      return [];
    }

    const mediaToFetch = searchResults
      .filter((result) => result.media_type === "movie")
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, noOfResults);

    const selectedMedia = mediaToFetch.map((result) => getMovieDetails(result.id, result.media_type));
    const detailedResults = await Promise.all(selectedMedia);
    return detailedResults.filter(Boolean);
  } catch (err) {
    console.log(err);
    return [];
  }
}

app.get("/api/session", preventBrowserCache, async (req, res) => {
  if (!req.session?.isAuthenticated) {
    return res.json({ isAuthenticated: false });
  }

  const { username, password } = getSessionCredentials(req);
  const watchlist = await getWatchlist(username, password);
  res.json({ isAuthenticated: true, username, watchlist });
});

app.post("/api/login", preventBrowserCache, async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.query("SELECT * FROM users WHERE username = ($1) AND password = ($2)", [username, password]);

    if (result.rows.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    req.session.isAuthenticated = true;
    req.session.username = result.rows[0].username;
    req.session.password = result.rows[0].password;

    const watchlist = await getWatchlist(username, password);
    res.json({ username, watchlist });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Login failed" });
  }
});

app.post("/api/signup", async (req, res) => {
  try {
    const { username, email, password, fruit } = req.body;
    if (!username || !email || !password || !fruit) {
      return res.status(400).json({ message: "All fields are required" });
    }

    await db.query("INSERT INTO users (username, mail, password, fruit) VALUES (($1), ($2), ($3), ($4))", [
      username,
      email,
      password,
      fruit,
    ]);

    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Account creation failed" });
  }
});

app.post("/api/recover-password", async (req, res) => {
  try {
    const { email, fruit } = req.body;
    const result = await db.query("SELECT password FROM users WHERE fruit = ($1) AND mail = ($2)", [fruit, email]);

    if (result.rows.length > 0) {
      return res.json({ verificationSuccess: true, passwordToShow: result.rows[0].password });
    }

    res.json({ verificationSuccess: false });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Password recovery failed" });
  }
});

app.get("/api/account", requireAuth, async (req, res) => {
  try {
    const { username, password } = getSessionCredentials(req);
    const result = await db.query("SELECT mail, fruit FROM users WHERE username = ($1) AND password = ($2)", [username, password]);
    const items = result.rows[0];
    res.json({ username, mail: items.mail, fruit: items.fruit });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not load account" });
  }
});

app.post("/api/logout", requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log("Eroare la distrugerea sesiunii:", err);
      return res.status(500).json({ message: "Logout failed" });
    }
    res.json({ message: "Logged out" });
  });
});

app.get("/api/watchlist", requireAuth, async (req, res) => {
  try {
    const { username, password } = getSessionCredentials(req);
    const watchlist = await getWatchlist(username, password);
    res.json({ username, watchlist });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not load watchlist" });
  }
});

app.post("/api/search", requireAuth, async (req, res) => {
  try {
    const details = await searchAndGetDetails(req.body.search, 4);
    const media = details.map((item) => ({
      title: item.title,
      image: item.photo && item.photo.trim() !== "" ? item.photo.trim() : null,
      id: item.id,
    }));
    res.json({ media });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Search failed" });
  }
});

app.get("/api/media/:mediaId", requireAuth, async (req, res) => {
  try {
    const details = await getMovieDetails(req.params.mediaId, "movie");
    if (!details) {
      return res.status(404).json({ message: "Media not found" });
    }

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
    console.log(err);
    res.status(500).json({ message: "Could not load media details" });
  }
});

app.post("/api/favourite", requireAuth, async (req, res) => {
  try {
    const { username, password } = getSessionCredentials(req);
    const { mediaId, title, year, type, photo, description, actors } = req.body;

    await db.query(
      "INSERT INTO media (tmdb_id, title, release_year, media_type, poster_path, description, actors) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT(tmdb_id) DO UPDATE SET title = EXCLUDED.title RETURNING id",
      [mediaId, title, year, type, photo, description, Array.isArray(actors) ? actors.join(", ") : actors]
    );

    await db.query(
      "INSERT INTO watchlist (user_id, movie_id) VALUES ((SELECT id FROM users WHERE username = ($1) AND password = ($2)), (SELECT id FROM media WHERE tmdb_id = ($3))) ON CONFLICT DO NOTHING",
      [username, password, mediaId]
    );

    const watchlist = await getWatchlist(username, password);
    res.status(201).json({ username, watchlist });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not add favourite" });
  }
});

app.get("/api/watchlist/media/:tmdbId", requireAuth, async (req, res) => {
  try {
    const watchlistResult = await db.query("SELECT * FROM media WHERE tmdb_id = ($1)", [req.params.tmdbId]);
    const result = watchlistResult.rows[0];

    if (!result) {
      return res.status(404).json({ message: "Media not found" });
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
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not load favourite details" });
  }
});

app.delete("/api/favourite/:tmdbId", requireAuth, async (req, res) => {
  try {
    const { username, password } = getSessionCredentials(req);
    await db.query(
      "DELETE FROM watchlist WHERE user_id = (SELECT id FROM users WHERE username = ($1) AND password = ($2)) AND movie_id = (SELECT id FROM media WHERE tmdb_id = ($3))",
      [username, password, req.params.tmdbId]
    );

    const watchlist = await getWatchlist(username, password);
    res.json({ username, watchlist });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Could not remove favourite" });
  }
});

const clientDistPath = path.join(__dirname, "../client/dist");
app.use(express.static(clientDistPath));
app.use("/misc", express.static(path.join(__dirname, "../client/public/misc")));

app.get("*", (req, res) => {
  res.sendFile(path.join(clientDistPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Movie Tracker API listening at http://localhost:${port}`);
});
