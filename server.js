// server.js
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = 'mongodb+srv://Aluminium:13%40Aluminium@divyagranth.mvnhl.mongodb.net/';
const DB_NAME = 'DivyaGranth'; // Change if needed

let db;

// Connect to MongoDB
MongoClient.connect(MONGO_URL, { useUnifiedTopology: true })
  .then(client => {
    db = client.db(DB_NAME);
    console.log('Connected to MongoDB');
  })
  .catch(err => console.error('MongoDB connection error:', err));

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// 1) This route serves 'shlok.html' whenever someone visits /shlok/<number>
app.get('/shlok/:index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shlok.html'));
});

// 2) API route to fetch the shlok data by numeric index
// Example: GET /api/shlok?index=6
app.get('/api/shlok', async (req, res) => {
  const index = parseInt(req.query.index, 10);
  if (isNaN(index)) {
    return res.status(400).json({ error: 'Missing or invalid index' });
  }

  try {
    const shlok = await db.collection('Bhagavad_gita').findOne({ index });
    if (!shlok) {
      return res.status(404).json({ error: 'Shlok not found' });
    }
    res.json(shlok);
  } catch (error) {
    console.error('Error fetching shlok:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
