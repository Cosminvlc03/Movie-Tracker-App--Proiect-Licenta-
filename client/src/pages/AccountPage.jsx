import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";
import Toast from "../components/Toast";

export default function AccountPage({ user, onLogout, onDeleteAccount, theme, onThemeChange }) {
  const { t, i18n } = useTranslation();
  const [toast, setToast] = useState({ message: "", type: "" });
  const [showModal, setShowModal] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [details, setDetails] = useState(null);

  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        const data = await api("/account");
        setDetails(data);
      } catch (err) {
        console.error("Nu am putut încărca detaliile", err);
      }
    };
    fetchAccountDetails();
  }, []);

  const confirmDelete = async (e) => {
    e.preventDefault();
    if (!password) {
      setToast({ message: t('account.enterPasswordError'), type: "error" });
      return;
    }

    setIsDeleting(true);
    try {
      await onDeleteAccount(password);
    } catch (err) {
      setToast({ message: err.message || t('account.deleteAccountError'), type: "error" });
      setIsDeleting(false);
    }
  };

  const currentLocale = i18n.language === 'ro' ? 'ro-RO' : 'en-US';
  const memberSince = details?.createdAt 
    ? new Date(details.createdAt).toLocaleDateString(currentLocale, { year: 'numeric', month: 'long', day: 'numeric' })
    : t('account.loading');

  return (
    <div className="page-wrapper center">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      
      <div className="account-card">
        <h2 className="welcome-text">{t('account.welcome', { username: user?.username })}</h2>
        
        <div className="account-info">
          <p style={{ borderBottom: "1px solid rgba(195,197,215,0.1)", paddingBottom: "10px", marginBottom: "15px" }}>
            <strong>{t('account.email')}</strong> {details?.mail || t('account.loading')}
          </p>
          <p><strong>{t('account.memberSince')}</strong> {memberSince}</p>
          <p><strong>{t('account.moviesInWatchlist')}</strong> {user?.watchlist?.length || 0}</p>
        </div>

        <div className="account-stats-grid" style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
          <div style={{ flex: 1, background: "rgba(139, 0, 0, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid var(--primary)", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 5px 0", color: "var(--primary)", fontSize: "24px" }}>{details?.totalRatings || 0}</h3>
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t('account.ratingsGiven')}</span>
          </div>
          <div style={{ flex: 1, background: "rgba(139, 0, 0, 0.1)", padding: "15px", borderRadius: "10px", border: "1px solid var(--primary)", textAlign: "center" }}>
            <h3 style={{ margin: "0 0 5px 0", color: "var(--primary)", fontSize: "24px" }}>{details?.totalComments || 0}</h3>
            <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>{t('account.commentsLeft')}</span>
          </div>
        </div>

        <div className="account-theme-section" style={{ marginBottom: "30px", textAlign: "left" }}>
          <h3 style={{ fontSize: "16px", color: "var(--text-muted)", marginBottom: "10px", borderBottom: "1px solid rgba(195, 197, 215, 0.1)", paddingBottom: "5px" }}>
            {t('account.appAppearance')}
          </h3>
          <div className="theme-toggle-group">
            <label className={`theme-radio ${theme === 'light' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="theme" 
                value="light" 
                checked={theme === "light"} 
                onChange={(e) => onThemeChange(e.target.value)} 
              />
              <img src={asset("Sun.svg")} className="btn-icon" alt="Light Mode" /> {t('account.lightMode')}
            </label>
            <label className={`theme-radio ${theme === 'dark' ? 'active' : ''}`}>
              <input 
                type="radio" 
                name="theme" 
                value="dark" 
                checked={theme === "dark"} 
                onChange={(e) => onThemeChange(e.target.value)} 
              />
              <img src={asset("Moon.svg")} className="btn-icon" alt="Dark Mode" /> {t('account.darkMode')}
            </label>
          </div>
        </div>

        <div className="account-actions">
          <button className="btn-primary" onClick={onLogout}>
            <img src={asset("logout.svg")} alt="logout" className="btn-icon" />
            {t('account.logout')}
          </button>
          
          <button className="btn-danger-outline" onClick={() => setShowModal(true)}>
            <img src={asset("delete.svg")} alt="delete" className="btn-icon" />
            {t('account.deleteAccount')}
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>{t('account.modalTitle')}</h3>
            <p>{t('account.modalText')}</p>
            <form onSubmit={confirmDelete}>
              <input type="password" placeholder={t('account.modalPlaceholder')} className="modal-input" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
              <div className="modal-buttons">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} disabled={isDeleting}>{t('account.cancel')}</button>
                <button type="submit" className="btn-danger" disabled={isDeleting}>{isDeleting ? t('account.deleting') : t('account.confirmDelete')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}