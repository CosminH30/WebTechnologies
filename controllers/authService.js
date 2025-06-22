const crypto = require('crypto');
const dbManager = require('../database/dbManager');

const sessions = {}; // stocheaza sesiunile active (sessionId: userId)

function hashPassword(password) {
  // genereaza un hash securizat pentru parola, incluzând un "salt"
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
  return `${salt}:${hash}`;
}

function isPasswordComplex(password) {
  // verifica daca parola indeplinește cerintele de complexitate
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length >= minLength && hasUpperCase && hasNumber;
}

async function registerUser({username, password, confirmPassword}) {
  // valideaza datele de inregistrare si creeaza un nou utilizator
  if (!username || !password || !confirmPassword) {
    throw new Error('Toate campurile sunt obligatorii!');
  }
  if (password !== confirmPassword) {
    throw new Error('Parolele nu se potrivesc!');
  }
  if (!isPasswordComplex(password)) {
    throw new Error('Parola trebuie sa aiba minim 8 caractere, cel putin o majuscula si o cifra!');
  }

  const existing = await dbManager.get(
      'SELECT username FROM users WHERE username = ?',
      [username]
  );
  if (existing) {
    throw new Error('Numele de utilizator este deja inregistrat!');
  }

  const stored = hashPassword(password);
  await dbManager.run(
      'INSERT INTO users(username, password) VALUES(?, ?)',
      [username, stored]
  );
}

async function authenticate(username, password) {
  const row = await dbManager.get(
      'SELECT id, password FROM users WHERE username = ?',
      [username]
  );
  if (!row) return null; // utilizatorul nu exista

  // verifica parola trimisa cu hash-ul stocat
  const [salt, storedHash] = row.password.split(':');
  const hash = crypto
      .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
      .toString('hex');
  if (hash !== storedHash) return null; // parola incorecta

  // genereaza si stocheaza o noua sesiune pentru utilizator
  const sessionId = crypto.randomBytes(16).toString('hex');
  sessions[sessionId] = row.id;
  return sessionId;
}

function getUserIdBySession(sessionId) {
  // returneaza ID-ul utilizatorului pe baza ID-ului de sesiune
  return sessions[sessionId] || null;
}

module.exports = {registerUser, authenticate, getUserIdBySession};
