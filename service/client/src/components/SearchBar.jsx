import { useRef, useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/search.css';

const api_url = `${import.meta.env.VITE_API_SERVER_URL}/api`;

function SearchBar({ onCharacterSelect, isGuessing, gameEnd }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const searchContainerRef = useRef(null);
  const INITIAL_LIMIT = 10;
  const MORE_LIMIT = 5;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
        setOffset(0);
        setHasMore(true);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset pagination when search query changes
  useEffect(() => {
    setOffset(0);
    setHasMore(true);
    setSearchResults([]);
  }, [searchQuery]);

  // Force character search mode when subjectSearch is false
  useEffect(() => {
    setSearchResults([]);
    setOffset(0);
    setHasMore(true);
  }, []);

  // Debounced search function for character search only
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        setOffset(0);
        setHasMore(true);
        handleSearch(true);
      } else {
        setSearchResults([]);
        setOffset(0);
        setHasMore(true);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const handleSearch = async (reset = false) => {
    if (!searchQuery.trim()) return;
    
    // Always use initial search parameters when reset is true
    const currentLimit = reset ? INITIAL_LIMIT : MORE_LIMIT;
    const currentOffset = reset ? 0 : offset;
    const loadingState = reset ? setIsSearching : setIsLoadingMore;
    
    loadingState(true);
    try {
      const response = await axios.get(
        `${api_url}/search`,{
          params: {
            prefix: searchQuery.trim(),
          }
        }
      );
      const newResults = response.data;

      if (reset) {
        setSearchResults(newResults);
        setOffset(INITIAL_LIMIT);
      } else {
        setSearchResults(prev => [...prev, ...newResults]);
        setOffset(currentOffset + MORE_LIMIT);
      }
      setHasMore(newResults.length === currentLimit);
    } catch (error) {
      console.error('Search failed:', error);
      if (reset) {
        setSearchResults([]);
      }
    } finally {
      loadingState(false);
    }
  };

  // const handleSubjectSearch = async () => {
  //   if (!searchQuery.trim()) return;
  //   setIsSearching(true);
  //   try {
  //     const results = await searchSubjects(searchQuery);
  //     setSearchResults(results);
  //     setHasMore(false);
  //   } catch (error) {
  //     console.error('Subject search failed:', error);
  //     setSearchResults([]);
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  // const handleSubjectSelect = async (subject) => {
  //   setIsSearching(true);
  //   try {
  //     const characters = await getCharactersBySubjectId(subject.id);
  //     const formattedCharacters = await Promise.all(characters.map(async character => {
  //       const details = await getCharacterDetails(character.id);
  //       return {
  //         id: character.id,
  //         image: character.images?.grid,
  //         name: character.name,
  //         nameCn: details.nameCn,
  //         gender: details.gender,
  //         popularity: details.popularity
  //       };
  //     }));
  //     setSearchResults(formattedCharacters);
  //   } catch (error) {
  //     console.error('Failed to fetch characters:', error);
  //     setSearchResults([]);
  //   } finally {
  //     setIsSearching(false);
  //   }
  // };

  const handleCharacterSelect = (character) => {
    onCharacterSelect(character.gameid);
    setSearchQuery('');
    setSearchResults([]);
    setOffset(0);
    setHasMore(true);
  };

  const renderSearchResults = () => {
    if (searchResults.length === 0) return null;
    return (
      <div className="search-dropdown">
        {isSearching ? (
          <div className="search-loading">Loading...</div>
        ) : (
          <>
            {searchResults.map((character) => (
              <div
                key={character.gameid}
                className="search-result-item"
                onClick={() => handleCharacterSelect(character)}
              >
                <div className="result-character-info">
                  <div className="result-character-name">{character.gameid}</div>
                  <div className="result-character-name-cn">{character.realname}</div>
                </div>
              </div>
            ))}
            {hasMore && (
              <div className="search-result-item load-more" onClick={handleLoadMore}>
                {isLoadingMore ? '加载中...' : '更多'}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="search-section">
      <div className="search-box">
        <div className="search-input-container" ref={searchContainerRef}>
          <input
            type="text"
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isGuessing || gameEnd}
            placeholder={"Search any player..."}
          />
          {renderSearchResults()}
        </div>
        <button 
          className="search-button active"
          onClick={() => {
            if (searchQuery.trim()) handleSearch(true);
          }}
          disabled={!searchQuery.trim() || isSearching || isGuessing || gameEnd}
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </div>
    </div>
  );
}

export default SearchBar;