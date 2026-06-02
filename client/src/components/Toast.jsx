import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";

export default function Toast({ message, type = "error", onClose }) {
  const { t } = useTranslation();

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer); 
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={`toast-popup ${type}`}>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close-btn" onClick={onClose} aria-label={t('toast.close')}>
        &times;
      </button>
    </div>
  );
}