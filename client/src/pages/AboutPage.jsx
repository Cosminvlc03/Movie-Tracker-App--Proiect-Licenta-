import React from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../utils/helpers";

export default function AboutPage({ onHome }) {
  const { t } = useTranslation();

  return (
    <div className="bodyLayout">
      <div className="border" id="aboutBorderLeft">
      </div>
      <div className="center">
        <div className="mainSectionAbout">
          <h2 className="aboutTitle">{t('about.title')}</h2>
          
          <div className="aboutDetails">
            <h3 className="aboutH3">{t('about.visionTitle')}</h3>
            <p className="aboutP">{t('about.visionText')}</p>

            <h3 className="aboutH3">{t('about.experienceTitle')}</h3>
            <p className="aboutP">{t('about.experienceText')}</p>

            <h3 className="aboutH3">{t('about.techTitle')}</h3>
            <p className="aboutP">{t('about.techText')}</p>
            <p className="aboutP" style={{ fontSize: "0.85rem", fontStyle: "italic", marginTop: "10px", color: "var(--text-muted, #aaa)" }}>
              {t('about.tmdbNotice')}
            </p>

            <h3 className="aboutH3">{t('about.founderTitle')}</h3>
            <p className="aboutP">{t('about.founderText')}</p>
          </div>
        </div>
      </div>
      <div className="border" id="aboutBorderRight">
        <img src={asset("logo 1.svg")} alt="logo" id="apiLogo" />
      </div>
    </div>
  );
}