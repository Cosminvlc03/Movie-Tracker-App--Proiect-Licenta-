import React from "react";
import { useTranslation } from "react-i18next";

export default function LanguageSwitch() {
  const { i18n } = useTranslation();
  const isEnglish = i18n.language === "en";

  const toggleLanguage = () => {
    const newLang = isEnglish ? "ro" : "en";
    i18n.changeLanguage(newLang);
    localStorage.setItem("app_lang", newLang);
  };

  return (
    <div className="lang-switch-container" onClick={toggleLanguage}>
      <span className={!isEnglish ? "lang-active" : "lang-inactive"}>RO</span>
      
      <div className={`lang-switch ${isEnglish ? "toggled" : ""}`}>
        <div className="lang-switch-handle"></div>
      </div>
      
      <span className={isEnglish ? "lang-active" : "lang-inactive"}>EN</span>
    </div>
  );
}