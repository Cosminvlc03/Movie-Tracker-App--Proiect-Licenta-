import React from "react";
import { asset } from "../utils/helpers";

export default function AboutPage({ onHome }) {
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