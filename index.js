require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');
const client = new MongoClient(process.env.DB_URI)
const db = client.db("URLShortener")
const urls = db.collection("urls")
const dns = require('dns');
const urlparser = require('url')

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

//URL Shortener Microservice endpoint
app.post('/api/shorturl', async (req, res) => {
  const URLToShorten = req.body.url

  const DNSLookup = await dns.lookup(urlparser.parse(URLToShorten).hostname, (err, address) => {
    if (!address){
      res.json({error: "invalid url"})
    } else {
      return true 
    }
  });
  
  const newURLNumber = await urls.countDocuments() + 1

  const insertedDocument = await urls.insertOne({
    original_url: URLToShorten,
    short_url: newURLNumber
  });
  
  res.json({ original_url: URLToShorten, short_url: newURLNumber })
})

//URL redirector from shortened URL
app.get('/api/shorturl/:short_url', async (req, res) => {
  const shortURL = req.params.short_url
  
  const query = { short_url: +shortURL };
  const DocumentOfURLToRedirectTo = await urls.findOne(query);
  // console.log("URLToRedirectTo", DocumentOfURLToRedirectTo)

  if (DocumentOfURLToRedirectTo) {
    res.redirect(DocumentOfURLToRedirectTo.original_url)
  } else {
    res.json({ error: 'no such short url in the database' })
  }
})

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});