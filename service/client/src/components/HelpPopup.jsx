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
              Green: same or very close;<br/>
              Yellow: a bit close.<br/>
              "↑": guess higher;<br/>
              "↓": guess lower.<br/>
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