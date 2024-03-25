const express = require('express');
const jwt = require('jsonwebtoken');
const jose = require('node-jose');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = 8080;
const db = new sqlite3.Database('totally_not_my_privateKeys.db');

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS keys (
      kid INTEGER PRIMARY KEY AUTOINCREMENT,
      key BLOB NOT NULL,
      exp INTEGER NOT NULL
    )
  `);
});

let keyPair;
let expiredKeyPair;
let token;
let expiredToken;

async function generateKeyPairs() {
  keyPair = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });
  expiredKeyPair = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });

  saveKeyPairToDatabase(keyPair);
  saveKeyPairToDatabase(expiredKeyPair);
}

async function generateToken() {
  if (!keyPair) {
    keyPair = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });
    await saveKeyPairToDatabase(keyPair);
  }

  const payload = {
    user: 'sampleUser',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600
  };
  const options = {
    algorithm: 'RS256',
    header: {
      typ: 'JWT',
      alg: 'RS256',
      kid: keyPair.kid
    }
  };

  token = jwt.sign(payload, keyPair.toPEM(true), options);
}

async function generateExpiredJWT() {
  if (!expiredKeyPair) {
    expiredKeyPair = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });
    await saveKeyPairToDatabase(expiredKeyPair);
  }

  const payload = {
    user: 'sampleUser',
    iat: Math.floor(Date.now() / 1000) - 30000,
    exp: Math.floor(Date.now() / 1000) - 3600
  };
  const options = {
    algorithm: 'RS256',
    header: {
      typ: 'JWT',
      alg: 'RS256',
      kid: expiredKeyPair.kid
    }
  };

  expiredToken = jwt.sign(payload, expiredKeyPair.toPEM(true), options);
}

async function saveKeyPairToDatabase(keyPair) {
  const serializedKey = keyPair.toPEM(true); 
  const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600; 
  const sql = `INSERT INTO keys (key, exp) VALUES (?, ?)`;
  const params = [serializedKey, expirationTimeInSeconds];

  db.run(sql, params);
}

app.all('/auth', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  next();
});

// Middleware to ensure only GET requests are allowed for /jwks
app.all('/.well-known/jwks.json', (req, res, next) => {
  if (req.method !== 'GET') {
    return res.status(405).send('Method Not Allowed');
  }
  next();
});

app.get('/.well-known/jwks.json', (req, res) => {
  const validKeys = [keyPair].filter(key => key.exp > Math.floor(Date.now() / 1000));
  const jsonKeys = validKeys.map(key => key.toJSON());
  
  res.setHeader('Content-Type', 'application/json');
  res.json({ keys: jsonKeys });
});

app.post('/auth', (req, res) => {

  if (req.query.expired === 'true'){
    return res.send(expiredToken);
  }
  res.send(token);
});

generateKeyPairs().then(() => {
  generateToken()
  generateExpiredJWT()
  db.close()
  app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
  });
});

module.exports = app;