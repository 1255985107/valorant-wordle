const mysql = require('mysql2/promise');
const path = require('path');
const config = require('../config/sqlconfig.json');

const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  waitForConnections: config.waitForConnections,
  connectionLimit: config.connectionLimit,
  queueLimit: config.queueLimit
});

// 国家到大洲的映射字典（包含常见名称变体）
const continentMapping = {
  // 亚洲
  'saudi arabia': 'AS', 'iran': 'AS', 'iraq': 'AS', 'syria': 'AS', 'kuwait': 'AS',
  'india': 'AS', 'pakistan': 'AS', 'bangladesh': 'AS', 'afghanistan': 'AS',
  'myanmar': 'AS', 'bangladesh': 'AS', 'nepal': 'AS', 'kazakhstan': 'AS', 'turkey': 'AS',
  'thailand': 'AS', 'vietnam': 'AS', 'cambodia': 'AS', 
  'china': 'AS', 'hong kong': 'AS', 'taiwan': 'AS', 
  'south korea': 'AS',  'japan': 'AS',
  'philippines': 'AS', 'indonesia': 'AS', 'malaysia': 'AS', 'singapore': 'AS', 
  // 非洲
  'south africa': 'AF', 'egypt': 'AF', 'nigeria': 'AF', 'kenya': 'AF', 'morocco': 'AF',
  // 欧洲
  'england': 'EU', 'scotland': 'EU', 'uk': 'EU', 'united kingdom': 'EU',
  'spain': 'EU', 'portugal': 'EU', 'france': 'EU', 'belgium': 'EU', 'netherlands': 'EU',
  'germany': 'EU', 'switzerland': 'EU',  'italy': 'EU', 
  'poland': 'EU', 'lithuania': 'EU', 'latvia': 'EU', 'estonia': 'EU',
  'czech republic': 'EU', 'ukraine': 'EU', 'russia': 'EU',
  'denmark': 'EU', 'norway': 'EU', 'finland': 'EU', 'sweden': 'EU',
  'bulgaria': 'EU', 'croatia': 'EU', 'macedonia': 'EU',
  // 北美
  'usa': 'NA', 'united states': 'NA', 'canada': 'NA', 'mexico': 'NA',
  // 南美
  'brazil': 'SA', 'argentina': 'SA', 'chile': 'SA', 'colombia': 'SA',
  'peru': 'SA', 'venezuela': 'SA', 'ecuador': 'SA', 'bolivia': 'SA',
  // 大洋洲
  'australia': 'OA', 'new zealand': 'OA',
  // 无代表国籍
  'international': 'UN'
};

async function updateContinents() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 获取所有国家记录
    const [countries] = await connection.query(
      'SELECT nationality FROM nationalities WHERE continent IS NULL'
    );

    // 构建批量更新参数
    const updates = countries.map(country => {
      const continent = determineContinent(country.nationality);
      return [continent, country.nationality];
    });

    for (const [continent, nationality] of updates) {
      console.log(`国家: ${nationality}, 对应的大洲: ${continent}`);
    }

    // 执行批量更新
    await connection.query(
      'UPDATE nationalities SET continent = CASE nationality ' +
      updates.map(() => 'WHEN ? THEN ?').join(' ') +
      ' ELSE continent END',
      [].concat(...updates.map(row => [row[1], row[0]]))
    );

    await connection.commit();
    console.log(`成功更新 ${updates.length} 条记录`);
  } catch (error) {
    await connection.rollback();
    console.error('更新失败:', error);
    throw error;
  } finally {
    connection.release();
  }
}

function determineContinent(country) {
  // 特殊处理地区名称
  const normalized = country
    .replace(/\s*\(.*?\)\s*/g, '') // 移除括号内容
    .trim();

  return continentMapping[normalized] || 'UNKNOWN';
}

// 带重试的执行函数
async function runWithRetries(maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      console.log(`执行第 ${attempt} 次尝试...`);
      await updateContinents();
      return;
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// 执行脚本
runWithRetries()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('最终执行失败:', err);
    process.exit(1);
  });