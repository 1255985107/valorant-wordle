import '../styles/popups.css';

function GameEndPopup({ result, answer, onClose }) {

  const convertflag = (nationalitylogo) => {
	  const up = nationalitylogo.toUpperCase();
	  if (up === "EN") return "GB";
	  else if (up === "UN") return "AQ";
	  else return up;
  };

  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={onClose}>×</button>
        <div className="popup-header">
          <h2>{result === 'win' ? '🎉 Nice Guess!' : '😢 Game Over...'}</h2>
        </div>
        <div className="popup-body">
          <div className="answer-character">
            <img
              src={answer.profile_url}
              alt={answer.gameid}
              className="answer-character-image"
            />
            <div className="answer-character-info">
              <div className="character-name-container">
                <a
                  href={`https://liquipedia.net/valorant/${answer.gameid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="character-link"
                >
                  <div className="answer-character-name">
                    <img src={`https://flagsapi.com/${convertflag(answer.nationalitylogo)}/flat/64.png`}/> {answer.gameid}
                  </div>
                  <div className="answer-character-name-cn">{answer.realname}</div>
                </a>
                <div className="answer-character-team">
                  <img src={answer.teamlogo} />
                  {answer.teamname}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GameEndPopup;