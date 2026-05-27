import React from "react";
import { asset } from "../utils/helpers";

export default function HomeMediaPage({ media, onHome, onRemoveFavourite }) {
  if (!media) return null;

  return (
    <div className="homeBody">
      <div className="homeBorder" id="upperHomeBorder">
        <button type="button" id="goBackFromFavouritesButton" onClick={onHome}>
          <img src={asset("arrow_back.svg")} alt="home" id="homeIcon" />
        </button>
        <h1 id="favouriteTitle">MyMovieTracker</h1>
        <form id="removeFromFavouritesForm" onSubmit={(e) => { e.preventDefault(); onRemoveFavourite(media.tmdb_id); }}>
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