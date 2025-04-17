const axios = require('axios');
const cheerio = require('cheerio');
const moment = require('moment');

const LIQUIPEDIA_API = 'https://liquipedia.net/valorant/api.php';

async function fetchPlayerData(playerId) {
  try {
    const response = await axios.get(LIQUIPEDIA_API, {
      params: {
        action: 'query',
        format: 'json',
        prop: 'revisions|cirrusbuilddoc',
        rvprop: 'content',
        titles: playerId,
        cbdt: 'current'
      },
      headers: {
        'User-Agent': 'ValorantPlayerLookup/1.0',
        'Accept-Encoding': 'gzip'
      }
    });

    const pages = response.data.query.pages;
    const pageId = Object.keys(pages)[0];
    
    if (pageId === '-1') throw new Error('Player not found');
    
    const htmlContent = pages[pageId].revisions[0]['*'];
    return parseInfobox(htmlContent);
  } catch (error) {
    console.error('API Error:', error.message);
    return null;
  }
}

function parseInfobox(html) {
  const $ = cheerio.load(html);
  const infobox = $('.infobox');

  const data = {
    realName: infobox.find('[data-source="name"]').text().trim(),
    birthDate: parseBirthDate(infobox.find('[data-source="birth_date"]').text()),
    nationality: infobox.find('.infobox-country img').attr('alt'),
    currentTeam: infobox.find('[data-source="team"] a').text().trim(),
    sTierCount: countSTierParticipation(html)
  };

  data.age = calculateAge(data.birthDate);
  return data;
}

function parseBirthDate(text) {
  const match = text.match(/\d{4}-\d{2}-\d{2}/);
  return match ? moment(match[0]) : null;
}

function calculateAge(birthDate) {
  return birthDate ? moment().diff(birthDate, 'years') : null;
}

function countSTierParticipation(html) {
  const sTierMatches = html.match(/TournamentLevel\|S-Tier/g);
  return sTierMatches ? sTierMatches.length : 0;
}

// 命令行接口
if (require.main === module) {
  const playerId = process.argv[2];
  if (!playerId) {
    console.log('请输入选手ID');
    process.exit(1);
  }

  fetchPlayerData(playerId)
    .then(data => console.log(JSON.stringify(data, null, 2)))
    .catch(err => console.error('Error:', err.message));
}

module.exports = { fetchPlayerData };