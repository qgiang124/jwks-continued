const express = require('express');
const jwt = require('jsonwebtoken');
const jose = require('node-jose');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');

const app = express();
app.use(express.json());
const port = 8080;
const db = new sqlite3.Database('totally_not_my_privateKeys.db');

const iv = crypto.randomBytes(16);

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS users(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            email TEXT UNIQUE,
            date_registered TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS keys (
            kid INTEGER PRIMARY KEY AUTOINCREMENT,
            key BLOB NOT NULL,
            exp INTEGER NOT NULL
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS auth_logs(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            request_ip TEXT NOT NULL,
            request_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            user_id INTEGER,  
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);
});

app.post('/auth', async (req, res) => {
  const { username } = req.body;
  const requestIP = req.ip;
  const requestTimestamp = new Date();

  const user = await getUserByUsername(username);
  if (!user) {
      return res.status(404).json({ error: 'User not found' });
  }

  db.run(`
      INSERT INTO auth_logs (request_ip, request_timestamp, user_id) VALUES (?, ?, ?)
  `, [requestIP, requestTimestamp.toISOString(), user.id], function(err) {
      if (err) {
          return res.status(500).json({ error: 'Failed to log authentication request' });
      }

      const token = generateToken();
      res.status(200).json({ token });
  });
});


app.post('/register', async (req, res) => {
    const { username, email } = req.body;

    const securePassword = generateSecurePassword();
    const hashedPassword = await hashPassword(securePassword);

    const sql = `INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)`;
    const params = [username, hashedPassword, email];

    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: 'Failed to register user' });
        }
        res.status(201).json({ password: securePassword });
    });
});

function generateSecurePassword() {
    const uuidv4 = require('uuid').v4;
    return uuidv4();
}

async function hashPassword(password) {
    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(16).toString('hex');
        crypto.scrypt(password, salt, 64, (err, derivedKey) => {
            if (err) reject(err);
            resolve(`${derivedKey.toString('hex')}.${salt}`);
        });
    });
}
app.all('/auth', (req, res, next) => {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }
  next();
});

async function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    const sql = `SELECT id, username, password_hash, email, 
                strftime('%Y-%m-%d %H:%M:%S', request_timestamp) AS request_timestamp 
                FROM auth_logs WHERE username = ?`;
    db.get(sql, [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        if (row && row.request_timestamp) {
          row.request_timestamp = new Date(row.request_timestamp);
        }
        resolve(row);
      }
    });
  });
}




function encrypt(data, key) {
    const keyBuffer = Buffer.from(key, 'hex');
    const cipher = crypto.createCipheriv('aes-256-cbc', keyBuffer, iv);
    let encryptedData = cipher.update(data, 'utf8', 'hex');
    encryptedData += cipher.final('hex');
    return encryptedData;
}

async function saveKeyPairToDatabase(keyPair) {
    const serializedKey = keyPair.toPEM(true);
    const expirationTimeInSeconds = Math.floor(Date.now() / 1000) + 3600;
    const encryptedKey = encrypt(serializedKey, process.env.NOT_MY_KEY);
    const sql = `INSERT INTO keys (key, exp) VALUES (?, ?)`;
    const params = [encryptedKey, expirationTimeInSeconds];

    db.run(sql, params, (err) => {
        if (err) {
            console.error('Error saving key pair ', err);
        }
    });
}

async function generateKeyPairsAndTokens() {
    keyPair = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });
    expiredKeyPair = await jose.JWK.createKey('RSA', 2048, { alg: 'RS256', use: 'sig' });

    saveKeyPairToDatabase(keyPair);
    saveKeyPairToDatabase(expiredKeyPair);

    generateToken();
    generateExpiredJWT();
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

    return new Promise((resolve, reject) => {
        jwt.sign(payload, keyPair.toPEM(true), options, (err, token) => {
            if (err) {
                reject(err);
            } else {
                resolve(token);
            }
        });
    });
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

generateKeyPairsAndTokens().then(() => {
    app.listen(port, () => {
        console.log(`Server started on http://localhost:${port}`);
    });
});
