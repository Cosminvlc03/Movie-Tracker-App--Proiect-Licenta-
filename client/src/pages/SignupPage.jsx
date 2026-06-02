import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { asset } from "../utils/helpers";
import Toast from "../components/Toast";

export default function SignupPage({ onSignup, onBack }) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [toastError, setToastError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setToastError("");
    
    const hasEmptyFields = Object.values(form).some((value) => value.trim() === "");
    if (hasEmptyFields) {
      setToastError(t('auth.errorFieldsRequired'));
      return;
    }
    try {
      await onSignup(form);
    } catch (err) {
      setToastError(err.message || t('auth.errorSignupFailed'));
    }
  };

  return (
    <div className="bodyLayout">
      <Toast message={toastError} type="error" onClose={() => setToastError("")} />

      <div className="border" id="leftBorderFgtn">
        <button type="button" className="goLoginButton" onClick={onBack}>
          <img src={asset("arrow_back.svg")} alt="back_arrow" id="backArrow" />
        </button>
      </div>
      <div className="center">
        <h1 className="mainTitle">MyMovieTracker</h1>
        <div className="mainSection">
          <form id="saveProfile" onSubmit={submit}>
            <input type="text" className="input" name="username" placeholder={t('auth.username')} required value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <input type="email" className="input" name="email" placeholder={t('auth.email')} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input type="password" className="input" name="password" placeholder={t('auth.password')} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            <input type="submit" className="signUp" id="signupButton" value={t('auth.signup')} />
          </form>
        </div>
      </div>
      <div className="border" id="rightBorderFgtn"></div>
    </div>
  );
}