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
import FriendsPage from "./pages/FriendsPage";
import Navbar from "./components/Navbar";
import AdminDashboard from "./pages/AdminDashboard";
import AIChatWidget from "./components/AIChatWidget";
import PrivacyPolicy from "./pages/PrivacyPolicy";

export default function App() {
  const navigate = useNavigate();
  
  const [auth, setAuth] = useState({ username: "", role: "", watchlist: [] });
  const [toast, setToast] = useState({ message: "", type: "" });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("app-theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("app-theme", theme); // Salvăm alegerea
  }, [theme]);

  useEffect(() => {
    api("/session")
      .then((data) => {
        if (data.isAuthenticated) {
          setAuth({ username: data.username, role: data.role || "user", watchlist: data.watchlist || [] });
          if (window.location.pathname === "/" || window.location.pathname === "/login") {
            navigate(data.role === "admin" ? "/admin-dashboard" : "/home");
          }
        }
      })
      .catch(() => undefined)
      .finally(() => setIsLoading(false));
  }, [navigate])

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
      setAuth({ username: data.username, role: data.role || "user", watchlist: data.watchlist || [] });
      navigate(data.role === "admin" ? "/admin-dashboard" : "/home");
    } catch (err) {
      setToast({ message: err.message || "Invalid username or password", type: "error" });
    }
  };

  const handleSignup = async (payload) => {
    await api("/signup", { method: "POST", body: JSON.stringify(payload) });
    setToast({ message: "Signup successful! Please log in.", type: "success" });
    navigate("/login");
  };

  const handleSearch = async (search, language) => {
    const data = await api("/search", { method: "POST", body: JSON.stringify({ search, language }) });
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
  };

  const removeFavourite = async (tmdbId) => {
    const data = await api(`/favourite/${tmdbId}`, { method: "DELETE" });
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
  };

  const logout = async () => {
    await api("/logout", { method: "POST" });
    setAuth({ username: "", watchlist: [] });
    setToast({ message: "", type: "" });
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "var(--bg-color)" }}>
        <h1 style={{ color: "var(--text-main)", fontFamily: "Alkatra", fontSize: "2rem" }}>Loading...</h1>
      </div>
    );
  }

  const isAuthenticated = Boolean(auth.username);
  const isAdmin = auth.role === "admin";
  const isNormalUser = isAuthenticated && !isAdmin;

  const handleDeleteAccount = async (password) => {
    await api("/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    setAuth(null);
    navigate("/login");
  };

  return (
    <div className="app-container">
      {isNormalUser && (
        <Navbar 
          onSearch={handleSearch} 
          onAccount={() => navigate("/account")} 
          onLogout={logout} 
        />
      )}

      <div className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage toast={toast} onCloseToast={() => setToast({ message: "", type: "" })} onLogin={handleLogin} onForgotten={() => navigate("/forgotten")} onSignup={() => navigate("/signup")} />} />
          <Route path="/signup" element={<SignupPage onSignup={handleSignup} onBack={() => navigate("/login")} />} />
          <Route path="/forgotten" element={<ForgottenPage onBack={() => navigate("/login")} />} />
          <Route path="/reset-password/:token" element={<ResetPasswordPage />} />

          <Route path="/admin-dashboard" element={isAdmin ? <AdminDashboard onLogout={logout} /> : <Navigate to={isAuthenticated ? "/home" : "/login"} replace />} />

          <Route path="/privacy" element={isAuthenticated ? (<PrivacyPolicy /> ) : (<Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace />)} />
          <Route path="/home" element={isNormalUser ? <HomePage username={auth.username} watchlist={auth.watchlist} onOpenMedia={openMediaFromWatchlist} onOpenNewMedia={openMediaFromSearch} /> : <Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace />} />          <Route path="/media/:id" element={isAuthenticated ? <MediaPage media={selectedMedia} watchlist={auth.watchlist} onHome={goHome} onAddFavourite={addFavourite} onRemoveFavourite={removeFavourite} /> : <Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace />} />
          <Route path="/search" element={isAuthenticated ? (<SearchPage media={searchResults} onOpenMedia={openMediaFromSearch} />) : (<Navigate to="/login" replace />)} />
          <Route path="/favourite/:id" element={isAuthenticated ? <HomeMediaPage media={selectedMedia} onHome={goHome} onRemoveFavourite={removeFavourite} /> : <Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace />} />
          <Route path="/about" element={isAuthenticated ? <AboutPage onHome={goHome} /> : <Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace />} />
          <Route path="/friends" element={isAuthenticated ? <FriendsPage onOpenMedia={openMediaFromSearch} /> : <Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace />} />
          <Route path="/account" element={isNormalUser ? <AccountPage user={auth} onLogout={logout} onDeleteAccount={handleDeleteAccount} theme={theme} onThemeChange={setTheme} /> : <Navigate to={isAdmin ? "/admin-dashboard" : "/login"} replace /> }/>
          <Route path="*" element={<Navigate to={isAdmin ? "/admin-dashboard" : "/home"} replace />} />
        </Routes>
      </div>
      {isNormalUser && <AIChatWidget />}
    </div>
  );
}