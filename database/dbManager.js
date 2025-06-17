const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = 'db.sqlite';
const util = require('util');

const db = new sqlite3.Database(DBSOURCE, err => {
  if (err) throw err;
  console.log('Connected to SQLite');
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )
  `);
});

db.run = util.promisify(db.run);
db.get = util.promisify(db.get);
db.all = util.promisify(db.all);

module.exports = db;