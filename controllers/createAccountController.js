const fs = require('fs');
const path = require('path');
const authService = require('./authService');

function showRegisterForm(req, res) {
    const file = path.join(__dirname, '../pages/createAccount.html');
    fs.readFile(file, (err, data) => {
        // gestioneaza eroarea la citirea fisierului
        if (err) {
            return res.writeHead(500).end('Eroare interna a serverului');
        }
        // trimite pagina HTML a formularului de inregistrare
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}

async function registerUser(req, res) {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
        const params = new URLSearchParams(body);
        const username = params.get('username');
        const password = params.get('password');
        const confirmPassword = params.get('confirmPassword');

        try {
            // apeleaza auth service pentru a inregistra utilizatorul
            await authService.registerUser({username, password, confirmPassword});
            // redirectioneaza catre pagina de login la succes
            res.writeHead(302, {Location: '/login'});
            res.end();
        } catch (error) {
            // redirectioneaza cu mesaj de eroare in caz de esec
            res.writeHead(302, {
                Location: `/create-account?error=${encodeURIComponent(error.message)}`
            });
            res.end();
        }
    });
}

module.exports = {showRegisterForm, registerUser};