const dbManager = require('../database/dbManager');
const authService = require('./authService');

function parseCookies(header) {
    // parseaza stringul de cookie-uri intr-un obiect
    return Object.fromEntries(header?.split('; ').map(c => c.split('=')) || []);
}

async function showRSS(req, res) {

    const cookies = parseCookies(req.headers.cookie);
    const sid = cookies.sessionId || cookies.session;
    const userId = authService.getUserIdBySession(sid);
    // verifica autentificarea utilizatorului
    if (!userId) {
        res.writeHead(401);
        return res.end('Unauthorized');
    }

    const items = await dbManager.getAllTimelineEventsByParent(userId); // preluare evenimente din baza de date

    // Construieste fluxul RSS
    const feedTitle = 'Timeline RSS';
    const feedLink = `http://${req.headers.host}/timeline`;
    const feedDesc = 'Flux RSS cu evenimentele importante ale copiilor dvs.';
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0"><channel>\n`;
    xml += `<title>${feedTitle}</title>\n`;
    xml += `<link>${feedLink}</link>\n`;
    xml += `<description>${feedDesc}</description>\n`;

    for (let ev of items) {
        const itemLink = `${feedLink}?child=${ev.child_id}`;
        xml += `<item>\n`;
        xml += `  <title>${ev.name} (${ev.childName})</title>\n`;
        xml += `  <link>${itemLink}</link>\n`;
        xml += `  <pubDate>${new Date(ev.date).toUTCString()}</pubDate>\n`;
        xml += `  <description>${ev.notes || ''}</description>\n`;
        xml += `</item>\n`;
    }

    xml += `</channel></rss>`;
    // Seteaza antetul si trimite raspunsul XML
    res.writeHead(200, {'Content-Type': 'application/rss+xml'});
    res.end(xml);
}

module.exports = {showRSS};