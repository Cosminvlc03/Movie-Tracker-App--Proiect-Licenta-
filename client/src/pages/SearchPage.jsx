import React from "react";
import { asset } from "../utils/helpers";

export default function SearchPage({ media, onOpenMedia }) {
  return (
    <div className="page-wrapper">
      <h2 className="welcome-text">Rezultatele căutării tale</h2>

      {media && media.length > 0 ? (
        <div className="movies-grid">
          {media.map((movie) => (
            <div 
              className="movie-card" 
              key={movie.id} 
              onClick={() => onOpenMedia(movie.id)}
            >
              <img 
                src={movie.image || asset("Film.svg")} 
                alt={movie.title} 
                className="movie-poster" 
              />
              <div className="movie-info">
                <h3>{movie.title}</h3>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-movies">Nu am găsit niciun rezultat. Încearcă o altă căutare în bara de sus!</p>
      )}
    </div>
  );
}