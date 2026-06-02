import React, { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { getPosterSrc, asset } from "../utils/helpers";
import AIRecommendations from "../components/AIRecommendations";

export default function HomePage({ username, watchlist, onOpenMedia, onOpenNewMedia }) {
  const { t } = useTranslation();
  const [sortOption, setSortOption] = useState("default");
  const [isFilterBarOpen, setIsFilterBarOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");

  const uniqueGenres = useMemo(() => {
    if (!watchlist) return [];
    const genres = new Set();
    watchlist.forEach(item => {
      if (item.media_type) {
        const types = item.media_type.split(",").map(g => g.trim()).filter(Boolean);
        types.forEach(t => genres.add(t));
      }
    });
    return Array.from(genres).sort();
  }, [watchlist]);

  const processedWatchlist = useMemo(() => {
    if (!watchlist) return [];
    let filtered = watchlist.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(localSearch.toLowerCase());
      const matchesGenre = selectedGenre === "All" || (item.media_type && item.media_type.includes(selectedGenre));
      return matchesSearch && matchesGenre;
    });
    switch (sortOption) {
      case "title_asc":
        return filtered.sort((a, b) => a.title.localeCompare(b.title));
      case "title_desc":
        return filtered.sort((a, b) => b.title.localeCompare(a.title));
      case "year_desc":
        return filtered.sort((a, b) => (b.release_year || 0) - (a.release_year || 0));
      case "year_asc":
        return filtered.sort((a, b) => (a.release_year || 0) - (b.release_year || 0));
      case "rating_desc":
        return filtered.sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));
      case "reviews_desc":
        return filtered.sort((a, b) => Number(b.review_count || 0) - Number(a.review_count || 0));
      default:
        return filtered; 
    }
  }, [watchlist, sortOption, localSearch, selectedGenre]);

  return (
    <div className="page-wrapper">
      <div className="home-header">
        <div className="welcome-container">
          <h2 className="welcome-text">{t('home.welcome', { name: username })}</h2>
          {watchlist?.length > 0 && (
            <button 
              className={`toggle-filter-btn ${isFilterBarOpen ? "open" : ""}`}
              onClick={() => setIsFilterBarOpen(!isFilterBarOpen)}
              title="Căutare și Filtrare Locală"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
          )}
        </div>
        
        {watchlist?.length > 0 && (
          <div className="sort-container">
            <label htmlFor="sortWatchlist">{t('home.sortLabel')}</label>
            <select 
              id="sortWatchlist"
              className="sort-select" 
              value={sortOption} 
              onChange={(e) => setSortOption(e.target.value)}
            >
              <option value="default">{t('home.sortRecent')}</option>
              <option value="title_asc">{t('home.sortAlphaAsc')}</option>
              <option value="title_desc">{t('home.sortAlphaDesc')}</option>
              <option value="year_desc">{t('home.sortYearNew')}</option>
              <option value="year_asc">{t('home.sortYearOld')}</option>
              <option value="rating_desc">{t('home.sortRating')}</option>
              <option value="reviews_desc">{t('home.sortReviews')}</option>
            </select>
          </div>
        )}
      </div>

      {isFilterBarOpen && (
        <div className="local-filter-bar">
          <div className="local-search-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder={t('home.searchLocalPlaceholder')} 
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="local-search-input"
            />
          </div>

          <div className="genres-scroll-container">
            <button 
              className={`genre-chip ${selectedGenre === "All" ? "active" : ""}`}
              onClick={() => setSelectedGenre("All")}
            >
              {t('home.allGenres')}
            </button>
            {uniqueGenres.map((genre, idx) => (
              <button 
                key={idx}
                className={`genre-chip ${selectedGenre === genre ? "active" : ""}`}
                onClick={() => setSelectedGenre(genre)}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="movies-grid">
        {processedWatchlist.length > 0 ? (
          processedWatchlist.map((item) => (
            <div className="movie-card" key={item.tmdb_id} onClick={() => onOpenMedia(item.tmdb_id)}>
              <img src={getPosterSrc(item.poster_path)} alt={item.title} className="movie-poster" />
              <div className="movie-info">
                <h3>{item.title}</h3>
                <div className="movie-stats">
                  <span className="stat-badge"><img src={asset("Star.svg")} className="btn-icon star-icon" alt="Rating" /> {item.average_rating > 0 ? item.average_rating : "N/A"}</span>
                  <span className="stat-badge"><img src={asset("Comment.svg")} className="btn-icon" alt="Reviews" /> {item.review_count || 0}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-movies">
            {watchlist?.length > 0 
              ? t('home.noMoviesFilter') 
              : t('home.noMoviesEmpty')}
          </p>
        )}
      </div>
      
      <AIRecommendations onOpenMedia={onOpenNewMedia} />

    </div>
  );
}