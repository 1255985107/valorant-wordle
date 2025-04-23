const express = require('express');
const cors = require('cors');
const gameRoutes = require('./gameRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', gameRoutes);

const PORT = process.env.PORT || 5101;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});