const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = 'db.sqlite';

// creeaza sau deschide baza de date => conexiunea este stabilita asincron
const db = new sqlite3.Database(DBSOURCE, err => {
  if (err) throw err;

  // defineste si creeaza tabelul 'users' daca nu exista deja
  db.run(`
     CREATE TABLE IF NOT EXISTS users (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     username TEXT UNIQUE,
     password TEXT
    )
  `);
  // defineste si creeaza tabelul 'children' daca nu exista deja
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
  // defineste si creeaza tabelul 'timeline_events' daca nu exista deja
    db.run(`
        CREATE TABLE IF NOT EXISTS timeline_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        child_id INTEGER,
        date TEXT,
        name TEXT,
        notes TEXT,
        FOREIGN KEY(child_id) REFERENCES children(id)
)
`);
  // defineste si creeaza tabelul 'events' (pt calendar) daca nu exista deja
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
  // defineste si creeaza tabelul 'gallery_images' daca nu exista deja
  // stochează calea catre fisier
  db.run(`
    CREATE TABLE IF NOT EXISTS gallery_images (
     id INTEGER PRIMARY KEY AUTOINCREMENT,
     parent_user_id INTEGER,
     child_id INTEGER,
     file_path TEXT UNIQUE,
     category TEXT,
     upload_date TEXT,
     FOREIGN KEY(parent_user_id) REFERENCES users(id),
     FOREIGN KEY(child_id) REFERENCES children(id)
     )
  `);

});

module.exports = db;