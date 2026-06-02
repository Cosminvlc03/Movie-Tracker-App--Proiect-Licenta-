import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { api } from "../api/apiClient";
import Toast from "../components/Toast";
import { asset } from "../utils/helpers";

export default function FriendsPage({ onOpenMedia }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [toast, setToast] = useState({ message: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [acceptedFriends, setAcceptedFriends] = useState([]);  
  const [expandedFriend, setExpandedFriend] = useState(null);
  const [friendToRemove, setFriendToRemove] = useState(null);

  const loadFriendsData = async () => {
    try {
      const data = await api("/friends");
      setPendingRequests(data.pendingRequests || []);
      setAcceptedFriends(data.acceptedFriends || []);
    } catch (err) {
      console.error(err);
      setToast({ message: t('friends.errorLoadData'), type: "error" });
    }
  };

  useEffect(() => {
    loadFriendsData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    try {
      const data = await api(`/friends/search?query=${encodeURIComponent(searchQuery)}`);
      setSearchResults(data.users || []);
      if (data.users.length === 0) {
        setToast({ message: t('friends.errorNoUserFound'), type: "error" });
      }
    } catch (err) {
      setToast({ message: t('friends.errorSearch'), type: "error" });
    }
  };

  const handleSendRequest = async (receiverId) => {
    try {
      await api("/friends/request", {
        method: "POST",
        body: JSON.stringify({ receiverId })
      });
      setToast({ message: t('friends.requestSent'), type: "success" });
      setSearchResults(prev => prev.filter(user => user.id !== receiverId));
    } catch (err) {
      setToast({ message: t('friends.errorSendRequest'), type: "error" });
    }
  };

  const handleRespond = async (requestId, action) => {
    try {
      await api("/friends/respond", {
        method: "PUT",
        body: JSON.stringify({ requestId, action })
      });
      const successMessage = action === "accepted" ? t('friends.requestAccepted') : t('friends.requestRejected');
      setToast({ message: successMessage, type: "success" });
      loadFriendsData();
      window.dispatchEvent(new Event("update-notifications"));
    } catch (err) {
      setToast({ message: t('friends.errorRespond'), type: "error" });
    }
  };

  const toggleDropdown = (username) => {
    setExpandedFriend(expandedFriend === username ? null : username);
  };

  const executeRemoveFriend = async () => {
    if (!friendToRemove) return;
    try {
      await api("/friends/remove", {
        method: "DELETE",
        body: JSON.stringify({ friendUsername: friendToRemove })
      });
      setToast({ message: t('friends.friendRemoved'), type: "success" });
      loadFriendsData();
      setFriendToRemove(null);
    } catch (err) {
      setToast({ message: t('friends.errorRemoveFriend'), type: "error" });
    }
  };

  return (
    <div className="page-wrapper">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      
      <h2 className="welcome-text">{t('friends.title')}</h2>

      <div className="friends-search-section">
        <form onSubmit={handleSearch} className="friends-search-form">
          <input 
            type="text" 
            placeholder={t('friends.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="local-search-input"
          />
          <button type="submit" className="btn-primary">{t('friends.searchBtn')}</button>
        </form>

        {searchResults.length > 0 && (
          <div className="friends-search-results">
            {searchResults.map(user => (
              <div key={user.id} className="search-result-card">
                <span>@{user.username}</span>
                <button onClick={() => handleSendRequest(user.id)} className="btn-secondary">{t('friends.addBtn')}</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {pendingRequests.length > 0 && (
        <div className="pending-requests-section">
          <h3>{t('friends.pendingRequests')}</h3>
          <div className="pending-grid">
            {pendingRequests.map(req => (
              <div key={req.request_id} className="pending-card">
                <span>{t('friends.wantsToConnect', { username: req.username })}</span>
                <div className="pending-actions">
                  <button onClick={() => handleRespond(req.request_id, 'accepted')} className="btn-primary" style={{ padding: "8px 16px" }}>{t('friends.acceptBtn')}</button>
                  <button onClick={() => handleRespond(req.request_id, 'rejected')} className="btn-danger-outline" style={{ padding: "8px 16px" }}>{t('friends.rejectBtn')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="accepted-friends-section">
        <h3>{t('friends.myFriendsCount', { count: acceptedFriends.length })}</h3>
        {acceptedFriends.length === 0 ? (
          <p className="text-muted">{t('friends.noFriends')}</p>
        ) : (
          <div className="friends-grid">
            {acceptedFriends.map(friend => (
              <div key={friend.username} className="friend-card">
                <div className="friend-card-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div className="friend-name">@{friend.username}</div>
                    <button 
                      className="btn-remove-friend" 
                      onClick={() => setFriendToRemove(friend.username)} 
                      title={t('friends.removeFriendTitle')}
                    >
                      <img src={asset("delete.svg")} alt="remove" className="btn-icon" />
                    </button>
                  </div>
                  <div className="friend-stats-mini">
                    <span><img src={asset("Film.svg")} alt="Watchlist" className="friend-stat-icon-2" /> {t('friends.moviesCount', { count: friend.watchlist_count || 0 })}</span>
                    <span><img src={asset("Star.svg")} alt="Rating" className="friend-stat-icon" /> {t('friends.ratingsCount', { count: friend.ratings_count || 0 })}</span>
                    <span><img src={asset("Comment.svg")} alt="Comments" className="friend-stat-icon-2" /> {t('friends.commentsCount', { count: friend.comments_count || 0 })}</span>
                  </div>
                </div>

                <button 
                  className={`btn-expand-watchlist ${expandedFriend === friend.username ? 'active' : ''}`}
                  onClick={() => toggleDropdown(friend.username)}
                >
                  {expandedFriend === friend.username ? t('friends.hideWatchlist') : t('friends.viewWatchlist')}
                </button>
                {expandedFriend === friend.username && (
                  <div className="friend-watchlist-dropdown">
                    {friend.watchlist_movies && friend.watchlist_movies.length > 0 ? (
                      friend.watchlist_movies.map(movie => (
                        <div 
                          key={movie.tmdb_id} 
                          className="friend-movie-item"
                          onClick={() => onOpenMedia(movie.tmdb_id)}
                        >
                          {movie.title}
                        </div>
                      ))
                    ) : (
                      <p style={{ padding: "15px", color: "var(--text-muted)", fontSize: "14px" }}>
                        {t('friends.emptyWatchlist')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
        {friendToRemove && (
        <div className="modal-overlay" onClick={() => setFriendToRemove(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{t('friends.modalConfirmTitle')}</h3>
            <p style={{ marginBottom: "30px", color: "var(--text-muted)", fontSize: "16px" }}>
              {t('friends.modalConfirmText', { username: friendToRemove })}
            </p>
            
            <div className="modal-buttons">
              <button type="button" className="btn-secondary" onClick={() => setFriendToRemove(null)}>
                {t('friends.cancel')}
              </button>
              <button type="button" className="btn-danger" onClick={executeRemoveFriend}>
                {t('friends.confirmRemove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}