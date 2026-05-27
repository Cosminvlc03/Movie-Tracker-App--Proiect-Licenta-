import React, { useState } from "react";
import { asset } from "../utils/helpers";
import Toast from "../components/Toast";

export default function MediaPage({ media, onAddFavourite }) {
  const [toast, setToast] = useState({ message: "", type: "" });

  if (!media) {
    return (
      <div className="page-wrapper center">
        <h2 className="welcome-text" style={{ marginTop: "100px" }}>Nu am găsit detalii pentru acest film.</h2>
      </div>
    );
  }

  const handleAdd = async () => {
    try {
      await onAddFavourite(media);
      setToast({ message: "Filmul a fost adăugat în watchlist!", type: "success" });
    } catch (err) {
      setToast({ message: "Eroare la adăugarea filmului.", type: "error" });
    }
  };

  const imageUrl = media.photo || media.poster_path || media.image || asset("Film.svg");
  let genres = [];
  if (Array.isArray(media.type)) {
    genres = media.type.slice(0, 3);
  } else if (typeof media.type === "string") {
    genres = media.type
      .split(",")
      .map(g => g.trim())
      .filter(g => g)
      .slice(0, 3);
  }

  if (genres.length === 0) {
    genres = ["Gen indisponibil"];
  }

  return (
    <div className="media-details-wrapper">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      <div className="media-details-card">
        <div className="media-poster-container">
          <img 
            src={imageUrl} 
            alt={media.title} 
            className="media-poster-large" 
          />
        </div>

        <div className="media-info-container">
          <h1 className="media-title">
            {media.title} <span className="media-year">({media.year || media.release_year})</span>
          </h1>
          <div className="media-badges">
            {genres.map((genre, index) => (
              <span key={index} className="media-badge">{genre}</span>
            ))}
          </div>
  
          <div className="media-section">
            <h3>Descriere</h3>
            <p className="media-description">
              {media.description || "Nicio descriere disponibilă pentru acest titlu."}
            </p>
          </div>
          
          <div className="media-section">
            <h3>Distribuție</h3>
            <p className="media-actors">
              {Array.isArray(media.actors) ? media.actors.join(", ") : (media.actors || "Informații indisponibile.")}
            </p>
          </div>

          <button className="btn-primary" onClick={handleAdd}>
            <img src={asset("Heart.svg")} alt="fav" className="btn-icon" />
            Adaugă în Watchlist
          </button>
        </div>
      </div>
    </div>
  );
}