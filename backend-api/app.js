// Initialise app.
const express = require('express');
const app = express();

require('dotenv').config();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to CouchDB.
COUCHDB_URL = 'http://admin:admin@172.26.130.183:5984'
const nano = require('nano')(COUCHDB_URL);

// Database(s).
tweets = nano.db.use('tweets');

// TESTING: Get a list of all tweets.
app.get('/tweets', function(req, res) {
    tweets.list(function (err, body) {
      if (err) {
        res.send(err)
      } 
      else {
        res.send(body.rows)
      }
    })
})

// Homepage.
app.get('/', function(req, res) {
    res.send('<h1> Hi :D <h1>');
})

// Start the app.
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, function(req, res) {
    console.log(`API Server running on ${HOST}:${PORT}.`);
    if (COUCHDB_URL) {
        console.log('Database connection established.');
    }
});

