import React, { useState, useEffect } from "react";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";
import { useTranslation } from "react-i18next";
import Toast from "../components/Toast";

export default function HomeMediaPage({ media, onHome, onRemoveFavourite }) {
  const { t, i18n } = useTranslation();
  const [toast, setToast] = useState({ message: "", type: "" });
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [myRating, setMyRating] = useState(10);
  const [myComment, setMyComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

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
    genres = [t('mediaDetails.genresUnavailable')];
  }

  const handleRemove = async () => {
    try {
      await onRemoveFavourite(media.tmdb_id);
      onHome();
    } catch (err) {
      setToast({ message: t('mediaDetails.errorRemove'), type: "error" });
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
      
      setToast({ message: t('mediaDetails.reviewSaved'), type: "success" });
      setMyComment(""); 
      
      const data = await api(`/ratings/${media.tmdb_id}`);
      setAverageRating(data.averageRating);
      setReviews(data.reviews || []);
    } catch (err) {
      setToast({ message: err.message || t('mediaDetails.errorSaveReview'), type: "error" });
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
            <button className="back-title-btn" onClick={onHome} title={t('mediaDetails.backToHome')}>
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
            <h3>{t('mediaDetails.descriptionTitle')}</h3>
            <p className="media-description">{media.description || t('mediaDetails.noDescription')}</p>
          </div>

          <div className="media-section">
            <h3>{t('mediaDetails.castTitle')}</h3>
            <p className="media-actors">{media.actors || t('mediaDetails.noActors')}</p>
          </div>

          <div className="media-actions">
            <button className="btn-danger-outline" onClick={handleRemove}>
              {t('mediaDetails.removeFromWatchlist')}
            </button>
            {media.trailerKey && (
              <button className="btn-trailer" onClick={() => setShowTrailer(true)}>
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {t('mediaDetails.viewTrailer')}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="reviews-section-container">
        
        <div className="review-form-card">
          <h3>{t('mediaDetails.leaveReviewTitle')}</h3>
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="rating-select-group">
              <label>{t('mediaDetails.yourRating')}</label>
              <select value={myRating} onChange={(e) => setMyRating(e.target.value)} className="rating-select">
                {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(num => (
                  <option key={num} value={num}>{num} ⭐</option>
                ))}
              </select>
            </div>
            <textarea 
              placeholder={t('mediaDetails.commentPlaceholder')} 
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              className="review-textarea"
              rows="3"
            />
            <button type="submit" className="btn-primary btn-submit-review" disabled={isSubmittingReview}>
              {isSubmittingReview ? t('mediaDetails.saving') : t('mediaDetails.saveReview')}
            </button>
          </form>
        </div>

        <div className="community-reviews">
          <h3>{t('mediaDetails.communityReviewsTitle')}</h3>
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="review-card">
                  <div className="review-header">
                    <span className="review-author">@{review.username}</span>
                    <span className="review-rating">⭐ {review.rating}/10</span>
                  </div>
                  <div className="review-date">
                    {new Date(review.created_at).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })}
                  </div>
                  {review.comments && <p className="review-text">{review.comments}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-reviews">{t('mediaDetails.noReviewsYet')}</p>
          )}
        </div>
      </div>
      {showTrailer && media.trailerKey && (
        <div className="modal-overlay" onClick={() => setShowTrailer(false)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-video-btn" onClick={() => setShowTrailer(false)}>✖</button>
            <div className="video-responsive">
              <iframe 
                src={`https://www.youtube.com/embed/${media.trailerKey}?autoplay=1`} 
                title="Trailer"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}