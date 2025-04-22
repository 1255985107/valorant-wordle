const express = require('express');
const router = express.Router();
const { getPlayerByGameId, getRandomPlayer } = require('../playerService');

router.get('/initialize', async (req, res) => {
  try {
    const answerPlayer = await getRandomPlayer();
    res.json(answerPlayer);
  } catch (error) {
    res.status(500).json({ error: '初始化失败' });
  }
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