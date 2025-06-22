const db = require('./sqldatabase');
const fs = require('fs');           // modul pentru operatii cu fisiere
const path = require('path');         // modul pentru lucrul cu cai de fisiere

const UPLOAD_DIR = path.join(__dirname, '../uploads'); // directorul pentru fisierele incarcate


function run(sql, params = []) {
    // executa o instructiune SQL (INSERT, UPDATE, DELETE)
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function get(sql, params = []) {
    // executa o interogare SQL si returneaza un singur rand
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function all(sql, params = []) {
    // executa o interogare SQL si returneaza toate randurile
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
            // recupereaza calea fisierului si sterge imaginea din DB si de pe disc
            const imageRecord = await get('SELECT file_path FROM gallery_images WHERE id = ? AND parent_user_id = ?', [imageId, parentUserId]);

            if (!imageRecord) {
                return {changes: 0};
            }

            const result = await run('DELETE FROM gallery_images WHERE id = ? AND parent_user_id = ?', [imageId, parentUserId]);

            if (result.changes > 0) {
                const fileName = path.basename(imageRecord.file_path);
                const absoluteFilePath = path.join(UPLOAD_DIR, fileName);

                fs.unlink(absoluteFilePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error(`Error deleting physical file ${absoluteFilePath}:`, unlinkErr);

                    }
                });
                return {changes: result.changes};
            } else {
                return {changes: 0};
            }
        } catch (err) {
            console.error("Eroare in operatia DB deleteGalleryImage :", err);
            throw err;
        }
    },
    createTimelineEvent(childId, date, name, notes = '') {
        return run(
            'INSERT INTO timeline_events(child_id, date, name, notes) VALUES (?, ?, ?, ?)',
            [childId, date, name, notes]
        );
    },

    deleteTimelineEvent(id) {
        return run('DELETE FROM timeline_events WHERE id = ?', [id]);
    },

    getTimelineEventsByChild(childId) {
        return all(
            'SELECT id, date, name, notes FROM timeline_events WHERE child_id = ? ORDER BY date DESC',
            [childId]
        );
    },

    getAllTimelineEventsByParent(parentUserId) {
        // obtine toate evenimentele cronologice pentru copiii unui parinte, cu numele copilului
        return all(
            `SELECT te.id, te.date, te.name, te.notes, c.name AS childName
             FROM timeline_events te
                      JOIN children c ON te.child_id = c.id
             WHERE c.parent_user_id = ?
             ORDER BY te.date DESC`,
            [parentUserId]
        );
    }

};