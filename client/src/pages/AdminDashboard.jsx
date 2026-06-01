import React, { useState, useEffect } from "react";
import { api } from "../api/apiClient";
import { asset } from "../utils/helpers";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

export default function AdminDashboard({ onLogout }) {
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
        setError("Nu am putut încărca statisticile. Asigură-te că ești administrator.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <div className="page-wrapper"><h2 className="welcome-text">Se încarcă panoul de control...</h2></div>;
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
      alert("Eroare la încărcarea utilizatorilor.");
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (!window.confirm(`ATENȚIE! Ești sigur că vrei să ștergi definitiv utilizatorul @${username} și toate datele sale? Acțiunea este ireversibilă.`)) return;
    try {
      await api(`/admin/users/${userId}`, { method: "DELETE" });
      setUsersList(usersList.filter(u => u.id !== userId));
      setStats(prev => ({
        ...prev,
        kpis: { ...prev.kpis, totalUsers: prev.kpis.totalUsers - 1 }
      }));
    } catch (err) {
      alert("Eroare la ștergerea utilizatorului.");
    }
  };

  const handleExportToExcel = () => {
    if (!stats) return;
    let csvContent = "--- RAPORT MYMOVIETRACKER ---\n\n";
    csvContent += "INDICATORI GENERALI\n";
    csvContent += `Utilizatori inregistrati,${stats.kpis.totalUsers}\n`;
    csvContent += `Filme adaugate in liste,${stats.kpis.totalMovies}\n`;
    csvContent += `Recenzii lasate,${stats.kpis.totalReviews}\n\n`;
    csvContent += "TOP 5 FILME (DUPA POPULARITATE)\n";
    csvContent += "Titlu Film,Numar Adaugari\n";
    stats.topMoviesPopularity.forEach(movie => {
      csvContent += `"${movie.name}",${movie.count}\n`; 
    });
    csvContent += "\n";
    csvContent += "TOP 5 FILME (DUPA RATING)\n";
    csvContent += "Titlu Film,Nota Medie\n";
    stats.topMoviesRated.forEach(movie => {
      csvContent += `"${movie.name}",${movie.rating}\n`;
    });
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const today = new Date().toISOString().split('T')[0];
    link.setAttribute("download", `Raport_MyMovieTracker_${today}.csv`);
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
      alert("Eroare la încărcarea comentariilor.");
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
      alert("Eroare la ștergerea comentariului.");
      setReviewToDelete(null);
    }
  };

  return (
    <div className="page-wrapper" style={{ padding: "40px", maxWidth: "1400px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", flexWrap: "wrap", gap: "20px" }}>
        <h1 className="mainTitle" style={{ margin: 0, fontSize: "2.2rem" }}>Panou de Control</h1>
        <div style={{ display: "flex", gap: "15px" }}>
          <button className="btn-secondary" onClick={handleExportToExcel} style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Exportă Raport (CSV)
          </button>
          <button className="btn-danger-outline" onClick={onLogout} style={{ padding: "10px 20px" }}>
            <img src={asset("logout.svg")} alt="logout" className="btn-icon" /> Deconectare
          </button>
        </div>
      </div>
      <div className="admin-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">Utilizatori Înregistrați</div>
          <div className="kpi-value">{stats.kpis.totalUsers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Filme în Watchlist-uri</div>
          <div className="kpi-value">{stats.kpis.totalMovies}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Recenzii Lăsate</div>
          <div className="kpi-value">{stats.kpis.totalReviews}</div>
        </div>
      </div>
      <div className="admin-section">
        <h2 className="admin-section-title">Performanță Conținut</h2>
        <div className="admin-charts-grid">
          <div className="chart-container">
            <h3 className="chart-title">Top 5 Cele Mai Populare Filme (Watchlist)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topMoviesPopularity} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={axisColor} tick={{fontSize: 11}} interval={0} angle={-35} textAnchor="end" height={80} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" name="Adăugări în liste" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Top 5 Cele Mai Bine Cotate Filme</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.topMoviesRated} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke={axisColor} tick={{fontSize: 11}} interval={0} angle={-35} textAnchor="end" height={80} />
                <YAxis stroke={axisColor} domain={[0, 10]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="rating" name="Nota Medie" fill="#ffb400" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

        </div>
      </div>
      <div className="admin-section">
        <h2 className="admin-section-title">Sănătate Platformă (Ultimele 30 zile)</h2>
        <div className="admin-charts-grid">
          <div className="chart-container">
            <h3 className="chart-title">Evoluție Înregistrări Noi</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.usersTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke={axisColor} tick={{fontSize: 12}} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" name="Utilizatori noi" stroke="#4dabf7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="chart-container">
            <h3 className="chart-title">Evoluție Activitate (Recenzii lăsate)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.reviewsTimeline} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke={axisColor} tick={{fontSize: 12}} />
                <YAxis stroke={axisColor} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="count" name="Recenzii noi" stroke="#69db7c" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="admin-section" style={{ marginTop: "50px" }}>
        <button className="admin-dropdown-btn" onClick={toggleUsersDropdown}>
          <span>Gestionează Utilizatorii ({stats.kpis.totalUsers})</span>
          <span style={{ transform: usersExpanded ? "rotate(180deg)" : "rotate(0)", transition: "0.3s" }}>▼</span>
        </button>
        {usersExpanded && (
          <div className="admin-dropdown-content">
            {usersList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>Nu există utilizatori înregistrați.</p>
            ) : (
              <div className="admin-users-list">
                <div className="admin-user-header">
                  <span>Nume Utilizator</span>
                  <span>Data Înregistrării</span>
                  <span>Acțiune</span>
                </div>
                {usersList.map(user => (
                  <div key={user.id} className="admin-user-row">
                    <span style={{ fontWeight: "500" }}>@{user.username}</span>
                    <span style={{ color: "var(--text-muted)" }}>{user.join_date}</span>
                    <button className="btn-danger-outline" style={{ padding: "6px 12px", fontSize: "12px" }} onClick={() => handleDeleteUser(user.id, user.username)}>
                      Șterge Cont
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
          <span>Moderare Comentarii Recente</span>
          <span style={{ transform: reviewsExpanded ? "rotate(180deg)" : "rotate(0)", transition: "0.3s" }}>▼</span>
        </button>

        {reviewsExpanded && (
          <div className="admin-dropdown-content">
            {reviewsList.length === 0 ? (
              <p style={{ color: "var(--text-muted)", padding: "20px" }}>Nu există comentarii de moderat.</p>
            ) : (
              <div className="admin-users-list">
                {reviewsList.map(review => (
                  <div key={review.id} style={{
                    background: "rgba(195, 197, 215, 0.03)", padding: "20px", borderRadius: "10px", 
                    marginBottom: "10px", border: "1px solid rgba(195, 197, 215, 0.05)"
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
                      <div style={{ fontSize: "15px" }}>
                        <span style={{ fontWeight: "600", color: "white" }}>@{review.username}</span> la filmul <span style={{ color: "var(--primary)", fontWeight: "500" }}>{review.movie_title}</span>
                      </div>
                      <div style={{ color: "var(--text-muted)", fontSize: "13px" }}>
                        {review.date} • Nota: <span style={{ color: "#ffb400", fontWeight: "bold" }}>{review.rating}/10</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "20px" }}>
                      <p style={{ fontStyle: "italic", color: "var(--text-main)", margin: 0, flex: 1, fontSize: "15px", lineHeight: "1.5" }}>
                        "{review.comments}"
                      </p>
                      <button className="btn-danger-outline" style={{ padding: "8px 16px", fontSize: "13px", whiteSpace: "nowrap" }} onClick={() => handleDeleteReviewClick(review.id)}>
                        Șterge Comentariu
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
            <h3>Confirmare Ștergere</h3>
            <p>Ești sigur că vrei să ștergi definitiv acest comentariu? Acțiunea este ireversibilă.</p>
            <div className="modal-buttons">
              <button className="btn-secondary" onClick={() => setReviewToDelete(null)}>
                Anulează
              </button>
              <button className="btn-danger" onClick={confirmDeleteReview}>
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}