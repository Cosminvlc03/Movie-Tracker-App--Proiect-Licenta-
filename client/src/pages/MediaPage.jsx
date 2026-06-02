import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";
import Toast from "../components/Toast";

export default function MediaPage({ media, watchlist, onAddFavourite, onRemoveFavourite, onHome }) {
  const { t, i18n } = useTranslation();
  const [toast, setToast] = useState({ message: "", type: "" });
  const [isAdded, setIsAdded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [myRating, setMyRating] = useState(10);
  const [myComment, setMyComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const currentId = media ? String(media.mediaId || media.tmdb_id || media.id) : null;

  useEffect(() => {
    if (media && watchlist) {
      const alreadyExists = watchlist.some(item => String(item.tmdb_id) === currentId);
      setIsAdded(alreadyExists);
    }
  }, [media, watchlist, currentId]);
  useEffect(() => {
    const fetchRatings = async () => {
      if (!currentId) return;
      try {
        const data = await api(`/ratings/${currentId}`);
        setAverageRating(data.averageRating);
        setReviews(data.reviews || []);
      } catch (err) {
        console.error("Eroare la încărcarea recenziilor:", err);
      }
    };
    fetchRatings();
  }, [currentId]);

  if (!media) {
    return (
      <div className="page-wrapper center">
        <h2 className="welcome-text" style={{ marginTop: "100px" }}>{t('mediaDetails.noDetailsFound')}</h2>
      </div>
    );
  }

  const basePayload = {
    tmdb_id: currentId,
    title: media.title,
    release_year: media.year || media.release_year,
    media_type: Array.isArray(media.type) ? media.type.join(", ") : (media.type || "Film"),
    poster_path: media.photo || media.poster_path || media.image || "",
    description: media.description || "",
    actors: Array.isArray(media.actors) ? media.actors.join(", ") : (media.actors || "")
  };

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      await onAddFavourite(basePayload);
      setIsAdded(true);
      setToast({ message: t('mediaDetails.addedToWatchlist'), type: "success" });
    } catch (err) {
      setToast({ message: t('mediaDetails.errorAdd'), type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await onRemoveFavourite(currentId);
      setIsAdded(false);
      setToast({ message: t('mediaDetails.removedFromWatchlist'), type: "success" });
    } catch (err) {
      setToast({ message: t('mediaDetails.errorRemove'), type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setIsSubmittingReview(true);
    try {
      const payload = { ...basePayload, rating: Number(myRating), comments: myComment };
      await api("/ratings", { method: "POST", body: JSON.stringify(payload) });
      setToast({ message: t('mediaDetails.reviewSaved'), type: "success" });
      setMyComment("");
      const data = await api(`/ratings/${currentId}`);
      setAverageRating(data.averageRating);
      setReviews(data.reviews || []);
    } catch (err) {
      setToast({ message: err.message || t('mediaDetails.errorSaveReview'), type: "error" })
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const imageUrl = media.photo || media.poster_path || media.image || asset("Film.svg");
  let genres = Array.isArray(media.type) ? media.type.slice(0, 3) : (typeof media.type === "string" ? media.type.split(",").map(g => g.trim()).filter(g => g).slice(0, 3) : [t('mediaDetails.genresUnavailable')]);

  return (
    <div className="media-details-wrapper" style={{ flexDirection: "column", alignItems: "center", gap: "30px" }}>
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      <div className="media-details-card">
        <div className="media-poster-container">
          <img src={imageUrl} alt={media.title} className="media-poster-large" />
        </div>
        
        <div className="media-info-container">
          <div className="media-header">
            <button className="back-title-btn" onClick={onHome} title={t('mediaDetails.backToHome')}>
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
            <p className="media-actors">
              {Array.isArray(media.actors) ? media.actors.join(", ") : (media.actors || t('mediaDetails.noActors'))}
            </p>
          </div>

          <div className="media-actions">
            {!isAdded ? (
              <button className="btn-primary" onClick={handleAdd} disabled={isLoading}>
                <img src={asset("Heart.svg")} alt="fav" className="btn-icon" /> 
                {isLoading ? t('mediaDetails.adding') : t('mediaDetails.addToWatchlist')}
              </button>
            ) : (
              <>
                <button className="btn-added" disabled>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#D7263D" xmlns="http://www.w3.org/2000/svg" className="btn-icon">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                  {t('mediaDetails.added')}
                </button>
                <button className="btn-danger-outline" onClick={handleRemove} disabled={isLoading}>
                  {t('mediaDetails.removeFromWatchlist')}
                </button>
              </>
            )}
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