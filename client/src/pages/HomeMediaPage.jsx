import React, { useState, useEffect } from "react";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";
import Toast from "../components/Toast";

export default function HomeMediaPage({ media, onHome, onRemoveFavourite }) {
  const [toast, setToast] = useState({ message: "", type: "" });
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [myRating, setMyRating] = useState(10);
  const [myComment, setMyComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchRatings = async () => {
      if (!media?.tmdb_id) return;
      try {
        const data = await api(`/ratings/${media.tmdb_id}`);
        setAverageRating(data.averageRating);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("Eroare la încărcarea recenziilor:", err);
      }
    };
    fetchRatings();
  }, [media]);

  if (!media) return null;

  let genres = [];
  if (typeof media.type === "string") {
    genres = media.type.split(",").map(g => g.trim()).filter(g => g).slice(0, 3);
  } else if (Array.isArray(media.type)) {
    genres = media.type.slice(0, 3);
  } else {
    genres = ["Gen indisponibil"];
  }

  const handleRemove = async () => {
    try {
      await onRemoveFavourite(media.tmdb_id);
      onHome();
    } catch (err) {
      setToast({ message: "Eroare la eliminare.", type: "error" });
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const payload = {
        tmdb_id: media.tmdb_id,
        title: media.title,
        release_year: media.year,
        media_type: media.type,
        poster_path: media.photo,
        description: media.description,
        actors: media.actors,
        rating: Number(myRating),
        comments: myComment
      };
      
      await api("/ratings", { method: "POST", body: JSON.stringify(payload) });
      
      setToast({ message: "Recenzia a fost salvată!", type: "success" });
      setMyComment(""); 
      
      const data = await api(`/ratings/${media.tmdb_id}`);
      setAverageRating(data.averageRating);
      setReviews(data.reviews || []);
    } catch (err) {
      setToast({ message: err.message || "Eroare la salvarea recenziei.", type: "error" });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="media-details-wrapper" style={{ flexDirection: "column", alignItems: "center", gap: "30px" }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      
      <div className="media-details-card">
        <div className="media-poster-container">
          <img src={media.photo || asset("Film.svg")} alt={media.title} className="media-poster-large" />
        </div>
        
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
            {averageRating && (
              <span className="media-badge rating-badge">
                ⭐ {averageRating} / 10
              </span>
            )}
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

      <div className="reviews-section-container">
        
        <div className="review-form-card">
          <h3>Lasă o recenzie</h3>
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="rating-select-group">
              <label>Nota ta:</label>
              <select value={myRating} onChange={(e) => setMyRating(e.target.value)} className="rating-select">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                  <option key={num} value={num}>{num} ⭐</option>
                ))}
              </select>
            </div>
            <textarea 
              placeholder="Ce părere ai despre acest titlu? (Opțional)" 
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              className="review-textarea"
              rows="3"
            />
            <button type="submit" className="btn-primary btn-submit-review" disabled={isSubmittingReview}>
              {isSubmittingReview ? "Se salvează..." : "Salvează Recenzia"}
            </button>
          </form>
        </div>

        <div className="community-reviews">
          <h3>Recenziile Comunității</h3>
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="review-card">
                  <div className="review-header">
                    <span className="review-author">@{review.username}</span>
                    <span className="review-rating">⭐ {review.rating}/10</span>
                  </div>
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString("ro-RO", { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  {review.comments && <p className="review-text">{review.comments}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reviews">Nu există nicio recenzie încă. Fii primul care lasă una!</p>
          )}
        </div>

      </div>
    </div>
  );
}