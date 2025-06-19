const crypto = require('crypto');
const dbManager = require('../database/dbManager');

const sessions = {};

//hash de parola securizat folosind PBKDF2 cu un salt aleatoriu
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

//complexitatea parolei
function isPasswordComplex(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  return password.length >= minLength && hasUpperCase && hasNumber;
}

//validari pentru input, email, parola si unicitate.
async function registerUser({ username, email, password, confirmPassword }) {
  return new Promise(async (resolve, reject) => {

    if (!username || !email || !password || !confirmPassword) {
      return reject(new Error('Toate câmpurile sunt obligatorii!'));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return reject(new Error('Format email invalid!'));
    }
    if (password !== confirmPassword) {
      return reject(new Error('Parolele nu se potrivesc!'));
    }
    if (!isPasswordComplex(password)) {
      return reject(new Error('Parola trebuie să aibă minim 8 caractere, cel puțin o majusculă și o cifră!'));
    }

    try {
      // verifica existenta username-ului sau email-ului in baza de date
      const existingUser = await dbManager.get(
          `SELECT username, email FROM users WHERE username = ? OR email = ?`,
          [username, email]
      );

      if (existingUser) {
        // erori specifice
        if (existingUser.username === username) {
          return reject(new Error('Numele de utilizator este deja înregistrat!'));
        }
        if (existingUser.email === email) {
          return reject(new Error('Adresa de email este deja înregistrată!'));
        }
      }

      const hashedPassword = hashPassword(password);
      await dbManager.run(
          'INSERT INTO users(username, email, password) VALUES(?, ?, ?)',
          [username, email, hashedPassword]
      );

      resolve({ username, email });
    } catch (err) {
      // erori la nivel de baza de date
      console.error("Eroare la crearea contului (exceptie DB):", err.message);
      reject(new Error('A apărut o eroare la baza de date. Vă rugăm să încercați din nou.'));
    }
  });
}

async function authenticate(username, password) {
  try {
    const row = await dbManager.get(
        'SELECT id, password FROM users WHERE username = ?',
        [username]
    );
    if (!row) return null; // utilizator negasit

    const [salt, storedHash] = row.password.split(':');
    const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
    if (hash !== storedHash) return null; // parola incorecta

    // genereaza si stocheaza ID-ul sesiunii in memorie
    const sessionId = crypto.randomBytes(16).toString('hex');
    sessions[sessionId] = row.id;
    return sessionId;
  } catch (err) {
    console.error(err.message);
    throw new Error('Eroare internă la autentificare.');
  }
}

// returneaza ID-ul utilizatorului asociat cu un ID de sesiune
function getUserIdBySession(sessionId) {
  return sessions[sessionId];
}

module.exports = {
  registerUser,
  authenticate,
  getUserIdBySession
};

