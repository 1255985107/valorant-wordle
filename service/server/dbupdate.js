const mysql = require('mysql2/promise');
const axios = require('axios');

// 检查数据是否过期（7天）
function isDataExpired(timestamp) {
    if (!timestamp) return true;
    const now = new Date();
    const updTime = new Date(timestamp);
    const diffDays = (now - updTime) / (1000 * 60 * 60 * 24);
    return diffDays > 7;
}

// 更新或插入team信息
async function upsertTeam(connection, teamData) {
    const query = 'INSERT INTO teams (teamid, teamname, teamlogo) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE teamname = ?, teamlogo = ?';
    await connection.execute(query, [
        teamData.id,
        teamData.name,
        teamData.logo,
        teamData.name,
        teamData.logo
    ]);
}

// 更新或插入nationality信息
async function upsertNationality(connection, nationality, nationalitylogo) {
    const query = 'INSERT IGNORE INTO nationalities (nationality, nationalitylogo) VALUES (?, ?)';
    await connection.execute(query, [nationality, nationalitylogo]);
}

// 更新player信息
async function updatePlayer(connection, playerData) {
    const query = 'INSERT INTO players (vlrid, gameid, realname, nationality, teamid, profile_url, upd_time) VALUES (?, ?, ?, ?, ?, ?, NOW()) ON DUPLICATE KEY UPDATE gameid = ?, nationality = ?, teamid = ?, profile_url = ?, upd_time = NOW()';
    await connection.execute(query, [
        playerData.info.id,
        playerData.info.user,
        playerData.info.name,
        playerData.info.country,
        playerData.team.id,
        playerData.info.img,
        playerData.info.user,
        playerData.info.country,
        playerData.team.id,
        playerData.info.img
    ]);
}

// 从API获取选手信息
async function fetchPlayerFromAPI(vlrid) {
    try {
        const response = await axios.get(`http://localhost:5000/api/v1/players/${vlrid}`, {
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

async function fetchBirthFromLiquid(gameid) {
	let retryCount = 3;
	while (retryCount > 0) {
		const response = await axios.get(`https://liquipedia.net/valorant/api.php`, {
			params: {
				action: 'query',
				format: 'json',
				prop: 'extracts',
				titles: gameid,
				exintro: 1,
				explaintext: 1
			},
			headers: {
				'User-Agent': 'ValorantPlayerLookup/1.0',
				'Accept-Encoding': 'gzip'
			}
		});
	
		const pages = response.data.query.pages;
		const pageId = Object.keys(pages)[0];
		
		if (pageId !== '-1') break;
		retryCount--;
	}
	if (pageId === '-1') return null;

    const content = pages[pageId].extract;
    const regex = /born\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/i;
    const dobMatch = content.match(regex);
    const monthMap = {
        'january': '01', 'february': '02', 'march': '03', 'april': '04',
        'may': '05', 'june': '06', 'july': '07', 'august': '08',
        'september': '09', 'october': '10', 'november': '11', 'december': '12'
    };
    const birthdate = dobMatch 
        ? `${dobMatch[3]}-${monthMap[dobMatch[1].toLowerCase()]}-${dobMatch[2].padStart(2, '0')}`
        : null;
    console.log(`Fetched birth from liquipedia ${gameid}: ${birthdate}`);
    return birthdate;
}

// 更新useagents信息
async function updatePlayerAgents(connection, vlrid, agents) {
    // 删除现有的agent记录
    await connection.execute('DELETE FROM useagents WHERE vlrid = ?', [vlrid]);
    
    // 插入新的agent记录
    const query = 'INSERT INTO useagents (vlrid, agent, roundsPlayed) VALUES (?, ?, ?)';
    for (const agent of agents.slice(0, 3)) {
        await connection.execute(query, [
            vlrid,
            agent.agentName,
            parseInt(agent.roundsPlayed) || 0
        ]);
    }
}

async function updateFromAPI(connection, vlrid, gameid) {
    const MAX_RETRIES = 3;
    let retryCount = 0;
    
    while (retryCount <= MAX_RETRIES) { try {
        if (connection.connection._closing) {
            connection = await pool.getConnection();
        }
        
        console.log(`Fetching data from API ${vlrid}...`);
        const playerData = await fetchPlayerFromAPI(vlrid);

        await connection.beginTransaction();
        await upsertTeam(connection, playerData.team);
        await upsertNationality(connection, playerData.info.country, playerData.info.flag);
        await updatePlayer(connection, playerData);
		await updatebirthFromAPI(connection, gameid);
        await updatePlayerAgents(connection, playerData.info.id, playerData.agents);
        await connection.commit();

        // return {
        //     "vlrid": playerData.info.id,
        //     "gameid": playerData.info.user,
        //     "realname": playerData.info.name,
        //     "nationality": playerData.info.country,
        //     "teamname": playerData.team.name,
        //     "teamlogo": playerData.team.logo,
        //     "agents": playerData.agents.slice(0, 3).map(agent => ({
        //         "agent": agent.agentName,
        //         "roundsPlayed": agent.roundsPlayed
        //     }))
        // };
    } catch (error) {retryCount++;}}
}

async function updatebirthFromAPI(connection, gameid) {
    const birthdate = await fetchBirthFromLiquid(gameid);
	if (birthdate)
		return false;
    const query = `UPDATE players SET birthdate =${birthdate? ('\'' + birthdate + '\''):  null} WHERE gameid ='${gameid}'`;
    await connection.execute(query);
	return true;
}

module.exports = {
   isDataExpired,
   updateFromAPI,
   updatebirthFromAPI
}