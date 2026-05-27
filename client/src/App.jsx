import React, { useEffect, useState } from "react";
import { Routes, Route, useNavigate, Navigate } from "react-router-dom";
import { api } from "./api/apiClient";

import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ForgottenPage from "./pages/ForgottenPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import MediaPage from "./pages/MediaPage";
import HomeMediaPage from "./pages/HomeMediaPage";
import AccountPage from "./pages/AccountPage";
import AboutPage from "./pages/AboutPage";
import Navbar from "./components/Navbar";

export default function App() {
  const navigate = useNavigate();
  
  const [auth, setAuth] = useState({ username: "", watchlist: [] });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [account, setAccount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api("/session")
      .then((data) => {
        if (data.isAuthenticated) {
          setAuth({ username: data.username, watchlist: data.watchlist || [] });
          if (window.location.pathname === "/" || window.location.pathname === "/login") {
            navigate("/home");
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [navigate]);

  const refreshWatchlist = async () => {
    const data = await api("/watchlist");
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
  };

  const goHome = async () => {
    await refreshWatchlist();
    navigate("/home");
  };

  const handleLogin = async ({ username, password }) => {
    setToast({ message: "", type: "" });
    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAuth({ username: data.username, watchlist: data.watchlist || [] });
      navigate("/home");
    } catch (err) {
      setToast({ message: err.message || "Invalid username or password", type: "error" });
    }
  };

  const handleSignup = async (payload) => {
    await api("/signup", { method: "POST", body: JSON.stringify(payload) });
    setToast({ message: "Signup successful! Please log in.", type: "success" });
    navigate("/login");
  };

  const handleSearch = async (search) => {
    const data = await api("/search", { method: "POST", body: JSON.stringify({ search }) });
    setSearchResults(data.media || []);
    navigate("/search");
  };

  const openMediaFromSearch = async (mediaId) => {
    const data = await api(`/media/${mediaId}`);
    setSelectedMedia(data);
    navigate(`/media/${mediaId}`);
  };

  const openMediaFromWatchlist = async (tmdbId) => {
    const data = await api(`/watchlist/media/${tmdbId}`);
    setSelectedMedia(data);
    navigate(`/favourite/${tmdbId}`);
  };

  const addFavourite = async (media) => {
    const data = await api("/favourite", {
      method: "POST",
      body: JSON.stringify(media),
    });
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
    //navigate("/home");
  };

  const removeFavourite = async (tmdbId) => {
    const data = await api(`/favourite/${tmdbId}`, { method: "DELETE" });
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
    //navigate("/home");
  };

  const openAccount = async () => {
    const data = await api("/account");
    setAccount(data);
    navigate("/account");
  };

  const logout = async () => {
    await api("/logout", { method: "POST" });
    setAuth({ username: "", watchlist: [] });
    setToast({ message: "", type: "" });
    navigate("/login");
  };
  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "#02182B" }}>
        <h1 style={{ color: "#C3C5D7", fontFamily: "Alkatra", fontSize: "2rem" }}>Loading...</h1>
      </div>
    );
  }

  const isAuthenticated = Boolean(auth.username);

  return (
    <div className="app-container">
      {isAuthenticated && (
        <Navbar 
          onSearch={handleSearch} 
          onAccount={openAccount} 
          onLogout={logout} 
        />
      )}

      <div className="main-content">
        <Routes>
          {/* Rute Publice */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage toast={toast} onCloseToast={() => setToast({ message: "", type: "" })} onLogin={handleLogin} onForgotten={() => navigate("/forgotten")} onSignup={() => navigate("/signup")} />} />
          <Route path="/signup" element={<SignupPage onSignup={handleSignup} onBack={() => navigate("/login")} />} />
          <Route path="/forgotten" element={<ForgottenPage onBack={() => navigate("/login")} />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
          
          {/* Rute Private Protejate (Route Guarding) */}
          <Route path="/home" element={isAuthenticated ? <HomePage username={auth.username} watchlist={auth.watchlist} onSearch={handleSearch} onOpenMedia={openMediaFromWatchlist} onAccount={openAccount} onAbout={() => navigate("/about")} onLogout={logout} /> : <Navigate to="/login" replace />} />
          
          <Route path="/search" element={isAuthenticated ? <SearchPage media={searchResults} onSearch={handleSearch} onOpenMedia={openMediaFromSearch} onHome={goHome} onAccount={openAccount} onAbout={() => navigate("/about")} onLogout={logout} /> : <Navigate to="/login" replace />} />
          
          <Route path="/media/:id" element={isAuthenticated ? <MediaPage media={selectedMedia} watchlist={auth.watchlist} onSearch={handleSearch} onHome={goHome} onAccount={openAccount} onAbout={() => navigate("/about")} onLogout={logout} onAddFavourite={addFavourite} onRemoveFavourite={removeFavourite} /> : <Navigate to="/login" replace />} />
          
          <Route path="/favourite/:id" element={isAuthenticated ? <HomeMediaPage media={selectedMedia} onHome={goHome} onRemoveFavourite={removeFavourite} /> : <Navigate to="/login" replace />} />
          
          <Route path="/account" element={isAuthenticated ? <AccountPage account={account} onHome={goHome} /> : <Navigate to="/login" replace />} />
          
          <Route path="/about" element={isAuthenticated ? <AboutPage onHome={goHome} /> : <Navigate to="/login" replace />} />
          
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </div>
    </div>
  );
}