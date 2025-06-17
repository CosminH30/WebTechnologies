const fs = require('fs');
const path = require('path');
const authService = require('./authService');

// pagina de home (doar pentru utilizatorii autentificati)
function showHomePage(req, res) {
  // extrage cookie-urile din header-ul cererii HTTP.
  const cookies = Object.fromEntries(
      req.headers.cookie?.split('; ').map(c => c.split('=')) || []
  );
  // obtine ID-ul utilizatorului pe baza ID-ului sesiunii din cookie
  const userId = authService.getUserIdBySession(cookies.sessionId);

  // daca nu exista un utilizator asociat sesiunii, redirectioneaza catre pagina de login
  if (!userId) {
    res.writeHead(302, { Location: '/login' });
    return res.end();
  }

  // daca utilizatorul este autentificat => serveste pagina HTML a contului
  const file = path.join(__dirname, '../pages/myAccount.html');
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(500).end(); // gestioneaza erorile de citire a fisierului.
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

module.exports = { showHomePage };