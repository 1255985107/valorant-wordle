import '../styles/popups.css';

function HelpPopup({ onClose }) {
  return (
    <div className="popup-overlay">
      <div className="popup-content">
        <button className="popup-close" onClick={onClose}>×</button>
        <div className="popup-header">
          <h2>How to play</h2>
        </div>
        <div className="popup-body">
          <div className="help-content">
            <div className="help-text">
              First a player will be chosen at random.<br/>
              And you can guess a player as you like.<br/>
              The table shows the similarity between your choice and the answer.<br/>
              Team: Green = the same team;<br/>
              Nationality/Region: Green = the same region; Yellow = regions from the same continent<br/>
              Worlds Appearances: Green = the same count; Yellow = count difference &lt; 3<br/>
              Signature Agents: Green = the same agent;<br/>
              "↑": guess higher;<br/>
              "↓": guess lower.<br/>
              <br/>
              Worlds range: <br/>
              Champions Tour 2025: Masters Bangkok <br/>
              Valorant Champions 2024 <br/>
              Champions Tour 2024: Masters Shanghai <br/>
              Champions Tour 2024: Masters Madrid <br/>
              Valorant Champions 2023 <br/>
              Champions Tour 2023: Masters Tokyo <br/>
              Champions Tour 2023: LOCK//IN São Paulo <br/>
              Valorant Champions 2022 <br/>
              Valorant Champions Tour 2022 Stage 2: Masters Copenhagen <br/>
              Valorant Champions Tour 2022 Stage 1: Masters Reykjavík <br/>
              Valorant Champions 2021 <br/>
              Valorant Champions Tour 2021 Stage 3: Masters Berlin <br/>
              Valorant Champions Tour 2021 Stage 2: Masters Reykjavík <br/>
              <br/>
              Any bugs or suggestions? Please message me on Bilibili.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPopup; 