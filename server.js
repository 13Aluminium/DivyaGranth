// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const { MongoClient } = require('mongodb');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGO_URI;
const DB_NAME = 'DivyaGranth';

// Simple in-memory cache
const shlokCache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// Global database connection
let client;
let db;

// Connect to MongoDB once at startup
async function connectToMongoDB() {
  try {
    if (!client) {
      client = new MongoClient(MONGO_URL, { 
        useUnifiedTopology: true,
        connectTimeoutMS: 5000,    // Connection timeout
        socketTimeoutMS: 45000,    // Socket timeout
        maxPoolSize: 50,           // Connection pool size
        minPoolSize: 5             // Minimum connections maintained
      });
      
      await client.connect();
      db = client.db(DB_NAME);
      console.log('Connected to MongoDB');
      
      // Create indexes for faster queries
      await db.collection('Bhagavad_gita').createIndex({ index: 1 }, { unique: true });
      console.log('MongoDB indexes created successfully');
    }
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

// Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('Closing MongoDB connection...');
  if (client) {
    await client.close();
    console.log('MongoDB connection closed');
  }
  process.exit(0);
});

// Enable compression middleware
app.use(compression());

// Serve static files with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true
}));

// Route to serve shlok.html
app.get('/shlok/:index', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'shlok.html'));
});

// API route to fetch shlok data with caching
app.get('/api/shlok', async (req, res) => {
  const index = parseInt(req.query.index, 10);
  
  if (isNaN(index)) {
    return res.status(400).json({ error: 'Missing or invalid index' });
  }
  
  try {
    // Check cache first
    const cacheKey = `shlok-${index}`;
    if (shlokCache.has(cacheKey)) {
      return res.json(shlokCache.get(cacheKey));
    }
    
    // If not in cache, fetch from database
    const shlok = await db.collection('Bhagavad_gita').findOne({ index });
    
    if (!shlok) {
      return res.status(404).json({ error: 'Shlok not found' });
    }
    
    // Store in cache with expiration
    shlokCache.set(cacheKey, shlok);
    setTimeout(() => shlokCache.delete(cacheKey), CACHE_TTL);
    
    // Set cache control headers
    res.set('Cache-Control', 'public, max-age=3600');
    res.json(shlok);
  } catch (error) {
    console.error('Error fetching shlok:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start the server after connecting to MongoDB
connectToMongoDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to connect to database, server not started:', err);
    process.exit(1);
  });