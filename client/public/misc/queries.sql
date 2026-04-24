CREATE TABLE users (
	id SERIAL PRIMARY KEY,
	username VARCHAR(30) NOT NULL,
	mail VARCHAR(50) NOT NULL,
	password VARCHAR(100) NOT NULL,
	fruit VARCHAR(30) NOT NULL
);

CREATE TABLE media(
	id SERIAL PRIMARY KEY,
	tmdb_id INTEGER NOT NULL UNIQUE,
	title VARCHAR(50) NOT NULL,
	poster_path VARCHAR(300),
	release_year INTEGER,
	description TEXT NOT NULL,
	media_type VARCHAR(100),
	actors VARCHAR(300),
	user_rating INTEGER
);

CREATE TABLE watchlist (
	id SERIAL PRIMARY KEY,
	user_id INTEGER REFERENCES users(id),
	movie_id INTEGER REFERENCES media(id)
);
