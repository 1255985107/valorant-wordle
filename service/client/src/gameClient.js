const readline = require('readline');
const mysql = require('mysql2/promise');
const { getPlayerByGameId, getRandomPlayer } = require('../../server/playerService');

const colors = {
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

class GameState {
  constructor() {
    this.remainingGuesses = 8;
    this.guessHistory = [];
    this.previousAnswers = new Set();
    this.answerPlayer = null;
  }

  async initialize() {
    // this.answerPlayer = await axios.get(`http://localhost:5101/initialize`);
    this.answerPlayer = await getRandomPlayer();
  }

  async compareGuess(guessGameId) {
    const guessPlayer = await getPlayerByGameId(guessGameId);

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
    };
  }

  getColorCode(exactMatch, partialMatch) {
    return exactMatch ? 'GREEN' : partialMatch ? 'YELLOW' : 'WHITE';
  }

}

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function outputplayer(result) {
  console.log(`Team Name: ${colors[result.col_team]}${result.teamname}${colors.RESET}`);
  console.log(`Nation/Region: ${colors[result.col_nationality]}${result.nationalitylogo}${colors.RESET}`);
  console.log(`Signature Agents: ${result.agents.map((agent, index) => `${colors[result.agentColors[index]]}${agent.agent}${colors.RESET}`).join(' ')}`);
  console.log(`Worlds App.: ${colors[result.col_worldsapp]}${result.worldsapp}${result.tip_worldsapp}${colors.RESET}`);
}

async function gameLoop() {
  const game = new GameState();
  await game.initialize();
  
  const rl = createInterface();
  
  const askGuess = async () => {
    if (game.remainingGuesses <= 0) {
      console.log(`\nAnswer:${colors.GREEN}${game.answerPlayer.gameid}${colors.RESET}`);
      outputplayer({
        ...game.answerPlayer,
        col_team: 'GREEN',
        col_nationality: 'GREEN',
        col_worldsapp: 'GREEN',
        agentColors: ['GREEN', 'GREEN', 'GREEN'],
        tip_worldsapp: ''
      });
      return handleGameEnd(rl);
    }

    rl.question(`Chances left: ${game.remainingGuesses}\n Please input a gameid: `, async (input) => {
      const result = await game.compareGuess(input);

      if (!result) {
        console.log(`\n${colors.YELLOW}Player not found.${colors.RESET}`);
        askGuess();
        return;
      }
      
      outputplayer(result);

      if (input.toLowerCase() === game.answerPlayer.gameid.toLowerCase()) {
        console.log(`${colors.GREEN}You guess it!${colors.RESET}`);
        return handleGameEnd(rl);
      }

      game.remainingGuesses--;
      game.guessHistory.push(input);
      askGuess();
    });
  };

  askGuess();
}

function handleGameEnd(rl) {
  rl.question('input \'r\' to restart, otherwise quit...', (answer) => {
    if (answer.toLowerCase() === 'r') {
      rl.close();
      gameLoop().catch(console.error);
    } else {
      process.exit();
    }
  });
}

// 启动游戏
console.log('Welcome to the VLRGG Guessing Game!');
gameLoop().catch(console.error);

module.exports = {
  GameState,
  createInterface
};