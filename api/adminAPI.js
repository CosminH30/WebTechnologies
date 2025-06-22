const dbManager = require('../database/dbManager');
const authService = require('../controllers/authService');

const ADMIN_ID = 8; // id hard-codat pt contul admin

function parseCookies(header) {
    // parsează stringul de cookie-uri intr-un obiect
    return (header || '')
        .split('; ')
        .filter(Boolean)
        .map(c => c.split('='))
        .reduce((acc, [k, v]) => {
            acc[k] = v;
            return acc;
        }, {});
}

async function getUsers(req, res) {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const userId = authService.getUserIdBySession(cookies.sessionId);

        // verifica autentificarea si drepturile de admin
        if (!userId) {
            res.writeHead(401).end('Neautentificat.');
            return;
        }
        if (userId !== ADMIN_ID) {
            res.writeHead(403).end('Nu ai drepturi de admin.');
            return;
        }

        const users = await dbManager.all('SELECT id, username FROM users WHERE id != ?', [ADMIN_ID]);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(users));

    } catch (err) {
        console.error(err);
        res.writeHead(500).end('Eroare la obtinerea utilizatorilor.');
    }
}

async function deleteUser(req, res) {
    try {
        const cookies = parseCookies(req.headers.cookie);
        const userId = authService.getUserIdBySession(cookies.sessionId);

        // verifica autentificarea si drepturile de admin
        if (!userId) {
            res.writeHead(401).end('Neautentificat.');
            return;
        }
        if (userId !== ADMIN_ID) {
            res.writeHead(403).end('Nu ai drepturi de admin.');
            return;
        }

        const parts = req.url.split('/');
        const idToDelete = parseInt(parts[parts.length - 1], 10);

        // previne stergerea contului de admin
        if (idToDelete === ADMIN_ID) {
            res.writeHead(403).end('Nu poit sterge contul admin.');
            return;
        }

        const result = await dbManager.run('DELETE FROM users WHERE id = ?', [idToDelete]);
        // raspunde daca utilizatorul nu a fost gasit
        if (result.changes === 0) {
            res.writeHead(404).end('Utilizator inexistent.');
            return;
        }

        // raspuns de succes (fara continut)
        res.writeHead(204).end();

    } catch (err) {
        console.error(err);
        res.writeHead(500).end('Eroare la stergerea utilizatorului.');
    }
}

module.exports = {getUsers, deleteUser};