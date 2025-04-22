import React, { useState, useEffect } from 'react';
import { Container, Table, Form, Modal, Button } from 'react-bootstrap';
import axios from 'axios';
import { GameState } from './gameClient';
import GameTable from './components/GameTable';
import SearchBar from './components/SearchBar';

function App() {
  let curgame = new GameState();

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    curgame.initialize();
  }, []);

  const handleGuess = async (gameId) => {
    try {
      const response = curgame.compareGuess(gameId);
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

    } catch (error) {
      console.error('Guess action error:', error);
    }
  };

  return (
    <Container className="mt-4">
      <h1 className="text-center mb-4">VALORANT WORDLE</h1>
      <SearchBar onSearch={handleGuess} />
      <GameTable guesses={curgame.guessHistory} />

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Game Over</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Answer: {curgame.currentAnswer?.gameid}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={initializeGame}>
            New Game
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default App;