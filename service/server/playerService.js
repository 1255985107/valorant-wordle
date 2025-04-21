const mysql = require('mysql2/promise');
const axios = require('axios');
const { isDataExpired, updateFromAPI} = require('./dbupdate');

const pool = mysql.createPool(require('../config/sqlconfig.json'));

async function getPlayerByGameId(gameid) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        const [existingPlayers] = await connection.execute(
            'SELECT vlrid FROM vlrgg WHERE gameid =?',
            [gameid]
        );

        if (existingPlayers.length === 0) {
            return null;
        }

        const vlrid = existingPlayers[0].vlrid;
        const [players] = await connection.execute(
            'SELECT *, UNIX_TIMESTAMP(upd_time) as upd_timestamp FROM players WHERE vlrid = ?',
            [vlrid]
        );

        if (players.length === 0 || isDataExpired(players[0].upd_time)) 
            return updateFromAPI(connection, vlrid);
        // 使用数据库中的现有数据
        const [playerResult] = await connection.execute(
            `SELECT p.*, t.teamname, t.teamlogo, n.nationalitylogo, n.continent
                FROM players p
                LEFT JOIN teams t ON p.teamid = t.teamid
                LEFT JOIN nationalities n ON p.nationality = n.nationality
                WHERE p.vlrid = ?`,
            [vlrid]
        );
        const [agents] = await connection.execute(
            'SELECT agent, roundsPlayed FROM useagents WHERE vlrid =?',
            [vlrid]
        );
        const [S_TIER] = await connection.execute(
            'SELECT count(*) as cnt FROM participate WHERE vlrid =?',
            [vlrid]
        );
        await connection.commit();
        return {
            ...playerResult[0],
            worldsapp: S_TIER[0].cnt,
            agents: agents
        };
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        throw error;
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

module.exports = {
    getPlayerByGameId
};