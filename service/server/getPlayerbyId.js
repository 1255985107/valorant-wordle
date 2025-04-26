const mysql = require('mysql2/promise');
const {isDataExpired, updateFromAPI} = require('./dbupdate');

const pool = mysql.createPool(require('../config/sqlconfig.json'));


async function searchPlayers(prefix) {
    let connection;
    try {
        connection = await pool.getConnection();

        const [players] = await connection.execute(
            `SELECT gameid, realname FROM vlrgg WHERE gameid LIKE ?`,
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

async function getPlayerByVLRId(connection, vlrid) {
    try {
		if (connection.connection._closing) {
            connection = await pool.getConnection();
        }
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
		if (playerResult[0].nationality === "taiwan" || playerResult[0].nationality === "hong kong"){
			if(playerResult[0].nationality === "taiwan")
                playerResult[0].nationalitylogo = "cn";
            playerResult[0].nationality = "china";
		}
        return {
            ...playerResult[0],
            worldsapp: S_TIER[0].cnt,
            agents: agents
        };
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Database error:', error);
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
        return await getPlayerByVLRId(connection, vlrid);
    } catch (error) {
        throw error;
    }
}

async function getRandomPlayer(minWorldsApp) {
	let connection;
    const mins = minWorldsApp || 1;
    try {
		connection = await pool.getConnection();
        const [players] = await connection.query(
            'SELECT vlrid FROM participate GROUP BY vlrid HAVING COUNT(*) >=? ORDER BY RAND() LIMIT 1',
            [mins]
        );
        console.log(`Getting Random Player with minWorldsApp >= ${mins} : vlrid = ${players[0].vlrid}`);
        return await getPlayerByVLRId(connection, players[0].vlrid);
    } catch (error) {
        throw error;
    }
}

module.exports = {
    getPlayerByGameId,
    searchPlayers,
    getRandomPlayer
};