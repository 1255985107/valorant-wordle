const mysql = require('mysql2/promise');
const axios = require('axios');

// 创建数据库连接池
const pool = mysql.createPool({
    host: 'cengdu1idc.jihujiasuqi.com',
    port: 28734,
    user: 'valorant_server',
    password: 'revres_tnarolav.h',
    database: 'VALORANT_PLAYERS',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 检查数据是否过期（7天）
function isDataExpired(timestamp) {
    if (!timestamp) return true;
    const now = new Date();
    const updTime = new Date(timestamp);
    const diffDays = (now - updTime) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
}

// 从API获取选手信息
async function fetchPlayerFromAPI(gameid) {
    try {
        const response = await axios.get(`http://localhost:5000/api/v1/players/search?gameid=${gameid}`, {
            headers: {
                'User-Agent': 'ValorantPlayerLookup/1.0',
                'Accept': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        throw new Error(`Failed to fetch player data: ${error.message}`);
    }
}

// 更新或插入team信息
async function upsertTeam(connection, teamData) {
    const query = 'INSERT INTO teams (teamid, teamname, teamlogo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teamname = ?, teamlogo = ?';
    await connection.execute(query, [
        teamData.teamid,
        teamData.teamname,
        teamData.teamlogo,
        teamData.teamname,
        teamData.teamlogo
    ]);
}

// 更新或插入nationality信息
async function upsertNationality(connection, nationality, nationalitylogo) {
    const query = 'INSERT INTO nationalities (nationality, nationalitylogo) VALUES (?, ?) ON DUPLICATE KEY UPDATE nationalitylogo = ?';
    await connection.execute(query, [nationality, nationalitylogo, nationalitylogo]);
}

// 更新player信息
async function updatePlayer(connection, playerData) {
    const query = 'INSERT INTO players (vlrid, gameid, realname, nationality, teamid, upd_time) VALUES (?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE gameid = ?, realname = ?, nationality = ?, teamid = ?, upd_time = NOW()';
    await connection.execute(query, [
        playerData.info.vlrid,
        playerData.info.gameid,
        playerData.info.realname,
        playerData.info.nationality,
        playerData.team.teamid,
        playerData.info.gameid,
        playerData.info.realname,
        playerData.info.nationality,
        playerData.team.teamid
    ]);
}

// 更新useagents信息
async function updatePlayerAgents(connection, vlrid, agents) {
    // 删除现有的agent记录
    await connection.execute('DELETE FROM useagents WHERE vlrid = ?', [vlrid]);
    
    // 插入新的agent记录
    const query = 'INSERT INTO useagents (vlrid, agent, roundsPlayed) VALUES (?, ?, ?)';
    for (const agent of agents) {
        await connection.execute(query, [
            vlrid,
            agent.agentName,
            parseInt(agent.roundsPlayed) || 0
        ]);
    }
}

// 主函数：通过gameid查询选手信息
async function getPlayerByGameId(gameid) {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();

        // 查询现有玩家信息
        const [players] = await connection.execute(
            'SELECT *, UNIX_TIMESTAMP(upd_time) as upd_timestamp FROM players WHERE gameid = ?',
            [gameid]
        );

        let playerData;
        if (players.length === 0 || isDataExpired(players[0].upd_time)) {
            // 从API获取新数据
            const apiData = await fetchPlayerFromAPI(gameid);
            playerData = apiData.data;

            // 更新teams表
            await upsertTeam(connection, playerData.team);

            // 更新nationalities表
            await upsertNationality(connection, playerData.info.nationality, playerData.info.flag);

            // 更新players表
            await updatePlayer(connection, playerData);

            // 更新useagents表
            await updatePlayerAgents(connection, playerData.info.vlrid, playerData.agents);

            await connection.commit();
        } else {
            // 使用数据库中的现有数据
            const [playerResult] = await connection.execute(
                `SELECT p.*, t.teamname, t.teamlogo, n.nationalitylogo, 
                        GROUP_CONCAT(u.agent) as agents,
                        GROUP_CONCAT(u.roundsPlayed) as roundsPlayed
                 FROM players p
                 LEFT JOIN teams t ON p.teamid = t.teamid
                 LEFT JOIN nationalities n ON p.nationality = n.nationality
                 LEFT JOIN useagents u ON p.vlrid = u.vlrid
                 WHERE p.gameid = ?
                 GROUP BY p.vlrid`,
                [gameid]
            );
            playerData = playerResult[0];
        }

        return playerData;
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