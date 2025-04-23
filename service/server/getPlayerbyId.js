const mysql = require('mysql2/promise');
const {isDataExpired, updateFromAPI} = require('./dbupdate');

const pool = mysql.createPool(require('../config/sqlconfig.json'));


async function searchPlayers(prefix) {
    let connection;
    try {
        connection = await pool.getConnection();

        const [players] = await connection.execute(
            `SELECT gameid, realname FROM players WHERE gameid LIKE ?`,
            [`${prefix}%`]
        )
        return players;
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
            updateFromAPI(connection, vlrid);
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

async function getRandomPlayer() {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(
            'SELECT vlrid, gameid FROM vlrgg WHERE gameid NOT IN (?) ORDER BY RAND() LIMIT 1',
            1
        );
        return getPlayerByGameId(rows[0].gameid);
    } catch (error) {
        console.error('Database error:', error);
        throw error;
    } finally {
        if (connection && connection._socket) {
            connection.release();
        }
    }
}

module.exports = {
    getPlayerByGameId,
    searchPlayers,
    getRandomPlayer
};