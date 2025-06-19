// api/childrenAPI.js
const dbManager = require('../database/dbManager');
const authService = require('../controllers/authService');

function parseCookies(header) {
  return Object.fromEntries(header?.split('; ').map(c => c.split('=')) || []);
}

async function getChildren(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const userId = authService.getUserIdBySession(cookies.sessionId);

  console.log('API Children: getChildren - User ID from session:', userId); // DEBUG LOG

  if (!userId) {
    res.writeHead(401).end('Neautentificat. Sesiune invalidă.');
    return;
  }

  try {
    const list = await dbManager.getChildrenByParent(userId);
    console.log('API Children: getChildren - Copii găsiți:', list); // DEBUG LOG
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(list));
  } catch (err) {
    console.error('API Children: Eroare la preluarea copiilor din baza de date:', err); // DEBUG ERROR LOG
    res.writeHead(500).end('Eroare la preluarea copiilor.');
  }
}

function collectBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => resolve(new URLSearchParams(body)));
  });
}

async function createChild(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const userId = authService.getUserIdBySession(cookies.sessionId);

  console.log('API Children: createChild - User ID from session:', userId); // DEBUG LOG

  if (!userId) {
    res.writeHead(401).end('Neautentificat. Sesiune invalidă.');
    return;
  }

  try {
    const params = await collectBody(req);
    const name = params.get('name');
    const dob = params.get('dob');
    // Assuming 'dob' is date of birth and '' is for other details
    await dbManager.createChild(userId, name, dob, '');
    console.log(`API Children: Copil creat cu succes. Nume: ${name}, DOB: ${dob}`); // DEBUG LOG
    res.writeHead(201).end();
  } catch (err) {
    console.error('API Children: Eroare la crearea copilului:', err); // DEBUG ERROR LOG
    res.writeHead(500).end('Eroare la crearea copilului.');
  }
}

async function deleteChild(req, res) {
  const cookies = parseCookies(req.headers.cookie);
  const userId = authService.getUserIdBySession(cookies.sessionId); // Adaugă verificare user pentru ștergere

  if (!userId) {
    res.writeHead(401).end('Neautentificat. Sesiune invalidă.');
    return;
  }

  const id = req.url.split('/').pop();

  try {
    // Presupunând că deleteChild în dbManager poate verifica userId
    const result = await dbManager.deleteChild(id, userId); // Poate necesită și userId pentru verificare drepturi
    if (result.changes === 0) {
      res.writeHead(404).end('Copilul nu a fost găsit sau nu ai drepturi de ștergere.');
      return;
    }
    console.log(`API Children: Copil șters cu succes. ID: ${id}`); // DEBUG LOG
    res.writeHead(204).end();
  } catch (err) {
    console.error(`API Children: Eroare la ștergerea copilului cu ID ${id}:`, err); // DEBUG ERROR LOG
    res.writeHead(500).end('Eroare la ștergerea copilului.');
  }
}

module.exports = { getChildren, createChild, deleteChild };