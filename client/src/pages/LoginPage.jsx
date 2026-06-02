import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import Toast from "../components/Toast";

export default function LoginPage({ toast, onCloseToast, onLogin, onForgotten, onSignup }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return (
    <div className="bodyLayout">
      <Toast message={toast?.message} type={toast?.type} onClose={onCloseToast} />
      
      <div className="border" id="leftBorder"></div>
      <div className="center">
        <h1 className="mainTitle"> MyMovieTracker</h1>
        <div className="mainSection">
          <form id="loginForm" onSubmit={submit}>
            <input type="text" className="input" name="username" placeholder={t('auth.username')} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <div className="removeSpace">
              <input type="password" className="input" name="password" placeholder={t('auth.password')} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <input type="button" id="forgottenPasswordButton" value={t('auth.forgotPassword')} onClick={onForgotten} />
            </div>
            <input type="submit" id="loginButton" value={t('auth.login')} />
          </form>
          <div className="signSection">
            <h3 className="newUser">{t('auth.newUser')}</h3>
            <form id="signupForm" onSubmit={(e) => { e.preventDefault(); onSignup(); }}>
              <input type="submit" className="signUp" id="signupButton" value={t('auth.signup')} />
            </form>
          </div>
        </div>
      </div>
      <div className="border" id="rightBorder"></div>
    </div>
  );
}