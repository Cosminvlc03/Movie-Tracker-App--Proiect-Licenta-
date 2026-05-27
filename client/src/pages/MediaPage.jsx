import React, { useState, useEffect } from "react";
import { asset } from "../utils/helpers";
import Toast from "../components/Toast";

export default function MediaPage({ media, watchlist, onAddFavourite, onRemoveFavourite, onHome }) {
  const [toast, setToast] = useState({ message: "", type: "" });
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (media && watchlist) {
      const currentId = String(media.mediaId || media.tmdb_id || media.id);
      const alreadyExists = watchlist.some(
        item => String(item.tmdb_id) === currentId
      );
      setIsAdded(alreadyExists);
    }
  }, [media, watchlist]);

  if (!media) {
    return (
      <div className="page-wrapper center">
        <h2 className="welcome-text" style={{ marginTop: "100px" }}>Nu am găsit detalii pentru acest film.</h2>
      </div>
    );
  }

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      const payload = {
        tmdb_id: media.mediaId || media.tmdb_id || media.id,
        title: media.title,
        release_year: media.year || media.release_year,
        media_type: Array.isArray(media.type) ? media.type.join(", ") : (media.type || "Film"),
        poster_path: media.photo || media.poster_path || media.image || "",
        description: media.description || "",
        actors: Array.isArray(media.actors) ? media.actors.join(", ") : (media.actors || "")
      };

      await onAddFavourite(payload);
      setIsAdded(true);
      setToast({ message: "Adăugat în watchlist!", type: "success" });
    } catch (err) {
      setToast({ message: "Eroare la adăugare.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await onRemoveFavourite(media.mediaId || media.tmdb_id || media.id);
      setIsAdded(false);
      setToast({ message: "Eliminat din watchlist.", type: "success" });
    } catch (err) {
      setToast({ message: "Eroare la eliminare.", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const imageUrl = media.photo || media.poster_path || media.image || asset("Film.svg");
  
  let genres = [];
  if (Array.isArray(media.type)) {
    genres = media.type.slice(0, 3);
  } else if (typeof media.type === "string") {
    genres = media.type.split(",").map(g => g.trim()).filter(g => g).slice(0, 3);
  }
  if (genres.length === 0) genres = ["Gen indisponibil"];

  return (
    <div className="media-details-wrapper">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      
      <div className="media-details-card">
        <div className="media-poster-container">
          <img src={imageUrl} alt={media.title} className="media-poster-large" />
        </div>
        
        <div className="media-info-container">
          <div className="media-header">
            <button className="back-title-btn" onClick={onHome} title="Înapoi la Home">
              <img src={asset("arrow_back.svg")} alt="back" className="back-arrow-icon" />
            </button>
            <h1 className="media-title">
              {media.title} <span className="media-year">({media.year || media.release_year})</span>
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
            <p className="media-actors">
              {Array.isArray(media.actors) ? media.actors.join(", ") : (media.actors || "Indisponibil.")}
            </p>
          </div>

          <div className="media-actions">
            {!isAdded ? (
              <button className="btn-primary" onClick={handleAdd} disabled={isLoading}>
                <img src={asset("Heart.svg")} alt="fav" className="btn-icon" /> 
                {isLoading ? "Se adaugă..." : "Adaugă în Watchlist"}
              </button>
            ) : (
              <>
                <button className="btn-added" disabled>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#D7263D" xmlns="http://www.w3.org/2000/svg" className="btn-icon">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  Adăugat
                </button>
                <button className="btn-danger-outline" onClick={handleRemove} disabled={isLoading}>
                  Elimină din listă
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}