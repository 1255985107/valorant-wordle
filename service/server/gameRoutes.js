const express = require('express');
const router = express.Router();
const { getRandomPlayer, searchPlayers, getPlayerByGameId } = require('./getPlayerbyId');

router.get('/initialize', async (req, res) => {
  console.log(`GET /api/initialize`);
  let retrytime = 3;
  while (retrytime > 0) {
    try {
      const answerPlayer = await getRandomPlayer(req.query.minWorldsApp);
      if (answerPlayer) {
        res.json(answerPlayer);
        return;
      }
    } catch(e) {
      retrytime--;
    }
  }
  res.status(500).json({ error: 'Initialization Error' });
});

router.get('/search', async (req, res) => {
  console.log(`GET /api/search on ${req.query.prefix}`);
  let retrytime = 3;
  while (retrytime > 0) {
    try {
      const players = await searchPlayers(req.query.prefix);
      if (players) {
        res.json(players);
        return;
      }
    } catch(e) {
      retrytime--;
    }
  }
});

router.get('/player', async (req, res) => {
  console.log(`GET /api/player on ${req.query.gameid}`);
  let retrytime = 3;
  while (retrytime > 0) {
    try {
      const player = await getPlayerByGameId(req.query.gameid);
      if (player) {
        res.json(player);
        return;
      }
    } catch(e) {
      retrytime--;
    }
  }
  res.json(null);
});

router.post('/compare', async (req, res) => {
  try {
    const answerPlayer = await getPlayerByGameId(req.body.answerGameId);
    const guessPlayer = await getPlayerByGameId(req.body.guessGameId);

    if (!guessPlayer) {
      return res.status(404).json({ error: '选手不存在' });
    }

    const agentColors = guessPlayer.agents.map(guessAgent => 
      answerPlayer.agents.some(a => a.agent === guessAgent.agent) ? 'GREEN' : 'WHITE'
    );

    res.json({
      ...guessPlayer,
      col_team: getColorCode(answerPlayer.teamid === guessPlayer.teamid, answerPlayer.teamid === guessPlayer.teamid),
      col_nationality: getColorCode(answerPlayer.nationalitylogo === guessPlayer.nationalitylogo, answerPlayer.continent === guessPlayer.continent),
      col_worldsapp: getColorCode(answerPlayer.worldsapp === guessPlayer.worldsapp, Math.abs(answerPlayer.worldsapp - guessPlayer.worldsapp) < 3),
      agentColors,
      correct: req.body.guessGameId.toLowerCase() === req.body.answerGameId.toLowerCase()
    });

  } catch (error) {
    res.status(500).json({ error: '比较失败' });
  }
});

function getColorCode(exact, partial) {
  return exact ? 'GREEN' : partial ? 'YELLOW' : 'WHITE';
}

module.exports = router;