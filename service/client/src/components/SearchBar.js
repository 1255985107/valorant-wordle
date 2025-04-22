import React, { useState, useEffect } from 'react';
import { Form, ListGroup } from 'react-bootstrap';
import axios from 'axios';

const DEBOUNCE_TIME = 300;

export default function SearchBar({ onSearch }) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      if (input.length > 1) {
        axios.get(`http://localhost:3001/api/players/search?prefix=${input.toLowerCase()}`)
          .then(res => setSuggestions(res.data))
          .catch(console.error);
      }
    }, DEBOUNCE_TIME);

    return () => clearTimeout(handler);
  }, [input]);

  return (
    <div className="position-relative">
      <Form.Control
        type="text"
        placeholder="输入选手ID..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      
      {suggestions.length > 0 && (
        <ListGroup className="position-absolute w-100" style={{ zIndex: 1000 }}>
          {suggestions.map((player, index) => (
            <ListGroup.Item
              key={index}
              action
              onClick={() => {
                onSearch(player.gameid);
                setInput('');
                setSuggestions([]);
              }}
            >
              {player.gameid}
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </div>
  );
}