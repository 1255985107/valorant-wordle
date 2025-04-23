import '../styles/social.css';

function SocialLinks({ onSettingsClick, onHelpClick }) {
  return (
    <div className="social-links">
      <div className="difficulty-hint">
        <span>Settings Here:</span>
        <div className="arrow"></div>
      </div>
      <button className="social-link settings-button" onClick={onSettingsClick}>
        <i className="fas fa-cog"></i>
      </button>
      <button className="social-link help-button" onClick={onHelpClick}>
        <i className="fas fa-question-circle"></i>
      </button>
      <a href="https://www.vlr.gg/" target="_blank" rel="noopener noreferrer" className="social-link">
        <img src="https://www.vlr.gg/img/vlr/logo_header.png" alt="VLRGG" className="bangumi-icon" />
      </a>
      <a href="https://github.com/1255985107/valorant-wordle" target="_blank" rel="noopener noreferrer" className="social-link">
        <i className="fab fa-github"></i>
      </a>
      <a href="https://space.bilibili.com/283419569" target="_blank" rel="noopener noreferrer" className="social-link">
        <i className="fa-brands fa-bilibili"></i>
      </a>
    </div>
  );
}

export default SocialLinks; 