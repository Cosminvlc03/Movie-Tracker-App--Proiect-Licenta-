CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(30) NOT NULL,
    mail VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    fruit VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE media(
    id SERIAL PRIMARY KEY,
    tmdb_id INTEGER NOT NULL UNIQUE,
    title VARCHAR(50) NOT NULL,
    poster_path VARCHAR(300),
    release_year INTEGER,
    description TEXT NOT NULL,
    media_type VARCHAR(100),
    actors VARCHAR(300)
);

CREATE TABLE watchlist (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES media(id) ON DELETE CASCADE
);

CREATE TABLE ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    movie_id INTEGER REFERENCES media(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 10),
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, movie_id)
);