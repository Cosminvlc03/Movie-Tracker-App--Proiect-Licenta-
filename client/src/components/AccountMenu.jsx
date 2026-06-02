import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../utils/helpers";

export default function AccountMenu({ onAccount, onAbout, onLogout }) {
  const { t } = useTranslation();
  const [panelOpen, setPanelOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="accountButton"
        id="accountButtonID"
        aria-expanded={panelOpen}
        onClick={() => setPanelOpen((prev) => !prev)}
      >
        <img src={asset("account_circle.svg")} alt="account_button" id="accountIcon" />
      </button>

      <div id="accountPanel" className={panelOpen ? "" : "hidden"}>
        <button type="button" id="closePanel" onClick={() => setPanelOpen(false)}>
          <img src={asset("arrow_back.svg")} alt="arrow_back" id="backArrow" />
        </button>

        <form id="accountForm" onSubmit={(e) => { e.preventDefault(); onAccount(); }}>
          <input type="submit" value={t('accountMenu.account')} className="accountSubmit" />
        </form>

        <form id="aboutForm" onSubmit={(e) => { e.preventDefault(); onAbout(); }}>
          <input type="submit" value={t('accountMenu.about')} className="accountSubmit" />
        </form>

        <button type="button" id="logoutPopUpButton" className="accountSubmit" onClick={() => setLogoutOpen(true)}>
          {t('accountMenu.logout')}
        </button>
      </div>

      <div id="logoutPopUp" className={logoutOpen ? "" : "hidden"}>
        <h3 className="exitText">{t('accountMenu.confirmLogout')}</h3>
        <div id="logoutPopUpIcons">
          <button type="button" id="logoutButton" onClick={onLogout}>
            <img src={asset("Check (1).svg")} alt="logOut" id="yButton" />
          </button>
          <button type="button" id="exitButton" onClick={() => setLogoutOpen(false)}>
            <img src={asset("X.svg")} alt="x" id="xButton" />
          </button>
        </div>
      </div>
    </>
  );
}