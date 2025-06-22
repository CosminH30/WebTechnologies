const dbManager = require('../database/dbManager');
const authService = require('../controllers/authService');

function parseCookies(header) {
    // parseaza stringul de cookie-uri intr-un obiect
    return Object.fromEntries(header?.split('; ').map(c => c.split('=')) || []);
}

async function getChildren(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);

    // verifica autentificarea utilizatorului
    if (!userId) {
        res.writeHead(401).end('Neautentificat. Sesiune invalida.');
        return;
    }

    try {
        const list = await dbManager.getChildrenByParent(userId);
        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify(list));
    } catch (err) {
        res.writeHead(500).end('Eroare la preluarea copiilor.');
    }
}

function collectBody(req) {
    // colectează corpul cererii HTTP
    return new Promise(resolve => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(new URLSearchParams(body)));
    });
}

async function createChild(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);

    // verifica autentificarea utilizatorului
    if (!userId) {
        res.writeHead(401).end('Neautentificat. Sesiune invalida.');
        return;
    }

    try {
        const params = await collectBody(req);
        const name = params.get('name');
        const dob = params.get('dob');
        await dbManager.createChild(userId, name, dob, '');
        // raspuns de succes (fara continut)
        res.writeHead(201).end();
    } catch (err) {
        res.writeHead(500).end('Eroare la crearea copilului.');
    }
}

async function deleteChild(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);

    // verifica autentificarea utilizatorului
    if (!userId) {
        res.writeHead(401).end('Neautentificat. Sesiune invalida.');
        return;
    }

    const id = req.url.split('/').pop();

    try {
        const result = await dbManager.deleteChild(id, userId);
        // verifica daca stergerea a avut loc
        if (result.changes === 0) {
            res.writeHead(404).end('Copilul nu a fost gasit sau nu ai drepturi de stergere.');
            return;
        }
        res.writeHead(204).end();
    } catch (err) {
        res.writeHead(500).end('Eroare la stergerea copilului.');
    }
}

module.exports = {getChildren, createChild, deleteChild};