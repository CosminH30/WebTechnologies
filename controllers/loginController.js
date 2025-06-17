const fs = require('fs');
const path = require('path');
const authService = require('./authService');

// formularul de login HTML
function showLoginForm(req, res) {
  const file = path.join(__dirname, '../pages/login.html');
  fs.readFile(file, (err, data) => {
    if (err) {
      return res.writeHead(500).end('Eroare internă a serverului');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

// gestioneaza cererile POST pentru autentificare
function loginUser(req, res) {
  let body = '';
  // colecteaza datele din corpul cererii
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const password = params.get('password');

    try {
      // incearca autentificarea utilizatorului
      const sessionId = await authService.authenticate(username, password);

      if (sessionId) {
        // autentificare reusita => cookie de sesiune HttpOnly => redirectioneaza catre pagina home
        res.writeHead(302, {
          'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}`,
          'Location': '/home'
        });
        res.end();
      } else {
        // redirectioneaza la formularul de login cu mesaj de eroare
        res.writeHead(302, { 'Location': `/login?error=${encodeURIComponent('Nume utilizator sau parolă incorectă.')}` });
        res.end();
      }
    } catch (error) {
      res.writeHead(302, { 'Location': `/login?error=${encodeURIComponent('A apărut o eroare la autentificare. Vă rugăm să încercați din nou.')}` });
      res.end();
    }
  });
}

module.exports = { showLoginForm, loginUser };