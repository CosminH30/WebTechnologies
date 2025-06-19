const formidable = require('formidable');
const fs         = require('fs');
const path       = require('path');
const dbManager  = require('../database/dbManager');
const authService = require('../controllers/authService');

const UPLOAD_DIR = path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch (err) {}
}

module.exports = {
    async uploadImage(req, res) {
        let cookies = {};
        if (req.headers.cookie) {
            req.headers.cookie.split(';').forEach(cookie => {
                const parts = cookie.split('=');
                cookies[parts[0].trim()] = parts[1].trim();
            });
        }

        const userId = authService.getUserIdBySession(cookies.sessionId);

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Unauthorized' }));
            return;
        }

        const form = new formidable.IncomingForm();

        form.uploadDir = UPLOAD_DIR;
        form.keepExtensions = true;
        form.maxFileSize = 5 * 1024 * 1024;

        form.parse(req, async (err, fields, files) => {
            if (err) {
                let errorMessage = 'Eroare la încărcarea fișierului.';
                if (err.code === formidable.Errors.biggerThanMaxFileSize) {
                    errorMessage = 'Fișierul este prea mare (max 5MB).';
                }
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: errorMessage }));
                return;
            }

            const childId   = Array.isArray(fields.childId) ? fields.childId[0] : fields.childId;
            const category  = Array.isArray(fields.category) ? fields.category[0] : fields.category;

            const uploadedFile = Array.isArray(files.image) ? files.image[0] : files.image;

            if (!uploadedFile || !uploadedFile.filepath) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Nu s-a primit niciun fișier.' }));
                return;
            }

            const oldPath = uploadedFile.filepath;
            const fileName = path.basename(oldPath);
            const newPath = path.join(UPLOAD_DIR, fileName);

            fs.rename(oldPath, newPath, async (renameErr) => {
                if (renameErr) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Eroare la salvarea fișierului.' }));
                    return;
                }

                try {
                    const filePathForDb = `/uploads/${fileName}`;
                    await dbManager.createGalleryImage(userId, childId, filePathForDb, category);
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Imagine încărcată cu succes!', filePath: filePathForDb }));
                } catch (dbErr) {
                    fs.unlink(newPath, (unlinkErr) => {});
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ message: 'Eroare la salvarea imaginii în baza de date.' }));
                }
            });
        });
    },

    async getGalleryImages(req, res) {
        let cookies = {};
        if (req.headers.cookie) {
            req.headers.cookie.split(';').forEach(cookie => {
                const parts = cookie.split('=');
                cookies[parts[0].trim()] = parts[1].trim();
            });
        }

        const userId = authService.getUserIdBySession(cookies.sessionId);

        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Unauthorized' }));
            return;
        }

        try {
            const images = await dbManager.getGalleryImagesByParent(userId);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(images));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Eroare la preluarea imaginilor din galerie.' }));
        }
    },

    async deleteImage(req, res) {
        let cookies = {};
        if (req.headers.cookie) {
            req.headers.cookie.split(';').forEach(cookie => {
                const parts = cookie.split('=');
                cookies[parts[0].trim()] = parts[1].trim();
            });
        }

        const userId = authService.getUserIdBySession(cookies.sessionId);
        if (!userId) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Unauthorized' }));
            return;
        }

        const parts = req.url.split('/');
        const imageId = parseInt(parts[parts.length - 1], 10);

        if (isNaN(imageId)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'ID imagine invalid.' }));
            return;
        }

        try {
            const result = await dbManager.deleteGalleryImage(imageId, userId);
            if (result.changes > 0) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Imagine ștearsă cu succes.' }));
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ message: 'Imaginea nu a fost găsită sau nu aparține utilizatorului curent.' }));
            }
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Eroare la ștergerea imaginii.' }));
        }
    }
};