import readline from 'readline';
import GameState from './utils/GameState.js';

const colors = {
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  WHITE: '\x1b[37m',
  RESET: '\x1b[0m'
};

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
  let remainingGuesses = 8;
  await game.initialize();
  
  const rl = createInterface();
  
  const askGuess = async () => {
    if (remainingGuesses <= 0) {
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

    rl.question(`Chances left: ${remainingGuesses}\n Please input a gameid: `, async (input) => {
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

      remainingGuesses--;
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
console.log('Welcome to the Valorant Player Guessing Game!');
gameLoop().catch(console.error);