import React from "react";
import { getPosterSrc } from "../utils/helpers";

export default function HomePage({ username, watchlist, onOpenMedia }) {
  return (
    <div className="page-wrapper">
      <h2 className="welcome-text">Ce filme urmărim astăzi, {username}?</h2>
      
      <div className="movies-grid">
        {watchlist?.length > 0 ? (
          watchlist.map((item) => (
            <div className="movie-card" key={item.tmdb_id} onClick={() => onOpenMedia(item.tmdb_id)}>
              <img src={getPosterSrc(item.poster_path)} alt={item.title} className="movie-poster" />
              <div className="movie-info">
                <h3>{item.title}</h3>
              </div>
            </div>
          ))
        ) : (
          <p className="no-movies">Nu ai niciun film în watchlist. Caută unul sus!</p>
        )}
      </div>
    </div>
  );
}