import '../styles/game.css';

function GameInfo({ gameEnd, guessesLeft, onRestart, answerPlayer, onSurrender }) {
  return (
    <div className="game-info">
      {gameEnd ? (
        <button className="restart-button" onClick={onRestart}>
          Once Again
        </button>
      ) : (
        <div className="game-info-container">
          <div className="game-controls">
            <span>Times Remained: {guessesLeft}</span>
            {onSurrender && (
              <button className="surrender-button" onClick={onSurrender}>
                Surrender 🏳️
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default GameInfo;