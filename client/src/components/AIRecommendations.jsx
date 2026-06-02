import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/apiClient";

const LoaderIcon = () => (
  <svg className="ai-spinner" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"></line>
    <line x1="12" y1="18" x2="12" y2="22"></line>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
    <line x1="2" y1="12" x2="6" y2="12"></line>
    <line x1="18" y1="12" x2="22" y2="12"></line>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
  </svg>
);

export default function AIRecommendations({ onOpenMedia }) {
  const { t } = useTranslation();
  const [data, setData] = useState({ recommendations: [], isPersonalized: false });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const response = await api("/ai/recommendations");
        setData(response);
      } catch (err) {
        console.error("Eroare la recomandări:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (isLoading) {
    return (
      <div className="ai-rec-container">
        <div className="ai-rec-loader">
          <LoaderIcon />
          <span>{t('aiRecommendations.loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !data.recommendations || data.recommendations.length === 0) {
    return null; 
  }

  return (
    <div className="ai-rec-container">
      <h2 className="ai-rec-title">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px' }}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
        {data.isPersonalized 
          ? t('aiRecommendations.titlePersonalized') 
          : t('aiRecommendations.titleDefault')}
      </h2>
      
      <div className="ai-rec-carousel">
        {data.recommendations.map((movie) => (
          <div 
            key={movie.id} 
            className="ai-rec-card"
            onClick={() => onOpenMedia(movie.id)}
          >
            <div className="ai-rec-poster-wrapper">
              <img 
                src={movie.photo || "https://via.placeholder.com/300x450?text=Poster+Indisponibil"} 
                alt={movie.title} 
                className="ai-rec-poster"
              />
              <div className="ai-rec-overlay">{t('aiRecommendations.overlay')}</div>
            </div>
            <div className="ai-rec-info">
              <h4 className="ai-rec-movie-title">{movie.title} ({movie.year})</h4>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}