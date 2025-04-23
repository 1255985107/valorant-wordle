import '../styles/guesses.css';
import { useState } from 'react';

function GuessesTable({ guesses }) {
  return (
    <div className="table-container">
      <table className="guesses-table">
        <thead>
          <tr>
            <th></th>
            <th>Name</th>
            <th>Team</th>
            <th>Nation/Region</th>
            <th>Worlds App.</th>
            <th>Signature Agents</th>
          </tr>
        </thead>
        <tbody>
          {guesses.map((guess, guessIndex) => (
            <tr key={guessIndex}>
              <td>
                <img src={guess.profile_url} alt="character" className="character-icon" />
              </td>
              <td>
                <div className={`character-name-container ${guess.isAnswer ? 'correct' : ''}`}>
                  <div className="character-name">{guess.gameid}</div>
                  <div className="character-name-cn">{guess.realname}</div>
                </div>
              </td>
              <td>
                <span className={`feedback-cell ${guess.col_team === 'GREEN' ? 'correct' : ''}`}>
                  <img src={guess.teamlogo} alt={guess.teamname} className="team-icon" />
                  <p> {guess.teamname}</p>
                </span>
                
              </td>
              <td>
                <span className={`feedback-cell ${guess.col_nationality === 'GREEN' ? 'correct' : (guess.col_nationality === 'YELLOW') ? 'partial' : ''}`}>
                  <img src={`https://flagsapi.com/${guess.nationlogo.toUpperCase()}/flat/64.png`} alt={guess.nationlogo} className='agent-small-icon'/>
                </span>
              </td>
              <td>
                <span className={`feedback-cell ${guess.col_worldsapp === 'GREEN'? 'correct' : (guess.col_worldsapp === 'YELLOW')? 'partial' : ''}`}>
                  {guess.worldsapp}
                </span>
              </td>
              <td>
                <div className="meta-tags-container">
                  {guess.agents.map((agent, index) => {
                    return (
                      <span
                        key={agent.agent}
                        className={`feedback-cell ${guess.col_agents[index] === 'GREEN' ? 'correct' : ''} agent-small-icon`}
                      >
                        <img src={`https://www.vlr.gg/img/vlr/game/agents/${agent.agent}.png`} alt={agent.agent} className='agent-small-icon'/>
                      </span>
                    );
                  })}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default GuessesTable; 