import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";

export default function Navbar({ onSearch, onAccount, onLogout }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [panelOpen, setPanelOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api("/friends/notifications");
        setPendingCount(data.pendingCount || 0);
      } catch (err) {
        console.error(err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000); 
    window.addEventListener("update-notifications", fetchNotifications);
    return () => {
      clearInterval(interval); 
      window.removeEventListener("update-notifications", fetchNotifications);
    };
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      onSearch(search);
      setSearch("");
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("/home")}>
          MyMovieTracker
        </div>
        <form className="nav-search" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder="Caută filme sau seriale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="nav-actions">
          <button className="nav-account-btn" onClick={() => setPanelOpen(true)} style={{ position: 'relative' }}>
            <img src={asset("account_circle.svg")} alt="Account" />
            {pendingCount > 0 && <span className="nav-notification-dot"></span>}
          </button>
        </div>
      </nav>
      
      <div className={`nav-side-panel ${panelOpen ? "open" : ""}`}>
        <button className="close-panel-btn" onClick={() => setPanelOpen(false)}>
          <img src={asset("arrow_back.svg")} alt="Close" />
        </button>
        
        <button className="panel-link" onClick={() => { setPanelOpen(false); navigate("/friends"); }}>
          Prieteni
          {pendingCount > 0 && <span className="notification-badge">{pendingCount}</span>}
        </button>
        <button className="panel-link" onClick={() => { setPanelOpen(false); onAccount(); }}>
          Detalii Cont
        </button>
        <button className="panel-link" onClick={() => { setPanelOpen(false); navigate("/about"); }}>
          Despre
        </button>
        <button className="panel-link danger" onClick={() => setLogoutOpen(true)}>
          Deconectare
        </button>
      </div>
      {logoutOpen && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <h3>Ești sigur că vrei să ieși?</h3>
            <div className="logout-actions">
              <button className="btn-confirm" onClick={() => { setLogoutOpen(false); onLogout(); }}>Da, deconectează-mă</button>
              <button className="btn-cancel" onClick={() => setLogoutOpen(false)}>Anulează</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}