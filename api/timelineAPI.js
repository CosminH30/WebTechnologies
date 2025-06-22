const dbManager = require('../database/dbManager');
const authService = require('../controllers/authService');

function parseCookies(header) {
    // parseaza stringul de cookie-uri intr-un obiect
    return Object.fromEntries(
        (header || '')
            .split('; ')
            .filter(Boolean)
            .map(c => c.split('='))
    );
}

async function getTimeline(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);
    // verifica autentificarea utilizatorului
    if (!userId) {
        return res.writeHead(401).end('Neautentificat.');
    }

    const base = `http://${req.headers.host}`;
    const url = new URL(req.url, base);
    const childId = url.searchParams.get('child');
    // valideaza prezenta parametrului 'child'
    if (!childId) {
        return res.writeHead(400).end('Parametrul "child" este obligatoriu.');
    }

    const events = await dbManager.getTimelineEventsByChild(childId);

    // exporta datele in format CSV (cerere)
    if (url.searchParams.get('format') === 'csv') {
        res.writeHead(200, {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename="timeline.csv"',
        });
        const header = ['id', 'child_id', 'date', 'name', 'notes'].join(',') + '\n';
        const rows = events.map(e => [
            e.id,
            childId,
            `"${e.date}"`,
            `"${e.name.replace(/"/g, '""')}"`,
            `"${(e.notes || '').replace(/"/g, '""')}"`
        ].join(',')).join('\n');
        return res.end(header + rows);
    }

    // exporta datele in format JSON (implicit)
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify(events));
}

async function createTimeline(req, res) {
    const cookies = parseCookies(req.headers.cookie);
    const userId = authService.getUserIdBySession(cookies.sessionId);
    // verifica autentificarea utilizatorului
    if (!userId) {
        return res.writeHead(401).end('Neautentificat.');
    }

    let child_id, date, name, notes;
    const ct = req.headers['content-type'] || '';
    if (ct.includes('application/json')) {
        // proceseaza corpul cererii JSON
        let body = '';
        for await (const chunk of req) body += chunk;
        try {
            const data = JSON.parse(body);
            ({child_id, date, name, notes = ''} = data);
        } catch {
            return res.writeHead(400).end('JSON invalid.');
        }
    } else {
        // proceseaza corpul cererii de tip form data
        let body = '';
        req.on('data', c => body += c);
        await new Promise(r => req.on('end', r));
        const params = new URLSearchParams(body);
        child_id = params.get('child');
        date = params.get('date');
        name = params.get('name');
        notes = params.get('notes') || '';
    }

    // valideaza prezenta datelor obligatorii
    if (!child_id || !date || !name) {
        return res.writeHead(400).end('child, date si name sunt obligatorii.');
    }

    await dbManager.createTimelineEvent(child_id, date, name, notes);
    res.writeHead(201).end();
}

async function deleteTimeline(req, res) {
    const parts = req.url.split('/');
    const id = parseInt(parts.pop(), 10);
    // valideaza ID-ul evenimentului
    if (!id) {
        return res.writeHead(400).end('ID invalid.');
    }

    const result = await dbManager.run(
        'DELETE FROM timeline_events WHERE id = ?',
        [id]
    );
    // verifica daca evenimentul a fost sters
    if (result.changes === 0) {
        return res.writeHead(404).end('Eveniment inexistent.');
    }
    res.writeHead(204).end();
}

module.exports = {getTimeline, createTimeline, deleteTimeline};