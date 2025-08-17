import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const navigate = useNavigate();

  // Fetch Pokémon list once
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=1000")
      .then((res) => res.json())
      .then((data) => {
        // Store name + id for sprites
        const list = data.results.map((p, index) => ({
          name: p.name,
          id: index + 1
        }));
        setSuggestions(list);
      });
  }, []);

  const filteredSuggestions = searchTerm
    ? suggestions.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  const handleSelect = (name) => {
    setSearchTerm("");
    navigate(`/pokemon/${name.toLowerCase()}`);
  };

  return (
    <div className="home-container">
      <div className="home-bg">
        <div className="bg-half bg-left"></div>
        <div className="bg-half bg-right"></div>
        <div className="home-overlay"></div>
      </div>

      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (searchTerm.trim()) {
            navigate(`/pokemon/${searchTerm.toLowerCase()}`);
          }
        }}
      >
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <button className="search-btn" type="submit">
          🔍
        </button>
      

      {filteredSuggestions.length > 0 && (
        <ul className="autocomplete-list">
          {filteredSuggestions.slice(0, 10).map((p) => (
            <li key={p.name} onClick={() => handleSelect(p.name)}>
              <span>{p.name}</span>
              <img
                src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                alt={p.name}
              />
            </li>
          ))}
        </ul>
      )}
      </form>
    </div>
  );
}
