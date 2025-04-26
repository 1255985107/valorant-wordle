import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { io } from 'socket.io-client';
import SettingsPopup from '../components/SettingsPopup';
import SearchBar from '../components/SearchBar';
import GuessesTable from '../components/GuessesTable';
import Timer from '../components/Timer';
import PlayerList from '../components/PlayerList';
import GameEndPopup from '../components/GameEndPopup';
import '../styles/Multiplayer.css';
import '../styles/game.css';
import CryptoJS from 'crypto-js';
import { useLocalStorage } from 'usehooks-ts';
import GameState from '../utils/GameState';

const secret = import.meta.env.VITE_AES_SECRET;
const SOCKET_URL = import.meta.env.VITE_ROOM_SERVER_URL || 'http://localhost:3000';

const Multiplayer = () => {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState([]);
  const [roomUrl, setRoomUrl] = useState('');
  const [username, setUsername] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [socket, setSocket] = useState(null);
  const [error, setError] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [gameSettings, setGameSettings, removeGameSettings] = useLocalStorage('multiplayer-game-settings', {
    maxAttempts: 10,
    timeLimit: null,
    minWorldsApp: 1,
  });

  // Game state
  const [isGameStarted, setIsGameStarted] = useState(false);
  const [guesses, setGuesses] = useState([]);
  const [guessesLeft, setGuessesLeft] = useState(10);
  const [isGuessing, setIsGuessing] = useState(false);
  const [shouldResetTimer, setShouldResetTimer] = useState(false);
  const [gameEnd, setGameEnd] = useState(false);
  const timeUpRef = useRef(false);
  const gameEndedRef = useRef(false);
  const [winner, setWinner] = useState(null);
  const [globalGameEnd, setGlobalGameEnd] = useState(false);
  const [guessesHistory, setGuessesHistory] = useState([]);
  const [showNames, setShowNames] = useState(true);
  const [showCharacterPopup, setShowCharacterPopup] = useState(false);
  const [curgame] = useState(() => new GameState());

  const convertflag = (nationalitylogo) => {
    const up = nationalitylogo.toUpperCase();
    if (up === "EN") return "GB";
    else if (up === "UN") return "AQ";
    else return up;
  };
  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('updatePlayers', ({ players, isPublic }) => {
      setPlayers(players);
      if (isPublic !== undefined) {
        setIsPublic(isPublic);
      }
    });

    newSocket.on('roomClosed', ({ message }) => {
      alert(message || 'The host has disconnected.');
      setError('The room has been closed.');
      navigate('/multiplayer');
    });

    newSocket.on('error', ({ message }) => {
      alert(`Error: ${message}`);
      setError(message);
      setIsJoined(false);
    });

    newSocket.on('updateGameSettings', ({ settings }) => {
      console.log('Received game settings:', settings);
      setGameSettings(settings);
    });

    newSocket.on('gameStart', ({ answerPlayer, settings, players, isPublic }) => {
      gameEndedRef.current = false;
      const decryptedPlayer = JSON.parse(CryptoJS.AES.decrypt(answerPlayer, secret).toString(CryptoJS.enc.Utf8));
      curgame.answerPlayer = decryptedPlayer;
      setGameSettings(settings);
      setGuessesLeft(settings.maxAttempts);
      if (players) {
        setPlayers(players);
      }
      if (isPublic !== undefined) {
        setIsPublic(isPublic);
      }
      setGlobalGameEnd(false);
      setIsGameStarted(true);
      setGameEnd(false);
      setGuesses([]);
    });

    // Listen for game end event
    newSocket.on('gameEnded', ({ message, guesses }) => {
      setWinner(message);
      setGlobalGameEnd(true);
      setGuessesHistory(guesses);
      setIsGameStarted(false);
    });

    // Listen for reset ready status event
    newSocket.on('resetReadyStatus', () => {
      setPlayers(prevPlayers => prevPlayers.map(player => ({
        ...player,
        ready: player.isHost ? player.ready : false
      })));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [navigate]);

  useEffect(() => {
    if (!roomId) {
      // Create new room if no roomId in URL
      const newRoomId = uuidv4();
      setIsHost(true);
      navigate(`/multiplayer/${newRoomId}`);
    } else {
      // Set room URL for sharing
      setRoomUrl(window.location.href);
    }
  }, [roomId, navigate]);

  useEffect(() => {
    console.log('Game Settings:', gameSettings);
    if (isHost && isJoined) {
      socket.emit('updateGameSettings', { roomId, settings: gameSettings });
    }
  }, [showSettings]);

  const handleJoinRoom = () => {
    if (!username.trim()) {
      alert('Please enter your username');
      setError('Please enter a username');
      return;
    }

    setError('');
    if (isHost) {
      socket.emit('createRoom', { roomId, username });
      // Send initial game settings when creating room
      socket.emit('updateGameSettings', { roomId, settings: gameSettings });
    } else {
      socket.emit('joinRoom', { roomId, username });
      // Request current settings from server
      socket.emit('requestGameSettings', { roomId });
    }
    setIsJoined(true);
  };

  const handleReadyToggle = () => {
    socket.emit('toggleReady', { roomId });
  };

  const handleSettingsChange = (key, value) => {
    setGameSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const copyRoomUrl = () => {
    navigator.clipboard.writeText(roomUrl);
  };

  const handleGameEnd = (isWin) => {
    if (gameEndedRef.current) return;
    gameEndedRef.current = true;
    setGameEnd(true);

    // Emit game end event to server
    socket.emit('gameEnd', {
      roomId,
      result: isWin ? 'win' : 'lose'
    });

    // Update player score
    if (isWin) {
      const updatedPlayers = players.map(p => {
        if (p.id === socket.id) {
          return { ...p, score: p.score + 1 };
        }
        return p;
      });
      setPlayers(updatedPlayers);
      socket.emit('updateScore', { roomId, score: updatedPlayers.find(p => p.id === socket.id).score });
    }
  };

  const handleCharacterSelect = async (gameid) => {
    if (isGuessing || !curgame.answerPlayer || gameEnd) return;

    setIsGuessing(true);
    // setShouldResetTimer(true);

    try {
      const guessData = await curgame.compareGuess(gameid);
      
      setGuessesLeft(prev => prev - 1);
      // Send guess result to server
      socket.emit('playerGuess', {
        roomId,
        guessResult: {
          isCorrect,
          profile_url: guessData.profile_url,
          gameid: gameid,
          realname: guessData.realname,
        }
      });

      if (guessData.is_correct || guessesLeft <= 1) {
        setGuesses(prevGuesses => [...prevGuesses, {
            gameid: gameid,
            profile_url: guessData.profile_url,
            realname: guessData.realname,
            teamlogo: guessData.teamlogo,
            teamname: guessData.teamname,
            nationlogo: convertflag(guessData.nationalitylogo),
            worldsapp: guessData.worldsapp + guessData.tip_worldsapp,
            agents: guessData.agents,
            col_team: guessData.col_team,
            col_nationality: guessData.col_nationality,
            col_worldsapp: guessData.col_worldsapp,
            col_agents: guessData.agentColors,
            isAnswer: guessData.is_correct
        }]);

        handleGameEnd(guessData.is_correct);
      } else {
        setGuesses(prevGuesses => [...prevGuesses, {
          gameid: gameid,
          profile_url: guessData.profile_url,
          realname: guessData.realname,
          teamlogo: guessData.teamlogo,
          teamname: guessData.teamname,
          nationlogo: convertflag(guessData.nationalitylogo),
          worldsapp: guessData.worldsapp + guessData.tip_worldsapp,
          agents: guessData.agents,
          col_team: guessData.col_team,
          col_nationality: guessData.col_nationality,
          col_worldsapp: guessData.col_worldsapp,
          col_agents: guessData.agentColors,
          isAnswer: false
        }]);
      }
    } catch (error) {
      console.error('Error processing guess:', error);
      alert('Error processing guess, please retry');
    } finally {
      setIsGuessing(false);
      // setShouldResetTimer(false);
    }
  };

  const handleTimeUp = () => {
    if (timeUpRef.current || gameEnd || gameEndedRef.current) return;
    timeUpRef.current = true;

    const newGuessesLeft = guessesLeft - 1;

    setGuessesLeft(newGuessesLeft);

    // Always emit timeout
    socket.emit('timeOut', { roomId });

    if (newGuessesLeft <= 0) {
      setTimeout(() => {
        handleGameEnd(false);
      }, 100);
    }

    setShouldResetTimer(true);
    setTimeout(() => {
      setShouldResetTimer(false);
      timeUpRef.current = false;
    }, 100);
  };

  const handleSurrender = () => {
    if (gameEnd || gameEndedRef.current) return;
    gameEndedRef.current = true;
    setGameEnd(true);

    // Emit game end event with surrender result
    socket.emit('gameEnd', {
      roomId,
      result: 'surrender'
    });
  };

  const handleStartGame = async () => {
    if (isHost) {
      try {
        await curgame.initialize(gameSettings.minWorldsApp);
        // console.log(curgame.answerPlayer);
        const encryptedPlayer = CryptoJS.AES.encrypt(JSON.stringify(curgame.answerPlayer), secret).toString();
        socket.emit('gameStart', {
          roomId,
          player: encryptedPlayer,
          settings: gameSettings
        });

        // Update local state
        setGuessesLeft(gameSettings.maxAttempts);

        setGlobalGameEnd(false);
        setIsGameStarted(true);
        setGameEnd(false);
        setGuesses([]);
      } catch (error) {
        console.error('Failed to initialize game:', error);
        alert('initialize game failed, please try again');
      }
    }
  };

  const handleVisibilityToggle = () => {
    socket.emit('toggleRoomVisibility', { roomId });
  };

  if (!roomId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="multiplayer-container">
      {!isJoined ? (
        <div className="join-container">
          <h2>{isHost ? 'Create Room' : 'Join Room'}</h2>
          <input
            type="text"
            placeholder="Type your username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="username-input"
            maxLength={20}
          />
          <button onClick={handleJoinRoom} className="join-button">
            {isHost ? 'Create' : 'Join'}
          </button>
          {error && <p className="error-message">{error}</p>}
        </div>
      ) : (
        <>
          <PlayerList
            players={players}
            socket={socket}
            isGameStarted={isGameStarted}
            handleReadyToggle={handleReadyToggle}
            onAnonymousModeChange={setShowNames}
          />

          {!isGameStarted && !globalGameEnd && (
            <>
              {isHost && (
                <div className="host-controls">
                  <div className="room-url-container">
                    <input
                      type="text"
                      value={roomUrl}
                      readOnly
                      className="room-url-input"
                    />
                    <button onClick={copyRoomUrl} className="copy-button">Copy</button>
                  </div>
                </div>
              )}
              {isHost && (
                <div className="host-game-controls">
                  <div className="button-group">
                    <button
                      onClick={handleVisibilityToggle}
                      className="visibility-button"
                    >
                      {isPublic ? '🔓Public' : '🔒Private'}
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="settings-button"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleStartGame}
                      className="start-game-button"
                      disabled={players.length < 2 || players.some(p => !p.isHost && !p.ready && !p.disconnected)}
                    >
                      Start
                    </button>
                  </div>
                  <div className="anonymous-mode-info">
                    Anonymous mode? Click "USERNAME" / "ANONYMOUS" to switch.
                  </div>
                </div>
              )}
              {!isHost && (
                <div className="game-settings-display">
                  <pre>{JSON.stringify(gameSettings, null, 2)}</pre>
                </div>
              )}
            </>
          )}

          {isGameStarted && !globalGameEnd && (
            // In game
            <div className="container">
              <SearchBar
                onCharacterSelect={handleCharacterSelect}
                isGuessing={isGuessing}
                gameEnd={gameEnd}
              />
              {gameSettings.timeLimit && !gameEnd && (
                <Timer
                  timeLimit={gameSettings.timeLimit}
                  onTimeUp={handleTimeUp}
                  isActive={!isGuessing}
                  reset={shouldResetTimer}
                />
              )}
              <div className="game-info">
                <div className="guesses-left">
                  <span>Times Remained: {guessesLeft}</span>
                  <button
                    className="surrender-button"
                    onClick={handleSurrender}
                  >
                    Surrender 🏳️
                  </button>
                </div>
              </div>
              <GuessesTable
                guesses={guesses}
              />
            </div>
          )}

          {!isGameStarted && globalGameEnd && (
            // After game ends
            <div className="container">
              {isHost && (
                <div className="host-game-controls">
                  <div className="button-group">
                    <button
                      onClick={handleVisibilityToggle}
                      className="visibility-button"
                    >
                      {isPublic ? '🔓Public' : '🔒Private'}
                    </button>
                    <button
                      onClick={() => setShowSettings(true)}
                      className="settings-button"
                    >
                      Settings
                    </button>
                    <button
                      onClick={handleStartGame}
                      className="start-game-button"
                      disabled={players.length < 2 || players.some(p => !p.isHost && !p.ready && !p.disconnected)}
                    >
                      Start
                    </button>
                  </div>
                </div>
              )}
              <div className="game-end-message">
                {showNames ? <>{winner}<br /></> : ''} 答案是: {curgame.answerPlayer.gameid}
                <button
                  className="character-details-button"
                  onClick={() => setShowCharacterPopup(true)}
                >
                  Check for details
                </button>
              </div>
              <div className="game-end-container">
                {!isHost && (
                  <div className="game-settings-display">
                    <pre>{JSON.stringify(gameSettings, null, 2)}</pre>
                  </div>
                )}
                <div className="guess-history-table">
                  <table>
                    <thead>
                      <tr>
                        {guessesHistory.map((playerGuesses, index) => (
                          <th key={playerGuesses.username}>
                            {showNames ? playerGuesses.username : `Player${index + 1}`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(...guessesHistory.map(g => g.guesses.length)) }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                          {guessesHistory.map(playerGuesses => (
                            <td key={playerGuesses.username}>
                              {playerGuesses.guesses[rowIndex] && (
                                <>
                                  <img className="character-icon" src={playerGuesses.guesses[rowIndex].profile_url} alt={playerGuesses.guesses[rowIndex].gameid} />
                                  <div className="character-name">{playerGuesses.guesses[rowIndex].gameid}</div>
                                  <div className="character-name-cn">{playerGuesses.guesses[rowIndex].realname}</div>
                                </>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {showSettings && (
            <SettingsPopup
              gameSettings={gameSettings}
              onSettingsChange={handleSettingsChange}
              onClose={() => setShowSettings(false)}
              hideRestart={true}
            />
          )}

          {globalGameEnd && showCharacterPopup && answerCharacter && (
            <GameEndPopup
              result={guesses.some(g => g.isAnswer) ? 'win' : 'lose'}
              answer={curgame.answerPlayer}
              onClose={() => setShowCharacterPopup(false)}
            />
          )}
        </>

      )}
    </div>
  );
};

export default Multiplayer;