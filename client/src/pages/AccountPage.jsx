import React from "react";
import { asset } from "../utils/helpers";

export default function AccountPage({ account, onHome }) {
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
          <button type="button" id="goBackFromAccountButton" onClick={onHome}>
            <img src={asset("Icon (2).svg")} alt="home" id="homeIcon" />
          </button>
        </div>
      </div>
      <div className="border"></div>
    </div>
  );
}