import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="page-wrapper" style={{ padding: "40px", maxWidth: "800px", margin: "0 auto", color: "var(--text-main)" }}>
      <h1>{t('privacy.title')}</h1>
      <p>{t('privacy.lastUpdated')}: 02.06.2026</p>
      
      <section>
        <h3>{t('privacy.dataCollectionTitle')}</h3>
        <p>{t('privacy.dataCollectionText')}</p>
      </section>

      <section>
        <h3>{t('privacy.usageTitle')}</h3>
        <p>{t('privacy.usageText')}</p>
      </section>
    </div>
  );
}