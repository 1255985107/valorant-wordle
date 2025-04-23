import '../styles/popups.css';
import { getIndexInfo, searchSubjects } from '../utils/anime';
import { useState, useEffect, useRef } from 'react';

function SettingsPopup({ gameSettings, onSettingsChange, onClose, onRestart, hideRestart = false }) {
  const [indexInputValue, setIndexInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const searchContainerRef = useRef(null);

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      // Add a small delay to allow click events to complete
      setTimeout(() => {
        if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
          setSearchResults([]);
        }
      }, 100);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced search function
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Initialize indexInputValue and fetch indexInfo if indexId exists
  useEffect(() => {
    if (gameSettings.useIndex && gameSettings.indexId) {
      setIndexInputValue(gameSettings.indexId);
    }
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await searchSubjects(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={onClose}>×</button>
        <div className="popup-header">
          <h2>Settings</h2>
        </div>
        <div className="popup-body">
          <div className="settings-content">
            <div className="settings-section">
              <div className="settings-row">
                <label>Chances: </label>
                <input 
                  type="number"
                  value={gameSettings.maxAttempts || ''}
                  onChange={(e) => {
                    const value = e.target.value === '' ? 10 : Math.max(5, Math.min(15, parseInt(e.target.value) || 5));
                    onSettingsChange('maxAttempts', value);
                  }}
                  min="5"
                  max="15"
                />
              </div>

              <div className="settings-row">
                <label>*Minimum Worlds App.: </label>
                <input
                  type="checkbox"
                  checked={gameSettings.minWorldsApp !== null}
                  onChange={(e) => onSettingsChange('minWorldsApp', e.target.checked ? 1 : null)}
                />
                {gameSettings.minWorldsApp !== null && (
                  <div className="settings-row">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={gameSettings.minWorldsApp}
                      onChange={(e) => {
                        const value = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                        onSettingsChange('minWorldsApp', value);
                      }}
                    />
                    <label>times</label>
                  </div>
                )}
              </div>

              <div className="settings-row">
                <label>*Time Limit: </label>
                <input
                  type="checkbox"
                  checked={gameSettings.timeLimit !== null}
                  onChange={(e) => onSettingsChange('timeLimit', e.target.checked ? 60 : null)}
                />
                {gameSettings.timeLimit !== null && (
                  <div className="settings-row">
                    <input
                      type="number"
                      min="30"
                      max="120"
                      value={gameSettings.timeLimit}
                      onChange={(e) => {
                        const value = Math.max(30, Math.min(120, parseInt(e.target.value) || 30));
                        onSettingsChange('timeLimit', value);
                      }}
                    />
                    <label>sec/round</label>
                  </div>
                )}
              </div>
              <div className="settings-row">
                <label>(settings may have bugs, especially with "*")</label>
              </div>
              
            </div>
          </div>
        </div>
        <div className="popup-footer">
          {!hideRestart && (
            <>
              <button className="restart-button" onClick={onRestart} style={{ marginRight: '10px' }}>
                Restart
              </button>
              <label style={{ fontSize: '0.8rem' }}>*New settings would not be applied unless you restart.</label>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default SettingsPopup; 
