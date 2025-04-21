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
        [[...this.previousAnswers]]
      );
      return rows[0];
    } finally {
      connection.release();
    }
  }

  async compareGuess(guessGameId) {
    const answerPlayer = await getPlayerByGameId(this.currentAnswer.gameid);
    const guessPlayer = await getPlayerByGameId(guessGameId);

    return {
      team: this.getColorCode(answerPlayer.teamid === guessPlayer.teamid, answerPlayer.teamname === guessPlayer.teamname),
      nationality: this.getColorCode(answerPlayer.nationality === guessPlayer.nationality),
      agents: this.getColorCode(
        this.hasCommonAgent(answerPlayer.agents, guessPlayer.agents),
        this.similarAgentCount(answerPlayer.agents, guessPlayer.agents)
      )
    };
  }

  getColorCode(exactMatch, partialMatch) {
    return exactMatch ? 'GREEN' : partialMatch ? 'YELLOW' : 'WHITE';
  }

  hasCommonAgent(answerAgents, guessAgents) {
    return answerAgents.some(a => guessAgents.some(g => g.agent === a.agent));
  }

  similarAgentCount(answerAgents, guessAgents) {
    return answerAgents.filter(a => 
      guessAgents.some(g => g.agent === a.agent && Math.abs(g.roundsPlayed - a.roundsPlayed) <= 5)
    ).length;
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
      console.log(`\n正确答案是：${colors.YELLOW}${game.currentAnswer.gameid}${colors.RESET}`);
      return handleGameEnd(rl);
    }

    rl.question(`剩余次数 ${game.remainingGuesses} 请输入选手gameid：`, async (input) => {
      const result = await game.compareGuess(input);
      
      console.log(`\n队伍：${colors[result.team]}${result.team}${colors.RESET}`);
      console.log(`国籍：${colors[result.nationality]}${result.nationality}${colors.RESET}`);
      console.log(`特工：${colors[result.agents]}${result.agents}${colors.RESET}\n`);

      if (input === game.currentAnswer.gameid) {
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
  rl.question('输入 r 重新开始，其他键退出：', (answer) => {
    if (answer.toLowerCase() === 'r') {
      rl.close();
      gameLoop().catch(console.error);
    } else {
      process.exit();
    }
  });
}

// 启动游戏
gameLoop().catch(console.error);