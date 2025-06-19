// database/sqldatabase.js
const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = 'db.sqlite';

const db = new sqlite3.Database(DBSOURCE, err => {
  if (err) throw err;
  console.log('Connected to SQLite');

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
                                       id INTEGER PRIMARY KEY AUTOINCREMENT,
                                       username TEXT UNIQUE,
                                       password TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS children (
                                          id INTEGER PRIMARY KEY AUTOINCREMENT,
                                          parent_user_id INTEGER,
                                          name TEXT,
                                          date_of_birth TEXT,
                                          photo_path TEXT,
                                          FOREIGN KEY(parent_user_id) REFERENCES users(id)
      )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER,
      date TEXT,
      time TEXT,
      type TEXT,
      notes TEXT,
      FOREIGN KEY(child_id) REFERENCES children(id)
    )
  `);

  // NOU: Tabelă pentru imagini galerie - stochează CALEA către fișier, nu BLOB-ul
  db.run(`
    CREATE TABLE IF NOT EXISTS gallery_images (
                                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                parent_user_id INTEGER,
                                                child_id INTEGER, -- Poate fi NULL pentru poze de familie
                                                file_path TEXT UNIQUE, -- Calea relativă către fișierul imagine pe disc
                                                category TEXT,    -- 'child' sau 'family'
                                                upload_date TEXT, -- Data încărcării
                                                FOREIGN KEY(parent_user_id) REFERENCES users(id),
      FOREIGN KEY(child_id) REFERENCES children(id)
      )
  `);
});

module.exports = db;