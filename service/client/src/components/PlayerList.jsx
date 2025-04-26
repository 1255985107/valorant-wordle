import React, { useState } from 'react';

const PlayerList = ({ players, socket, isGameStarted, handleReadyToggle, onAnonymousModeChange }) => {
  const [showNames, setShowNames] = useState(true);

  const handleShowNamesToggle = () => {
    const newShowNames = !showNames;
    setShowNames(newShowNames);
    if (onAnonymousModeChange) {
      onAnonymousModeChange(newShowNames);
    }
  };

  return (
    <div className="players-list">
      <table className="score-table">
        <thead>
          <tr>
            <th></th>
            <th>
              <button 
                onClick={handleShowNamesToggle} 
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  cursor: 'pointer',
                  padding: '0',
                  margin: '0',
                  height: 'auto',
                  lineHeight: '1',
                  fontSize: 'inherit',
                  outline: 'none'
                }}
              >
                {showNames ? 'USERNAME' : 'ANONYMOUS'}
              </button>
            </th>
            <th>SCORE</th>
            <th>GUESS</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => (
            <tr key={player.id}>
              <td>
                {player.disconnected ? 'disconnected' : player.isHost ? (
                  'Host'
                ) : player.id === socket?.id && !isGameStarted ? (
                  <button 
                    onClick={handleReadyToggle}
                    className={`ready-button ${player.ready ? 'ready' : ''}`}
                  >
                    {player.ready ? 'Unready' : 'Ready'}
                  </button>
                ) : (
                  player.ready ? 'Ready' : 'Not ready'
                )}
              </td>
              <td>
                <span style={{
                  backgroundColor: !showNames && player.id !== socket?.id ? '#000' : 'transparent',
                  color: !showNames && player.id !== socket?.id ? '#000' : 'inherit',
                  padding: !showNames && player.id !== socket?.id ? '2px 4px' : '0'
                }}>
                  {player.username}
                </span>
              </td>
              <td>{player.score}</td>
              <td>{player.guesses || ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default PlayerList; 