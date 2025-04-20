const mysql = require('mysql2/promise');

const pool = mysql.createPool(require('../config/sqlconfig.json'));

async function testConnection() {
    let connection;
    
    try {
        connection = await pool.getConnection();
        console.log('成功连接到数据库');
        
        // 执行测试查询
        const [rows] = await connection.query('SHOW TABLES');
        console.log('数据库表列表：', rows);
        
        const [players] = await connection.execute(
            'SELECT *, UNIX_TIMESTAMP(upd_time) as upd_timestamp FROM players WHERE gameid = ?',
            ['CHICHOO']
        );
        console.log('player info:', players);

        return true;
    } catch (err) {
        console.error('Connection error: ', err);
        return false;
    } finally {
        if (connection) connection.release();
        await pool.end();
    }
}

// 执行测试
module.exports = testConnection()
    .then(success => {
        if (success) {
            console.log('Database connection test passed');
            process.exit(0);
        } else {
            console.error('Database connection test failed');
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Test error: ', err);
        process.exit(1);
    });