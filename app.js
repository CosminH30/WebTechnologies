const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const { showLoginForm, loginUser } = require('./controllers/loginController');
const { showRegisterForm, registerUser } = require('./controllers/createAccountController');
const { showHomePage } = require('./controllers/myAccountController');
const checkRights = require('./utils/check-rights');

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // Servirea fișierelor CSS
    if (req.method === 'GET' && parsed.pathname.startsWith('/styles/')) {
        const filePath = path.join(__dirname, parsed.pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) return res.writeHead(404).end();
            res.writeHead(200, { 'Content-Type': 'text/css' });
            res.end(data);
        });
        return;
    }

    // Rute autentificare
    if (req.method === 'GET' && parsed.pathname === '/login') return showLoginForm(req, res);
    if (req.method === 'POST' && parsed.pathname === '/login') return loginUser(req, res);

    if (req.method === 'GET' && parsed.pathname === '/create-account') return showRegisterForm(req, res);
    if (req.method === 'POST' && parsed.pathname === '/create-account') return registerUser(req, res);

    // Pagina protejată
    if (req.method === 'GET' && parsed.pathname === '/home') return checkRights(req, res, showHomePage);

    // Default: redirect la /login
    res.writeHead(302, { Location: '/login' });
    res.end();
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your application at: http://localhost:${PORT}`);
});