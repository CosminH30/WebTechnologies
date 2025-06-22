const fs = require('fs');
const path = require('path');
const authService = require('./authService');

function showLoginForm(req, res) {
    const file = path.join(__dirname, '../pages/login.html');
    fs.readFile(file, (err, data) => {
        // gestioneaza eroarea la citirea fisierului
        if (err) {
            return res.writeHead(500).end('Eroare internă a serverului');
        }
        // trimite pagina HTML a formularului de login
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}

function loginUser(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        const params = new URLSearchParams(body);
        const username = params.get('username');
        const password = params.get('password');

        try {
            // apeleaza auth service
            const sessionId = await authService.authenticate(username, password);

            if (sessionId) {
                // seteaza cookie-ul de sesiune si redirectioneaza la succes
                res.writeHead(302, {
                    'Set-Cookie': `sessionId=${sessionId}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24}`, // Cookie HTTP-only, valabil 24h
                    'Location': '/home'
                });
                res.end();
            } else {
                // redirectioneaza cu mesaj de eroare la esec
                res.writeHead(302, {'Location': `/login?error=${encodeURIComponent('Nume utilizator sau parola incorecta.')}`});
                res.end();
            }
        } catch (error) {
            // gestioneaza erorile neasteptate la autentificare
            res.writeHead(302, {'Location': `/login?error=${encodeURIComponent('A aparut o eroare la autentificare. Va rugam sa incercati din nou.')}`});
            res.end();
        }
    });
}

module.exports = {showLoginForm, loginUser};