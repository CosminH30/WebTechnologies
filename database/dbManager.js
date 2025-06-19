// database/dbManager.js
const db = require('./sqldatabase');
const fs = require('fs');
const path = require('path');

// Directorul de upload, trebuie să fie consistent cu app.js și galleryAPI.js
const UPLOAD_DIR = path.join(__dirname, '../uploads');


// wrapper manual pentru run (INSERT/UPDATE/DELETE)
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// wrapper manual pentru get (SELECT singular)
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// wrapper manual pentru all (SELECT multiple)
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  run,
  get,
  all,

  createChild(parentUserId, name, dateOfBirth, photoPath = '') {
    return run(
        'INSERT INTO children(parent_user_id, name, date_of_birth, photo_path) VALUES (?, ?, ?, ?)',
        [parentUserId, name, dateOfBirth, photoPath]
    );
  },

  deleteChild(childId) {
    return run('DELETE FROM children WHERE id = ?', [childId]);
  },

  getChildrenByParent(parentUserId) {
    return all(
        'SELECT id, name, date_of_birth, photo_path FROM children WHERE parent_user_id = ?',
        [parentUserId]
    );
  },

  createEvent(childId, date, time, type, notes = '') {
    return run(
        'INSERT INTO events(child_id, date, time, type, notes) VALUES (?, ?, ?, ?, ?)',
        [childId, date, time, type, notes]
    );
  },

  deleteEvent(eventId) {
    return run('DELETE FROM events WHERE id = ?', [eventId]);
  },

  getEventsByChildAndType(childId, type) {
    return all(
        'SELECT id, date, time, type, notes FROM events WHERE child_id = ? AND type = ? ORDER BY date, time',
        [childId, type]
    );
  },

  // NOU: Metode pentru galerie imagini (cai către fișiere, nu BLOB-uri)
  createGalleryImage(parentUserId, childId, filePath, category) {
    const uploadDate = new Date().toISOString();
    return run(
        'INSERT INTO gallery_images(parent_user_id, child_id, file_path, category, upload_date) VALUES (?, ?, ?, ?, ?)',
        [parentUserId, childId, filePath, category, uploadDate]
    );
  },

  getGalleryImagesByParent(parentUserId) {
    return all(
        'SELECT id, child_id, file_path, category, upload_date FROM gallery_images WHERE parent_user_id = ? ORDER BY upload_date DESC',
        [parentUserId]
    );
  },

  async deleteGalleryImage(imageId, parentUserId) {
    try {
      // 1. Găsește calea fișierului înainte de a șterge înregistrarea din DB
      const imageRecord = await get('SELECT file_path FROM gallery_images WHERE id = ? AND parent_user_id = ?', [imageId, parentUserId]);

      if (!imageRecord) {
        return { changes: 0 }; // Imaginea nu a fost găsită sau nu aparține utilizatorului
      }

      // 2. Șterge înregistrarea din baza de date
      const result = await run('DELETE FROM gallery_images WHERE id = ? AND parent_user_id = ?', [imageId, parentUserId]);

      if (result.changes > 0) {
        // 3. Dacă înregistrarea a fost ștearsă cu succes, șterge și fișierul fizic
        const fileName = path.basename(imageRecord.file_path);
        const absoluteFilePath = path.join(UPLOAD_DIR, fileName);

        fs.unlink(absoluteFilePath, (unlinkErr) => {
          if (unlinkErr) {
            console.error(`Error deleting physical file ${absoluteFilePath}:`, unlinkErr);
            // Poți alege să loghezi eroarea sau să o tratezi diferit,
            // dar, pentru simplitate, nu blocăm răspunsul HTTP aici.
          }
        });
        return { changes: result.changes };
      } else {
        return { changes: 0 };
      }
    } catch (err) {
      console.error("Error in deleteGalleryImage DB operation:", err);
      throw err; // Propagate the error
    }
  }
};