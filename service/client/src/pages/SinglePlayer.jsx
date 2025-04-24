import { useEffect, useState, useRef } from 'react';
import SearchBar from '../components/SearchBar';
import GuessesTable from '../components/GuessesTable';
import SettingsPopup from '../components/SettingsPopup';
import HelpPopup from '../components/HelpPopup';
import GameEndPopup from '../components/GameEndPopup';
import SocialLinks from '../components/SocialLinks';
import GameInfo from '../components/GameInfo';
import Timer from '../components/Timer';
import GameState from '../utils/GameState';
import '../styles/game.css';
import '../styles/SinglePlayer.css';
import { useLocalStorage } from 'usehooks-ts';

function SinglePlayer() {
  const [guesses, setGuesses] = useState([]);
  const [guessesLeft, setGuessesLeft] = useState(10);
  const [isGuessing, setIsGuessing] = useState(false);
  const [gameEnd, setGameEnd] = useState(false);
  const [gameEndPopup, setGameEndPopup] = useState(null);
  const [settingsPopup, setSettingsPopup] = useState(false);
  const [helpPopup, setHelpPopup] = useState(false);
  const [currentTimeLimit, setCurrentTimeLimit] = useState(null);
  const [shouldResetTimer, setShouldResetTimer] = useState(false);
  const [curgame] = useState(() => new GameState());
  const [gameSettings, setGameSettings, removeGameSettings] = useLocalStorage('singleplayer-game-settings', {
    maxAttempts: 10,
    timeLimit: null,
    minWorldsApp: 1,
  });
  // Initialize game
  useEffect(() => { 
    let isMounted = true;

    const initializeGame = async () => {
      try {
        await curgame.initialize(gameSettings.minWorldsApp);
        setIsGuessing(false);
        if (isMounted) {
          setGuessesLeft(gameSettings.maxAttempts);
          setCurrentTimeLimit(gameSettings.timeLimit);
          console.log('Initialization with', gameSettings);
        }
      } catch (error) {
        console.error('Failed to initialize game:', error);
        if (isMounted) {
          alert('initialize game failed, please try again');
        }
      }
    };

    initializeGame();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePlayerSelect = async (gameid) => {
    if (isGuessing || !curgame.answerPlayer) return;
    setIsGuessing(true);
    setShouldResetTimer(true);

    try {
      const guessData = await curgame.compareGuess(gameid);

      setGuessesLeft(prev => prev - 1);

      if (guessData.is_correct || guessesLeft <= 1) {
        setGuesses(prevGuesses => [...prevGuesses, {
          gameid: gameid,
          profile_url: guessData.profile_url,
          realname: guessData.realname,
          teamlogo: guessData.teamlogo,
          teamname: guessData.teamname,
          nationlogo: guessData.nationalitylogo,
          worldsapp: guessData.worldsapp + guessData.tip_worldsapp,
          agents: guessData.agents,
          col_team: guessData.col_team,
          col_nationality: guessData.col_nationality,
          col_worldsapp: guessData.col_worldsapp,
          col_agents: guessData.agentColors,
          isAnswer: guessData.is_correct
        }]);

        setGameEnd(true);
        setGameEndPopup({
          result: guessData.is_correct? 'win' : 'lose',
          answer: curgame.answerPlayer
        });
      } else {
        setGuesses(prevGuesses => [...prevGuesses, {
          gameid: gameid,
          profile_url: guessData.profile_url,
          realname: guessData.realname,
          teamlogo: guessData.teamlogo,
          teamname: guessData.teamname,
          nationlogo: guessData.nationalitylogo,
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
      alert('Error occurs, please try again');
    } finally {
      setIsGuessing(false);
      setShouldResetTimer(false);
    }
  };

  const handleSettingsChange = (setting, value) => {
    setGameSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleRestartWithSettings = () => {
    setGuesses([]);
    setGuessesLeft(gameSettings.maxAttempts);
    setIsGuessing(false);
    setGameEnd(false);
    setGameEndPopup(null);
    setSettingsPopup(false);
    setCurrentTimeLimit(gameSettings.timeLimit);
    setShouldResetTimer(false);

    const initializeNewGame = async () => {
      try {
        await curgame.initialize(gameSettings.minWorldsApp);
        setGuessesLeft(gameSettings.maxAttempts);
        setCurrentTimeLimit(gameSettings.timeLimit);
        console.log('Initialization with', gameSettings);
      } catch (error) {
        console.error('Failed to initialize new game:', error);
        alert('initialize game failed, please try again');
      }
    };

    initializeNewGame();
  };

  const timeUpRef = useRef(false);

  const handleTimeUp = () => {
    if (timeUpRef.current) return; // prevent multiple triggers
    timeUpRef.current = true;

    setGuessesLeft(prev => {
      const newGuessesLeft = prev - 1;
      if (newGuessesLeft <= 0) {
        setGameEnd(true);
        setGameEndPopup({
          result: 'lose',
          answer: curgame.answerPlayer
        });
      }
      return newGuessesLeft;
    });
    setShouldResetTimer(true);
    setTimeout(() => {
      setShouldResetTimer(false);
      timeUpRef.current = false;
    }, 100);
  };

  const handleSurrender = () => {
    if (gameEnd) return;

    setGameEnd(true);
    setGameEndPopup({
      result: 'lose',
      answer: curgame.answerPlayer
    });
    alert('Ok, it\'s time to show the answer.');
  };

  return (
    <div className="container single-player-container">
      <SocialLinks
        onSettingsClick={() => setSettingsPopup(true)}
        onHelpClick={() => setHelpPopup(true)}
      />

      <div className="search-bar">
        <SearchBar
          onCharacterSelect={handlePlayerSelect}
          isGuessing={isGuessing}
          gameEnd={gameEnd}
        />
      </div>

      {currentTimeLimit && (
        <Timer
          timeLimit={currentTimeLimit}
          onTimeUp={handleTimeUp}
          isActive={!gameEnd && !isGuessing}
          reset={shouldResetTimer}
        />
      )}

      <GameInfo
        gameEnd={gameEnd}
        guessesLeft={guessesLeft}
        onRestart={handleRestartWithSettings}
        answerPlayer={curgame.answerPlayer}
        onSurrender={handleSurrender}
      />

      <GuessesTable
        guesses={guesses}
      />

      {settingsPopup && (
        <SettingsPopup
          gameSettings={gameSettings}
          onSettingsChange={handleSettingsChange}
          onClose={() => setSettingsPopup(false)}
          onRestart={handleRestartWithSettings}
        />
      )}

      {helpPopup && (
        <HelpPopup onClose={() => setHelpPopup(false)} />
      )}

      {gameEndPopup && (
        <GameEndPopup
          result={gameEndPopup.result}
          answer={gameEndPopup.answer}
          onClose={() => setGameEndPopup(null)}
        />
      )}
    </div>
  );
}

export default SinglePlayer;