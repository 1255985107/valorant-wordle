const axios = require('axios');

const PING_INTERVAL = 14.5 * 60 * 1000; // 14 minutes in milliseconds
// const PING_INTERVAL = 1000; // 1 seconds in milliseconds

let room_url = null;

const pingServer = () => {
  axios.get(`${room_url}/ping`)
    .then(response => console.log('Self-ping successful:', response.status))
    .catch(error => console.error('Self-ping failed:', error.message));
};

const startSelfPing = (ROOM_SERVER_URL) => {
  // Start the self-ping interval
  room_url = ROOM_SERVER_URL;
  setInterval(pingServer, PING_INTERVAL);
  console.log('Self-ping mechanism started');
};

module.exports = {
  startSelfPing,
  pingServer
}; 