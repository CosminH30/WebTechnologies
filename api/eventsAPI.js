const dbManager = require('../database/dbManager');
const authService = require('../controllers/authService');

function parseCookies(header) {
    // parsează stringul de cookie-uri intr-un obiect
    return Object.fromEntries(header?.split('; ').map(c => c.split('=')) || []);
}

async function getEvents(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);
    const url = new URL(req.url, `http://${req.headers.host}`);
    const childId = url.searchParams.get('child');
    const type = url.searchParams.get('type');

    // valideaza prezenta parametrilor childId si type
    if (!childId || !type) {
        res.writeHead(400);
        return res.end('child and type are required');
    }
    const events = await dbManager.getEventsByChildAndType(childId, type);
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(events));
}

function collectBody(req) {
    // colectează corpul cererii HTTP
    return new Promise(resolve => {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', () => resolve(new URLSearchParams(body)));
    });
}

async function createEvent(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);
    const params = await collectBody(req);
    const childId = params.get('child');
    const date = params.get('date');
    const time = params.get('time');
    const type = params.get('type');
    const notes = params.get('notes') || '';
    await dbManager.createEvent(childId, date, time, type, notes);
    // raspuns de succes (fara continut)
    res.writeHead(201);
    res.end();
}

async function deleteEvent(req, res) {
    const id = req.url.split('/').pop();
    await dbManager.deleteEvent(id);
    // raspuns de succes (fara continut)
    res.writeHead(204);
    res.end();
}

module.exports = {getEvents, createEvent, deleteEvent};