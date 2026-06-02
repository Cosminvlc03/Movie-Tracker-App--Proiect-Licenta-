import React from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../utils/helpers";

export default function SearchPage({ media, onOpenMedia }) {
  const { t } = useTranslation();

  return (
    <div className="page-wrapper">
      <h2 className="welcome-text">{t('search.resultsTitle')}</h2>

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
        <p className="no-movies">{t('search.noResults')}</p>
      )}
    </div>
  );
}