import React from 'react';
import { Table } from 'react-bootstrap';

const COLORS = {
  GREEN: '#6aaa64',
  YELLOW: '#c9b458',
  WHITE: '#ffffff'
};

export default function GameTable({ guesses }) {
  return (
    <Table striped bordered hover className="mt-4">
      <thead>
        <tr>
          <th>选手ID</th>
          <th>战队</th>
          <th>国家/地区</th>
          <th>常用特工</th>
          <th>世界赛出场</th>
        </tr>
      </thead>
      <tbody>
        {guesses.map((guess, index) => (
          <tr key={index}>
            <td style={{ backgroundColor: COLORS.WHITE }}>{guess.gameid}</td>
            <td style={{ backgroundColor: COLORS[guess.col_team] }}>{guess.teamname}</td>
            <td style={{ backgroundColor: COLORS[guess.col_nationality] }}>{guess.nationalitylogo}</td>
            <td>
              {guess.agents.map((agent, i) => (
                <span 
                  key={i}
                  style={{ 
                    backgroundColor: COLORS[guess.agentColors[i]],
                    marginRight: '5px',
                    padding: '2px 5px',
                    borderRadius: '3px'
                  }}
                >
                  {agent.agent}
                </span>
              ))}
            </td>
            <td style={{ backgroundColor: COLORS[guess.col_worldsapp] }}>{guess.worldsapp}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}