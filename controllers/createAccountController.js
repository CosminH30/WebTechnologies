const fs = require('fs');
const path = require('path');
const authService = require('./authService');

// formularul de inregistrare HTML
function showRegisterForm(req, res) {
  const file = path.join(__dirname, '../pages/createAccount.html');
  fs.readFile(file, (err, data) => {
    if (err) {
      return res.writeHead(500).end('Eroare internă a serverului');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

// gestioneaza cererile POST pentru inregistrarea utilizatorilor
function registerUser(req, res) {
  let body = '';
  // colecteaza datele din corpul cererii
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    const params = new URLSearchParams(body);
    const username = params.get('username');
    const email = params.get('email');
    const password = params.get('password');
    const confirmPassword = params.get('confirmPassword');

    try {
      // incearca inregistrarea utilizatorului
      await authService.registerUser({ username, email, password, confirmPassword });
      // redirectioneaza catre pagina de login la succes
      res.writeHead(302, { Location: '/login' });
      res.end();
    } catch (error) {
      // redirectioneaza inapoi la inregistrare cu mesaj de eroare
      res.writeHead(302, { Location: `/create-account?error=${encodeURIComponent(error.message)}` });
      res.end();
    }
  });
}

module.exports = { showRegisterForm, registerUser };