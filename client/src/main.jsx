import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./react-layout-fixes.css";

const API_BASE_URL = "http://localhost:3000/api";

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.message || "Request failed");
  }

  return data;
};

const asset = (name) => `/misc/${name}`;

const getPosterSrc = (posterPath) => {
  if (!posterPath) return asset("Film.svg");
  if (posterPath.startsWith("http")) return posterPath;
  return `https://image.tmdb.org/t/p/w200${posterPath}`;
};

function App() {
  const [page, setPage] = useState("login");
  const [auth, setAuth] = useState({ username: "", watchlist: [] });
  const [loginError, setLoginError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    api("/session")
      .then((data) => {
        if (data.isAuthenticated) {
          setAuth({ username: data.username, watchlist: data.watchlist || [] });
          setPage("home");
        }
      })
      .catch(() => undefined);
  }, []);

  const refreshWatchlist = async () => {
    const data = await api("/watchlist");
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
    return data;
  };

  const goHome = async () => {
    await refreshWatchlist();
    setPage("home");
  };

  const handleLogin = async ({ username, password }) => {
    setLoginError("");
    try {
      const data = await api("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });
      setAuth({ username: data.username, watchlist: data.watchlist || [] });
      setPage("home");
    } catch (err) {
      setLoginError(err.message || "Invalid username or password");
    }
  };

  const handleSignup = async (payload) => {
    await api("/signup", { method: "POST", body: JSON.stringify(payload) });
    setLoginError("Signup successful! Please log in.");
    setPage("login");
  };

  const handleSearch = async (search) => {
    const data = await api("/search", { method: "POST", body: JSON.stringify({ search }) });
    setSearchResults(data.media || []);
    setPage("search");
  };

  const openMediaFromSearch = async (mediaId) => {
    const data = await api(`/media/${mediaId}`);
    setSelectedMedia(data);
    setPage("media");
  };

  const openMediaFromWatchlist = async (tmdbId) => {
    const data = await api(`/watchlist/media/${tmdbId}`);
    setSelectedMedia(data);
    setPage("homeMedia");
  };

  const addFavourite = async (media) => {
    const data = await api("/favourite", {
      method: "POST",
      body: JSON.stringify(media),
    });
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
    setPage("home");
  };

  const removeFavourite = async (tmdbId) => {
    const data = await api(`/favourite/${tmdbId}`, { method: "DELETE" });
    setAuth({ username: data.username, watchlist: data.watchlist || [] });
    setPage("home");
  };

  const openAccount = async () => {
    const data = await api("/account");
    setAccount(data);
    setPage("account");
  };

  const logout = async () => {
    await api("/logout", { method: "POST" });
    setAuth({ username: "", watchlist: [] });
    setLoginError("");
    setPage("login");
  };

  if (page === "signup") return <SignupPage onSignup={handleSignup} onBack={() => setPage("login")} />;
  if (page === "forgotten") return <ForgottenPage onBack={() => setPage("login")} />;
  if (page === "home") return <HomePage username={auth.username} watchlist={auth.watchlist} onSearch={handleSearch} onOpenMedia={openMediaFromWatchlist} onAccount={openAccount} onAbout={() => setPage("about")} onLogout={logout} />;
  if (page === "search") return <SearchPage media={searchResults} onSearch={handleSearch} onOpenMedia={openMediaFromSearch} onHome={goHome} onAccount={openAccount} onAbout={() => setPage("about")} onLogout={logout} />;
  if (page === "media") return <MediaPage media={selectedMedia} onSearch={handleSearch} onHome={goHome} onAccount={openAccount} onAbout={() => setPage("about")} onLogout={logout} onAddFavourite={addFavourite} />;
  if (page === "homeMedia") return <HomeMediaPage media={selectedMedia} onHome={goHome} onRemoveFavourite={removeFavourite} />;
  if (page === "account") return <AccountPage account={account} onHome={goHome} />;
  if (page === "about") return <AboutPage onHome={goHome} />;

  return <LoginPage error={loginError} onLogin={handleLogin} onForgotten={() => setPage("forgotten")} onSignup={() => setPage("signup")} />;
}

function LoginPage({ error, onLogin, onForgotten, onSignup }) {
  const [form, setForm] = useState({ username: "", password: "" });

  const submit = (event) => {
    event.preventDefault();
    onLogin(form);
  };

  return (
    <div className="bodyLayout">
      <div className="border" id="leftBorder"></div>
      <div className="center">
        {error && <div className="error_message">{error}</div>}
        <h1 className="mainTitle"> MyMovieTracker</h1>
        <div className="mainSection">
          <form id="loginForm" onSubmit={submit}>
            <input type="text" className="input" id="usernameInput" name="username" placeholder="Username" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <div className="removeSpace">
              <input type="password" className="input" id="passwordInput" name="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
              <input type="button" id="forgottenPasswordButton" value="Forgot Password?" onClick={onForgotten} />
            </div>
            <input type="submit" id="loginButton" value="Log in" />
          </form>
          <div className="signSection">
            <h3 className="newUser">New user?</h3>
            <form id="signupForm" onSubmit={(event) => { event.preventDefault(); onSignup(); }}>
              <input type="submit" className="signUp" id="signupButton" value="Sign up" />
            </form>
          </div>
        </div>
      </div>
      <div className="border" id="rightBorder"></div>
    </div>
  );
}

function SignupPage({ onSignup, onBack }) {
  const [form, setForm] = useState({ username: "", email: "", password: "", fruit: "" });
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    const hasEmptyFields = Object.values(form).some((value) => value.trim() === "");
    if (hasEmptyFields) {
      setError("All fields are required");
      return;
    }
    try {
      await onSignup(form);
    } catch (err){
      setError(err.message || "Signup failed");
    }
  };

  return (
    <div className="bodyLayout">
      <div className="border" id="leftBorderFgtn">
        <button type="button" className="goLoginButton" onClick={onBack}>
          <img src={asset("arrow_back.svg")} alt="back_arrow" id="backArrow" />
        </button>
      </div>
      <div className="center">
        {error && <div className="error_message">{error}</div>}
        <h1 className="mainTitle">MyMovieTracker</h1>
        <div className="mainSection">
          <form id="saveProfile" onSubmit={submit}>
            <input type="text" className="input" id="usernameInput" name="username" placeholder="Username" required value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} />
            <input type="text" className="input" id="emailInput" name="email" placeholder="Email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input type="password" className="input" id="passwordInput" name="password" placeholder="Password" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
            <input type="text" className="input" id="fruitInput" name="fruit" placeholder="Favourite fruit" required value={form.fruit} onChange={(event) => setForm({ ...form, fruit: event.target.value })} />
            <p id="fruitRemember">Remember this field in case of password recovery</p>
            <input type="submit" className="signUp" id="signupButton" value="Sign up" />
          </form>
        </div>
      </div>
      <div className="border" id="rightBorderFgtn"></div>
    </div>
  );
}

function ForgottenPage({ onBack }) {
  const [form, setForm] = useState({ email: "", fruit: "" });
  const [passwordToShow, setPasswordToShow] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    const data = await api("/recover-password", { method: "POST", body: JSON.stringify(form) });
    setPasswordToShow(data.verificationSuccess ? data.passwordToShow : "");
  };

  return (
    <div className="bodyLayout">
      <div className="border" id="leftBorderFgtn">
        <button type="button" className="goLoginButton" onClick={onBack}>
          <img src={asset("arrow_back.svg")} alt="back_arrow" id="backArrow" />
        </button>
      </div>
      <div className="center">
        <h1 className="mainTitle">MyMovieTracker</h1>
        <div className="mainSection">
          <form id="forgottenProfile" onSubmit={submit}>
            <input type="text" className="input" id="emailInput" name="email" placeholder="Email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            <input type="text" className="input" id="fruitInput" name="fruit" placeholder="Favourite fruit" required value={form.fruit} onChange={(event) => setForm({ ...form, fruit: event.target.value })} />
            {passwordToShow && <input type="text" className="input" id="passwordInput" value={passwordToShow} readOnly />}
            <input type="submit" className="recoverPassword" id="recoverPasswordButton" value="Recover Password" />
          </form>
        </div>
      </div>
      <div className="border" id="rightBorderFgtn"></div>
    </div>
  );
}

function AccountMenu({ onAccount, onAbout, onLogout, renderButtonOnly = false }) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const button = (
    <button
      type="button"
      className="accountButton"
      id="accountButtonID"
      aria-expanded={panelOpen}
      onClick={() => setPanelOpen((currentValue) => !currentValue)}
    >
      <img
        src={asset("account_circle.svg")}
        alt="account_button"
        id="accountIcon"
      />
    </button>
  );

  return (
    <>
      {button}

      <div id="accountPanel" className={panelOpen ? "" : "hidden"}>
        <button type="button" id="closePanel" onClick={() => setPanelOpen(false)}>
          <img src={asset("arrow_back.svg")} alt="arrow_back" id="backArrow" />
        </button>

        <form
          id="accountForm"
          onSubmit={(event) => {
            event.preventDefault();
            onAccount();
          }}
        >
          <input type="submit" value="Account" className="accountSubmit" />
        </form>

        <form
          id="aboutForm"
          onSubmit={(event) => {
            event.preventDefault();
            onAbout();
          }}
        >
          <input type="submit" value="About" className="accountSubmit" />
        </form>

        <button
          type="button"
          id="logoutPopUpButton"
          className="accountSubmit"
          onClick={() => setLogoutOpen(true)}
        >
          Log Out
        </button>
      </div>

      <div id="logoutPopUp" className={logoutOpen ? "" : "hidden"}>
        <h3 className="exitText">Are you sure you want to log out?</h3>

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

function SearchForm({ onSearch }) {
  const [search, setSearch] = useState("");
  return (
    <form id="searchMedia" onSubmit={(event) => { event.preventDefault(); onSearch(search); }}>
      <input type="search" id="searchInput" name="search" placeholder="Search" value={search} onChange={(event) => setSearch(event.target.value)} />
    </form>
  );
}

function HomePage({ username, watchlist, onSearch, onOpenMedia, onAccount, onAbout, onLogout }) {
  return (
    <div className="homeBody">
      <div className="homeBorder" id="upperHomeBorder">
        <AccountMenu onAccount={onAccount} onAbout={onAbout} onLogout={onLogout} />
        <h1 className="homeTitle">MyMovieTracker</h1>
        <SearchForm onSearch={onSearch} />
      </div>
      <h2 className="homeText">What movies do you wish to look for today, {username}?</h2>
      <div className="movieBox">
        {watchlist?.length > 0 ? (
          watchlist.map((item) => (
            <div className="movieItem" key={item.tmdb_id}>
              <form id="homeMediaTitleForm" onSubmit={(event) => { event.preventDefault(); onOpenMedia(item.tmdb_id); }}>
                <input type="hidden" name="tmdb_id" value={item.tmdb_id} />
                <input type="hidden" name="title" value={item.title} />
                <img src={getPosterSrc(item.poster_path)} alt={`${item.title} Poster`} id="moviePoster" />
                <input type="submit" name="mediaTitle" id="homeMovieTitle" value={item.title} />
              </form>
            </div>
          ))
        ) : (
          <p id="noMovies">No movies in your watchlist.</p>
        )}
      </div>
      <div className="homeBorder"></div>
    </div>
  );
}

function SearchPage({ media, onSearch, onOpenMedia, onHome, onAccount, onAbout, onLogout }) {
  return (
    <div className="homeBody" id="searchBody">
      <div className="homeBorder" id="upperHomeBorder">
        <AccountMenu onAccount={onAccount} onAbout={onAbout} onLogout={onLogout} />
        <h1 className="homeTitle" id="searchTitle">MyMovieTracker</h1>
        <button type="button" id="goBackFromSearchButton" onClick={onHome}>
          <img src={asset("Icon (2).svg")} alt="home" id="homeIcon" />
        </button>
        <SearchForm onSearch={onSearch} />
      </div>
      <div className="movieBoxSearch">
        <h2 className="searchTitle">Is this what you are looking for?</h2>
        {media.map((movie) => (
          <div className="mediaContainer" key={movie.id}>
            <form id="mediaTitleForm" onSubmit={(event) => { event.preventDefault(); onOpenMedia(movie.id); }}>
              <input type="hidden" name="mediaId" value={movie.id} />
              <img src={movie.image || asset("Film.svg")} id="shownMediaPhoto" alt={movie.title} />
              <input type="submit" name="mediaTitle" id="shownMediaTitle" value={movie.title} />
            </form>
          </div>
        ))}
      </div>
      <div className="homeBorder"></div>
    </div>
  );
}

function MediaPage({ media, onSearch, onHome, onAccount, onAbout, onLogout, onAddFavourite }) {
  if (!media) return null;

  return (
    <div className="homeBody" id="mediaBody">
      <div className="homeBorder" id="upperHomeBorder">
        <AccountMenu onAccount={onAccount} onAbout={onAbout} onLogout={onLogout} />
        <h1 className="homeTitle" id="searchTitle">MyMovieTracker</h1>
        <button type="button" id="goBackFromSearchButton" onClick={onHome}>
          <img src={asset("Icon (2).svg")} alt="home" id="homeIcon" />
        </button>
        <SearchForm onSearch={onSearch} />
      </div>
      <div className="middleSection">
        <div id="title">
          <form id="favourite" onSubmit={(event) => { event.preventDefault(); onAddFavourite(media); }}>
            <button type="submit" id="favouriteButton">
              <img src={asset("Heart.svg")} alt="favourite" id="favouriteIcon" />
            </button>
            <input type="hidden" name="mediaId" value={media.mediaId} />
            <input type="hidden" name="title" value={media.title} />
            <input type="hidden" name="photo" value={media.photo} />
            <input type="hidden" name="year" value={media.year} />
            <input type="hidden" name="type" value={media.type} />
            <input type="hidden" name="description" value={media.description} />
            <input type="hidden" name="actors" value={media.actors.join(", ")} />
          </form>
          <div id="titleText" name="title"> {media.title} </div>
        </div>
        <div id="year">{media.year}</div>
        <div id="type">Type: {media.type}</div>
        <div id="photo"><img src={media.photo || asset("Film.svg")} alt={media.title} id="mediaPhoto" /></div>
        <div id="description"> {media.description}</div>
        <div id="actors"> {media.actors.join(", ")}</div>
      </div>
      <div className="homeBorder"></div>
    </div>
  );
}

function HomeMediaPage({ media, onHome, onRemoveFavourite }) {
  if (!media) return null;

  return (
    <div className="homeBody">
      <div className="homeBorder" id="upperHomeBorder">
        <button type="button" id="goBackFromFavouritesButton" onClick={onHome}>
          <img src={asset("arrow_back.svg")} alt="home" id="homeIcon" />
        </button>
        <h1 id="favouriteTitle">MyMovieTracker</h1>
        <form id="removeFromFavouritesForm" onSubmit={(event) => { event.preventDefault(); onRemoveFavourite(media.tmdb_id); }}>
          <input type="hidden" name="tmdb_id" value={media.tmdb_id} />
          <input type="submit" value="Remove" id="removeFromFavouritesButton" />
        </form>
      </div>
      <div className="middleSection">
        <div id="titleFromFavs"> {media.title} </div>
        <div id="year">{media.year}</div>
        <div id="type">Type: {media.type}</div>
        <div id="photo"><img src={media.photo || asset("Film.svg")} alt={media.title} id="mediaPhoto" /></div>
        <div id="description"> {media.description}</div>
        <div id="actors"> {media.actors}</div>
      </div>
      <div className="homeBorder"></div>
    </div>
  );
}

function AccountPage({ account, onHome }) {
  if (!account) return null;

  return (
    <div className="bodyLayout">
      <div className="border"></div>
      <div className="center">
        <h1 className="mainTitle">MyMovieTracker</h1>
        <div className="mainSectionAccount">
          <h2 id="accountTitle">Account details</h2>
          <p className="accountDetails">Username</p>
          <p className="inputAccount"> {account.username} </p>
          <p className="accountDetails">E-mail</p>
          <p className="inputAccount"> {account.mail} </p>
          <p className="accountDetails">Favourite fruit</p>
          <p className="inputAccount"> {account.fruit} </p>
          <button type="button" id="goBackFromAccountButton" onClick={onHome}>
            <img src={asset("Icon (2).svg")} alt="home" id="homeIcon" />
          </button>
        </div>
      </div>
      <div className="border"></div>
    </div>
  );
}

function AboutPage({ onHome }) {
  return (
    <div className="bodyLayout">
      <div className="border" id="aboutBorderLeft">
        <button type="button" id="goBackFromAccountButton" onClick={onHome}>
          <img src={asset("Icon (2).svg")} alt="home" id="homeIcon" />
        </button>
      </div>
      <div className="center">
        <div className="mainSectionAbout">
          <h2 className="aboutTitle">About MyMovieTracker</h2>
          <div className="aboutDetails">
            <h3 className="aboutH3">What does the app do?</h3>
            <p className="aboutP">- Tracks movies you want to watch</p>
            <p className="aboutP">- Lets you build a personal watchlist</p>
            <p className="aboutP">- Shows details about movies/shows</p>
            <h3 className="aboutH3">Why it exists?</h3>
            <p className="aboutP">- Too many streaming platforms</p>
            <p className="aboutP">- A simple, universal watchlist</p>
            <h3 className="aboutH3">Key features?</h3>
            <p className="aboutP">- Search movies and shows</p>
            <p className="aboutP">- Add them to your watchlist</p>
            <p className="aboutP">- View details about them</p>
            <h3 className="aboutH3">How it works?</h3>
            <p className="aboutP">- Powered by Node.js, Express.js, PostrgeSQL .</p>
            <p className="aboutP">- This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
            <h3 className="aboutH3">Who made it?</h3>
            <p className="aboutP">- This project was made by Cosmin V.</p>
          </div>
        </div>
      </div>
      <div className="border" id="aboutBorderRight">
        <img src={asset("logo 1.svg")} alt="logo" id="apiLogo" />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
