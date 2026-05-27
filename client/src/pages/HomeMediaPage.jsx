import React from "react";
import { asset } from "../utils/helpers";

export default function HomeMediaPage({ media, onHome, onRemoveFavourite }) {
  if (!media) return null;

  // Procesare genuri pentru a fi la fel ca pe MediaPage
  let genres = [];
  if (typeof media.type === "string") {
    genres = media.type.split(",").map(g => g.trim()).filter(g => g).slice(0, 3);
  } else if (Array.isArray(media.type)) {
    genres = media.type.slice(0, 3);
  } else {
    genres = ["Gen indisponibil"];
  }

  const handleRemove = () => {
    onRemoveFavourite(media.tmdb_id);
    onHome(); // Redirecționăm la Home după eliminare
  };

  return (
    <div className="media-details-wrapper">
      <div className="media-details-card">
        {/* Posterul */}
        <div className="media-poster-container">
          <img src={media.photo || asset("Film.svg")} alt={media.title} className="media-poster-large" />
        </div>
        
        {/* Detaliile */}
        <div className="media-info-container">
          <div className="media-header">
            <button className="back-title-btn" onClick={onHome} title="Înapoi la Home">
              <img src={asset("arrow_back.svg")} alt="back" className="back-arrow-icon" />
            </button>
            <h1 className="media-title">
              {media.title} <span className="media-year">({media.year})</span>
            </h1>
          </div>
          
          <div className="media-badges">
            {genres.map((genre, index) => (
              <span key={index} className="media-badge">{genre}</span>
            ))}
          </div>
          
          <div className="media-section">
            <h3>Descriere</h3>
            <p className="media-description">{media.description || "Nicio descriere disponibilă."}</p>
          </div>
          
          <div className="media-section">
            <h3>Distribuție</h3>
            <p className="media-actors">{media.actors || "Indisponibil."}</p>
          </div>

          <div className="media-actions">
            <button className="btn-danger-outline" onClick={handleRemove}>
              Elimină din watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}