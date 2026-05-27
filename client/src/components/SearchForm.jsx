import React, { useState } from "react";

export default function SearchForm({ onSearch }) {
  const [search, setSearch] = useState("");

  const submit = (event) => {
    event.preventDefault();
    if (search.trim()) {
      onSearch(search);
    }
  };

  return (
    <form id="searchMedia" onSubmit={submit}>
      <input 
        type="search" 
        id="searchInput" 
        name="search" 
        placeholder="Search" 
        value={search} 
        onChange={(event) => setSearch(event.target.value)} 
      />
    </form>
  );
}