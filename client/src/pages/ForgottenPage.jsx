import React, { useState } from "react";
import { asset } from "../utils/helpers";
import { api } from "../api/apiClient";
import Toast from "../components/Toast";

export default function ForgottenPage({ onBack }) {
  const [email, setEmail] = useState("");
  const [toast, setToast] = useState({ message: "", type: "" });

  const submit = async (event) => {
    event.preventDefault();
    setToast({ message: "", type: "" }); // Resetăm toast-ul anterior
    
    try {
      const data = await api("/recover-password", { 
        method: "POST", 
        body: JSON.stringify({ email }) 
      });
      // Mesajul generic de securitate trimis de backend
      setToast({ message: data.message, type: "success" });
      setEmail(""); // Golim input-ul după trimitere
    } catch (err) {
      setToast({ message: err.message || "A apărut o eroare.", type: "error" });
    }
  };

  return (
    <div className="bodyLayout">
      <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: "", type: "" })} />
      
      <div className="border" id="leftBorderFgtn">
        <button type="button" className="goLoginButton" onClick={onBack}>
          <img src={asset("arrow_back.svg")} alt="back_arrow" id="backArrow" />
        </button>
      </div>
      
      <div className="center">
        <h1 className="mainTitle">MyMovieTracker</h1>
        <div className="mainSection">
          <form id="forgottenProfile" onSubmit={submit}>
            {/* Un text explicativ elegant */}
            <p style={{ color: "#C3C5D7", fontFamily: "Alkatra", fontSize: "20px", textAlign: "center", padding: "0 20px" }}>
              Introdu adresa de email pentru a primi link-ul de resetare a parolei.
            </p>
            
            <input type="email" className="input" name="email" placeholder="Email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            
            <input type="submit" className="recoverPassword" id="recoverPasswordButton" value="Trimite Link" />
          </form>
        </div>
      </div>
      
      <div className="border" id="rightBorderFgtn"></div>
    </div>
  );
}