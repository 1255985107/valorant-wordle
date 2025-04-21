const readline = require('readline');
const mysql = require('mysql2/promise');
const { getPlayerByGameId } = require('../server/playerService');
const pool = mysql.createPool(require('../config/sqlconfig.json'));

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
    this.currentAnswer = null;
  }

  async initialize() {
    this.currentAnswer = await this.getRandomAnswer();
    this.previousAnswers.add(this.currentAnswer.gameid);
  }

  async getRandomAnswer() {
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.query(
        'SELECT vlrid, gameid FROM vlrgg WHERE gameid NOT IN (?) ORDER BY RAND() LIMIT 1',
        1
      );
      console.log(rows[0]);
      return rows[0];
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    } finally {
      if (connection && connection._socket) {
        connection.release();
      }
    }
  }

  async compareGuess(guessGameId) {
    const answerPlayer = await getPlayerByGameId(this.currentAnswer.gameid);
    const guessPlayer = await getPlayerByGameId(guessGameId);

    if (!guessPlayer) {
      return null;
    }

    this.agentColors = guessPlayer.agents.map(guessAgent => {
      const hasMatch = answerPlayer.agents.some(answerAgent => answerAgent.agent === guessAgent.agent);
      return hasMatch ? 'GREEN' : 'WHITE';
    });

    return {
      ...guessPlayer,
      col_team: this.getColorCode(answerPlayer.teamid === guessPlayer.teamid, answerPlayer.teamid === guessPlayer.teamid),
      col_nationality: this.getColorCode(answerPlayer.nationalitylogo === guessPlayer.nationalitylogo, answerPlayer.continent === guessPlayer.continent),
      col_worldsapp: this.getColorCode(answerPlayer.worldsapp === guessPlayer.worldsapp, Math.abs(answerPlayer.worldsapp - guessPlayer.worldsapp) < 3),
      agentColors: this.agentColors
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

async function gameLoop() {
  const game = new GameState();
  await game.initialize();
  
  const rl = createInterface();
  
  const askGuess = async () => {
    if (game.remainingGuesses <= 0) {
      console.log(`\nAnswer: ${colors.YELLOW}${game.currentAnswer.gameid}${colors.RESET}`);
      return handleGameEnd(rl);
    }

    rl.question(`Chances left: ${game.remainingGuesses}\n Please input a gameid: `, async (input) => {
      const result = await game.compareGuess(input);

      if (!result) {
        console.log(`\n${colors.YELLOW}Player not found.${colors.RESET}`);
        askGuess();
        return;
      }
      
      console.log(`Team Name: ${colors[result.col_team]}${result.teamname}${colors.RESET}`);
      console.log(`Nation/Region: ${colors[result.col_nationality]}${result.nationalitylogo}${colors.RESET}`);
      console.log(`Signature Agents: ${result.agents.map((agent, index) => `${colors[result.agentColors[index]]}${agent.agent}${colors.RESET}`).join(' ')}`);
      console.log(`Worlds App.: ${colors[result.col_worldsapp]}${result.worldsapp}${colors.RESET}`);

      if (input.toLowerCase() === game.currentAnswer.gameid.toLowerCase()) {
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