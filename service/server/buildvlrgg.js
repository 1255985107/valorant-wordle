const mysql = require('mysql2/promise');
const axios = require('axios');
const fs = require('fs/promises');
const path = require('path');
const { updateFromAPI } = require('./dbupdate');
const { connect } = require('http2');

// 创建数据库连接池
const pool = mysql.createPool(require('../config/sqlconfig.json'));

async function insertVlrgg(connection, vlrid, gameid){
    connection.query('INSERT IGNORE INTO vlrgg (vlrid, gameid) VALUES (?, ?)', [vlrid, gameid]);
}

async function insertpart(connection, vlrid, eventid){
    connection.query('INSERT IGNORE INTO participate (vlrid, eventid) VALUES (?,?)', [vlrid, eventid]);
}

async function buildvlrgg(connection, file) {
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
                await insertpart(connection, player.id, event.event_id);
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

async function updateallplayers(connection, file) {
    players_upd = [];
    await connection.beginTransaction();
    const rawData = await fs.readFile(path.resolve(__dirname, file));
    const events = JSON.parse(rawData);
    for (const event of events) {
       players_upd.push(event.player_ids);
    }
    for (const player of players_upd) {
        for (const playerid of player) {
            await updateFromAPI(connection, playerid.id);
        }
    }
}
// 主执行函数
async function main() {
    const connection = await pool.getConnection();
    try {
        await buildvlrgg(connection, '../champions_part.txt.json');
    } finally {
        connection.release();
        await pool.end();
    }
}

// 执行主函数
main().catch(console.error);