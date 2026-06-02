import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";
import { useTranslation } from "react-i18next";
import LanguageSwitch from "../components/LanguageSwitch";

export default function Navbar({ onSearch, onAccount, onLogout }) {
  const { t, i18n } = useTranslation();
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
      onSearch(search, i18n.language);
      setSearch("");
    }
  };

  return (
    <>
      <nav className="navbar">
        <div className="nav-brand" onClick={() => navigate("/home")}>
          {t('nav.brand')}
        </div>
        <form className="nav-search" onSubmit={submitSearch}>
          <input
            type="search"
            placeholder={t('nav.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="nav-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          <LanguageSwitch />

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
          {t('nav.friends')}
          {pendingCount > 0 && <span className="notification-badge">{pendingCount}</span>}
        </button>
        <button className="panel-link" onClick={() => { setPanelOpen(false); onAccount(); }}>
          {t('nav.accountDetails')}
        </button>
        <button className="panel-link" onClick={() => { setPanelOpen(false); navigate("/about"); }}>
          {t('nav.about')}
        </button>
        <button className="panel-link" onClick={() => { setPanelOpen(false); navigate("/privacy"); }}>
          {t('nav.privacy')}
        </button>
        <button className="panel-link danger" onClick={() => setLogoutOpen(true)}>
          {t('nav.logout')}
        </button>
      </div>
      
      {logoutOpen && (
        <div className="logout-overlay">
          <div className="logout-modal">
            <h3>{t('nav.confirmLogoutTitle')}</h3>
            <div className="logout-actions">
              <button className="btn-confirm" onClick={() => { setLogoutOpen(false); onLogout(); }}>
                {t('nav.confirmLogoutBtn')}
              </button>
              <button className="btn-cancel" onClick={() => setLogoutOpen(false)}>
                {t('nav.cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}