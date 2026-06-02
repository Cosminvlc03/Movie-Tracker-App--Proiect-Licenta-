import React, { useState } from "react";
import { useTranslation } from "react-i18next";

export default function SearchForm({ onSearch }) {
  const { t } = useTranslation();
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
        placeholder={t('searchForm.placeholder')} 
        value={search} 
        onChange={(event) => setSearch(event.target.value)} 
      />
    </form>
  );
}