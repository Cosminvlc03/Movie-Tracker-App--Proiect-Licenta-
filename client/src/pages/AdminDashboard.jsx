import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../api/apiClient";
import { asset } from "../utils/helpers";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

export default function AdminDashboard({ onLogout }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [usersList, setUsersList] = useState([]);
  const [usersExpanded, setUsersExpanded] = useState(false);
  const [reviewsList, setReviewsList] = useState([]);
  const [reviewsExpanded, setReviewsExpanded] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api("/admin/stats");
        setStats(data);
      } catch (err) {
        setError(t('admin.errorStats'));
      } {
        setLoading(false);
      }
    };

    fetchStats();
  }, [t]);

  if (loading) return <div className="page-wrapper"><h2 className="welcome-text">{t('admin.loading')}</h2></div>;
  if (error) return <div className="page-wrapper"><h2 className="welcome-text" style={{color: "var(--danger)"}}>{error}</h2></div>;

  const tooltipStyle = { backgroundColor: "var(--bg-color)", borderColor: "var(--input-border-surface)", color: "var(--text-main)" };
  const axisColor = "rgba(195, 197, 215, 0.5)";

  const toggleUsersDropdown = async () => {
    if (usersExpanded) {
      setUsersExpanded(false);
      return;
    }
    try {
      const data = await api("/admin/users");
      setUsersList(data);
      setUsersExpanded(true);
    } catch (err) {
      alert(t('admin.errorUsers'));
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(t('admin.confirmDeleteUser', { username }))) return;
    try {
      await api(`/admin/users/${userId}`, { method: "DELETE" });
      setUsersList(usersList.filter(u => u.id !== userId));
      setStats(prev => ({
        ...prev,
        kpis: { ...prev.kpis, totalUsers: prev.kpis.totalUsers - 1 }
      }));
    } catch (err) {
      alert(t('admin.errorDeleteUser'));
    }
  };

  const handleExportToExcel = () => {
    if (!stats) return;
    let csvContent = `--- ${t('admin.csv.title')} ---\n\n`;
    csvContent += `${t('admin.csv.generalIndicators')}\n`;
    csvContent += `${t('admin.csv.registeredUsers')},${stats.kpis.totalUsers}\n`;
    csvContent += `${t('admin.csv.moviesInWatchlists')},${stats.kpis.totalMovies}\n`;
    csvContent += `${t('admin.csv.reviewsLeft')},${stats.kpis.totalReviews}\n\n`;
    csvContent += `${t('admin.csv.topPopular')}\n`;
    csvContent += `${t('admin.csv.movieTitle')},${t('admin.csv.addsCount')}\n`;
    stats.topMoviesPopularity.forEach(movie => {
      csvContent += `"${movie.name}",${movie.count}\n`; 
    });
    csvContent += "\n";
    csvContent += `${t('admin.csv.topRated')}\n`;
    csvContent += `${t('admin.csv.movieTitle')},${t('admin.csv.averageRating')}\n`;
    stats.topMoviesRated.forEach(movie => {
      csvContent += `"${movie.name}",${movie.rating}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `${t('admin.csv.fileName')}_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleReviewsDropdown = async () => {
    if (reviewsExpanded) {
      setReviewsExpanded(false);
      return;
    }
    try {
      const data = await api("/admin/reviews");
      setReviewsList(data);
      setReviewsExpanded(true);
    } catch (err) {
      alert(t('admin.errorComments'));
    }
  };

  const handleDeleteReviewClick = (reviewId) => {
    setReviewToDelete(reviewId);
  };

  const confirmDeleteReview = async () => {
    if (!reviewToDelete) return;     
    try {
      await api(`/admin/reviews/${reviewToDelete}`, { method: "DELETE" });
      setReviewsList(reviewsList.filter(r => r.id !== reviewToDelete));
      setStats(prev => ({
        ...prev,
        kpis: { ...prev.kpis, totalReviews: prev.kpis.totalReviews - 1 }
      }));
      setReviewToDelete(null);
    } catch (err) {
      alert(t('admin.errorDeleteComment'));
      setReviewToDelete(null);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
        <h1 className="mainTitle" style={{ margin: 0, fontSize: "2.2rem" }}>{t('admin.mainTitle')}</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button className="btn-secondary" onClick={handleExportToExcel} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            {t('admin.exportReport')}
          </button>
          <button className="btn-danger-outline" onClick={onLogout} style={{ padding: "10px 20px" }}>
            <img src={asset("logout.svg")} alt="logout" className="btn-icon" /> {t('admin.logout')}
          </button>
        </div>
      </div>
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">{t('admin.kpiUsers')}</div>
          <div className="kpi-value">{stats.kpis.totalUsers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">{t('admin.kpiMovies')}</div>
          <div className="kpi-value">{stats.kpis.totalMovies}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">{t('admin.kpiReviews')}</div>
          <div className="kpi-value">{stats.kpis.totalReviews}</div>
        </div>
      </div>
      <div className="admin-section">
        <h2 className="admin-section-title">{t('admin.sectionContent')}</h2>
        <div className="admin-charts-grid">
          <div className="chart-container">
            <h3 className="chart-title">{t('admin.chartPopularTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topMoviesPopularity} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={axisColor} tick={{fontSize: 11}} interval={0} angle={-35} textAnchor="end" height={80} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name={t('admin.chartPopularLabel')} fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3 className="chart-title">{t('admin.chartRatedTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topMoviesRated} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={axisColor} tick={{fontSize: 11}} interval={0} angle={-35} textAnchor="end" height={80} />
                <YAxis stroke={axisColor} domain={[0, 10]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="rating" name={t('admin.chartRatedLabel')} fill="#ffb400" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="admin-section">
        <h2 className="admin-section-title">{t('admin.sectionHealth')}</h2>
        <div className="admin-charts-grid">
          <div className="chart-container">
            <h3 className="chart-title">{t('admin.chartTimelineUsersTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.usersTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke={axisColor} tick={{fontSize: 12}} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" name={t('admin.chartTimelineUsersLabel')} stroke="#4dabf7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3 className="chart-title">{t('admin.chartTimelineReviewsTitle')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.reviewsTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke={axisColor} tick={{fontSize: 12}} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" name={t('admin.chartTimelineReviewsLabel')} stroke="#69db7c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="admin-section" style={{ marginTop: "50px" }}>
        <button className="admin-dropdown-btn" onClick={toggleUsersDropdown}>
          <span>{t('admin.manageUsers', { count: stats.kpis.totalUsers })}</span>
          <span style={{ transform: usersExpanded ? "rotate(180deg)" : "rotate(0)", transition: "0.3s" }}>▼</span>
        </button>
        {usersExpanded && (
          <div className="admin-dropdown-content">
            {usersList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>{t('admin.noUsers')}</p>
            ) : (
              <div className="admin-users-list">
                <div className="admin-user-header">
                  <span>{t('admin.colUsername')}</span>
                  <span>{t('admin.colJoinDate')}</span>
                  <span>{t('admin.colAction')}</span>
                </div>
                {usersList.map(user => (
                  <div key={user.id} className="admin-user-row">
                    <span style={{ fontWeight: "500" }}>@{user.username}</span>
                    <span style={{ color: "var(--text-muted)" }}>{user.join_date}</span>
                    <button className="btn-danger-outline" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handleDeleteUser(user.id, user.username)}>
                      {t('admin.deleteAccountBtn')}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <div className="admin-section" style={{ marginTop: "30px" }}>
        <button className="admin-dropdown-btn" onClick={toggleReviewsDropdown}>
          <span>{t('admin.moderateReviewsTitle')}</span>
          <span style={{ transform: reviewsExpanded ? "rotate(180deg)" : "rotate(0)", transition: "0.3s" }}>▼</span>
        </button>

        {reviewsExpanded && (
          <div className="admin-dropdown-content">
            {reviewsList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>{t('admin.noReviews')}</p>
            ) : (
              <div className="admin-users-list">
                {reviewsList.map(review => (
                  <div key={review.id} style={{
                    background: "rgba(195, 197, 215, 0.03)", padding: "20px", borderRadius: "10px", 
                    marginBottom: "10px", border: "1px solid rgba(195, 197, 215, 0.05)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ fontSize: "15px" }}>
                        <span style={{ fontWeight: "600", color: "white" }}>@{review.username}</span> {t('admin.reviewAtMovie')} <span style={{ color: "var(--primary)", fontWeight: "500" }}>{review.movie_title}</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        {review.date} • {t('admin.ratingLabel')} <span style={{ color: "#ffb400", fontWeight: "bold" }}>{review.rating}/10</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px" }}>
                      <p style={{ fontStyle: "italic", color: "var(--text-main)", margin: 0, flex: 1, fontSize: "15px", lineHeight: "1.5" }}>
                        "{review.comments}"
                      </p>
                      <button className="btn-danger-outline" style={{ padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }} onClick={() => handleDeleteReviewClick(review.id)}>
                        {t('admin.deleteReviewBtn')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      {reviewToDelete && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t('admin.modalConfirmTitle')}</h3>
            <p>{t('admin.modalConfirmText')}</p>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setReviewToDelete(null)}>
                {t('admin.cancel')}
              </button>
              <button className="btn-danger" onClick={confirmDeleteReview}>
                {t('admin.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}