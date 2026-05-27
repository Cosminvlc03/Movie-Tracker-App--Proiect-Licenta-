import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/apiClient";
import { asset } from "../utils/helpers";
import Toast from "../components/Toast";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [toast, setToast] = useState({ message: "", type: "" });

  const submit = async (event) => {
    event.preventDefault();
    setToast({ message: "", type: "" });
    if (form.newPassword !== form.confirmPassword) {
      setToast({ message: "Parolele nu coincid!", type: "error" });
      return;
    }

    if (form.newPassword.length < 5) {
       setToast({ message: "Parola trebuie să aibă minim 5 caractere.", type: "error" });
       return;
    }

    try {
      const data = await api("/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, newPassword: form.newPassword }),
      });
      
      setToast({ message: data.message, type: "success" });
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setToast({ message: err.message || "Reset failed", type: "error" });
    }
  };

  return (
    <div className="bodyLayout">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      <div className="border" id="leftBorderFgtn">
        <button type="button" className="goLoginButton" onClick={() => navigate("/login")}>
          <img src={asset("arrow_back.svg")} alt="back_arrow" id="backArrow" />
        </button>
      </div>
      
      <div className="center">
        <h1 className="mainTitle">MyMovieTracker</h1>
        <div className="mainSection">
          <form id="forgottenProfile" onSubmit={submit}>
            <h2 style={{ color: "#C3C5D7", fontFamily: "Alkatra", textAlign: "center", margin: 0 }}>Setează parola nouă</h2>
            
            <input type="password" className="input" placeholder="Noua parolă" required value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
            
            <input type="password" className="input" placeholder="Confirmă parola" required value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} />
            
            <input type="submit" className="recoverPassword" id="recoverPasswordButton" value="Salvează parola" />
          </form>
        </div>
      </div>
      
      <div className="border" id="rightBorderFgtn"></div>
    </div>
  );
}