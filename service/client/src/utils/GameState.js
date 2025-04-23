import axios from 'axios';

class GameState {
  constructor() {
    this.guessHistory = [];
    this.previousAnswers = new Set();
    this.answerPlayer = null;
  }

  async initialize(minWorldsApp) {
    // this.answerPlayer = await getRandomPlayer();
    const response = await axios.get(`http://localhost:5101/api/initialize`);
    this.answerPlayer = response.data;
    console.log(this.answerPlayer);
  }

  async compareGuess(guessGameId) {
    // const guessPlayer = await getPlayerByGameId(guessGameId);
    const response = await axios.get(`http://localhost:5101/api/player`, {
      params: {
        gameid: guessGameId
      }
    });
    const guessPlayer = response.data;
    if (!guessPlayer) {
      return null;
    }

    this.agentColors = guessPlayer.agents.map(guessAgent => {
      const hasMatch = this.answerPlayer.agents.some(answerAgent => answerAgent.agent === guessAgent.agent);
      return hasMatch ? 'GREEN' : 'WHITE';
    });

    return {
      ...guessPlayer,
      col_team: this.getColorCode(this.answerPlayer.teamid === guessPlayer.teamid, this.answerPlayer.teamid === guessPlayer.teamid),
      col_nationality: this.getColorCode(this.answerPlayer.nationalitylogo === guessPlayer.nationalitylogo, this.answerPlayer.continent === guessPlayer.continent),
      col_worldsapp: this.getColorCode(this.answerPlayer.worldsapp === guessPlayer.worldsapp, Math.abs(this.answerPlayer.worldsapp - guessPlayer.worldsapp) < 3),
      agentColors: this.agentColors,
      tip_worldsapp: this.answerPlayer.worldsapp !== guessPlayer.worldsapp? ((this.answerPlayer.worldsapp > guessPlayer.worldsapp)? '↑' : '↓') : '',
      is_correct: this.answerPlayer.gameid.toLowerCase() === guessPlayer.gameid.toLowerCase()
    };
  }

  getColorCode(exactMatch, partialMatch) {
    return exactMatch ? 'GREEN' : partialMatch ? 'YELLOW' : 'WHITE';
  }
}

// module.exports = GameState;
export default GameState;