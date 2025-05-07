const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const { updateFromAPI, updatebirthFromAPI } = require('./dbupdate');
const { connect } = require('http2');

// 创建数据库连接池
const pool = mysql.createPool(require('../config/sqlconfig.json'));

async function insertVlrgg(connection, vlrid, gameid){
    connection.query('INSERT IGNORE INTO vlrgg (vlrid, gameid) VALUES (?, ?)', [vlrid, gameid]);
}

async function insertPart(connection, vlrid, eventid){
    connection.query('INSERT IGNORE INTO participate (vlrid, eventid) VALUES (?,?)', [vlrid, eventid]);
}

async function buildVlrgg(connection, file) {
    try {
        players_upd = [];
        await connection.beginTransaction();
        const rawData = await fs.readFile(path.resolve(__dirname, file));
        const events = JSON.parse(rawData);

        for (const event of events) {
            const vlrq = connection.query('SELECT count(*) FROM vlrgg WHERE eventid =?', [event.event_id]);
            if (vlrq.length === event.player_ids.length) {
                continue;
            }
            for (const player of event.player_ids) {
                if (!players_upd.includes(player.id)) {
                    await insertVlrgg(connection, player.id, player.name);
                    players_upd.push(player.id);
                }
                // await insertPart(connection, player.id, event.event_id);
            }
            await connection.commit();
            console.log(`Event ${event.event_id} loaded`);
        }
        console.log('Data load complete');
    } catch (err) {
        await connection.rollback();
        console.error('Data load error:', err);
        throw err;
    }
}

async function updateAllPlayers(connection, file) {
    const progressFile = path.resolve(__dirname, '../temp/.progress.txt');
    let players_upd = new Set();
    
    try {
        // 加载已有进度
        if (await fs.access(progressFile).then(() => true).catch(() => false)) {
            const progressData = await fs.readFile(progressFile, 'utf8');
            const lines = progressData.split('\n').filter(line => line.trim());
            players_upd = new Set(lines);
        }

        await connection.beginTransaction();
        const rawData = await fs.readFile(path.resolve(__dirname, file));
        const events = JSON.parse(rawData);

        for (const event of events) {
            for (const player of event.player_ids) {
                const record = `${player.name}:${player.id}`;
                if (!players_upd.has(record)) {
                    const result = await updatebirthFromAPI(connection, player.name);
                    players_upd.add(record);
                    if(result)
						await fs.appendFile(progressFile, `${record}\n`);
                }
            }
        }
        await connection.commit();
        // await fs.unlink(progressFile);
    } catch (err) {
        await connection.rollback();
        throw err;
    }
}
// 主执行函数
async function main() {
    const connection = await pool.getConnection();
    try {
        await buildVlrgg(connection, '../config/champions_part.txt.json');
        // await updateAllPlayers(connection, '../config/champions_part.txt.json');
        console.log('players update complete');
    } finally {
        connection.release();
        await pool.end();
    }
}

// 执行主函数
main().catch(console.error);