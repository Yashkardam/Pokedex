import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./PokemonDetail.css";

export default function PokemonDetail() {
  const { name } = useParams();
  const navigate = useNavigate();
  const [pokemon, setPokemon] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allPokemon, setAllPokemon] = useState([]);

  const typeIdMap = {
    normal: 1,
    fighting: 2,
    flying: 3,
    poison: 4,
    ground: 5,
    rock: 6,
    bug: 7,
    ghost: 8,
    steel: 9,
    fire: 10,
    water: 11,
    grass: 12,
    electric: 13,
    psychic: 14,
    ice: 15,
    dragon: 16,
    dark: 17,
    fairy: 18,
  };

  // Fetch all Pokémon for dropdown suggestions
  useEffect(() => {
    fetch("https://pokeapi.co/api/v2/pokemon?limit=1000")
      .then((res) => res.json())
      .then((data) => setAllPokemon(data.results));
  }, []);

  // Fetch selected Pokémon details
  useEffect(() => {
    fetch(`https://pokeapi.co/api/v2/pokemon/${name}`)
      .then((res) => res.json())
      .then((data) => setPokemon(data))
      .catch(() => setPokemon(null));
  }, [name]);

  // Handle dropdown suggestions
  useEffect(() => {
    if (searchTerm.length > 0) {
      setSuggestions(
        allPokemon.filter((p) =>
          p.name.toLowerCase().startsWith(searchTerm.toLowerCase())
        )
      );
    } else {
      setSuggestions([]);
    }
  }, [searchTerm, allPokemon]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/pokemon/${searchTerm.toLowerCase()}`);
      setSearchTerm("");
      setSuggestions([]);
    }
  };

  if (!pokemon) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="detail-container">
      {/* Search bar */}
      <form className="search-form detail-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search Pokémon..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button className="search-btn" type="submit">
          🔍
        </button>

        {/* Autocomplete dropdown */}
        {suggestions.length > 0 && (
          <ul className="autocomplete-list">
            {suggestions.map((p) => (
              <li
                key={p.name}
                onClick={() => {
                  navigate(`/pokemon/${p.name}`);
                  setSearchTerm("");
                  setSuggestions([]);
                }}
              >
                {p.name}
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.url.split("/")[6]}.png`}
                  alt={p.name}
                  style={{ width: "30px", marginLeft: "8px" }}
                />
              </li>
            ))}
          </ul>
        )}
      </form>

      {/* Pokémon info */}
      <div className="detail-content">
        <div className="pokemon-image">
          <img
            src={pokemon.sprites.other["official-artwork"].front_default}
            alt={pokemon.name}
          />
        </div>
        <div className="pokemon-info">
          <h1>{pokemon.name}</h1>

          {/* Types with icons */}
          <div className="info-block">
            <h3>Type</h3>
            <div className="type-icons">
              {pokemon.types.map((t) => {
                const typeId = typeIdMap[t.type.name];
                return (
                  <div key={t.type.name} className="type-item">
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/types/generation-viii/brilliant-diamond-and-shining-pearl
/${typeId}.png`}
                      alt={t.type.name}
                      className="type-icon"
                    />
            
                  </div>
                );
              })}
            </div>
          </div>

          <div className="info-block">
            <h3>Stats</h3>
            {pokemon.stats.map((s) => (
              <p key={s.stat.name}>
                {s.stat.name}: {s.base_stat}
              </p>
            ))}
          </div>

          <div className="info-block">
            <h3>Abilities</h3>
            {pokemon.abilities.map((a) => (
              <p key={a.ability.name}>{a.ability.name}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
