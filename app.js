const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const authService = require('./controllers/authService');

// importa controlerele pentru paginile HTML (afisarea interfetei)
const {showLoginForm, loginUser} = require('./controllers/loginController');
const {showRegisterForm, registerUser} = require('./controllers/createAccountController');
const {showHomePage} = require('./controllers/myAccountController');
const {showProfile} = require('./controllers/childrenController');
const {showCalendar} = require('./controllers/calendarController');
const {showGalleryPage} = require('./controllers/galleryController');
const {showTimeline} = require('./controllers/timelineController');
const {showRSS} = require('./controllers/rssController');
const {showAdminPage} = require('./controllers/adminController');

// importa modulele API (gestionarea datelor via cereri AJAX/Fetch)
const timelineAPI = require('./api/timelineAPI');
const childrenAPI = require('./api/childrenAPI');
const eventsAPI = require('./api/eventsAPI');
const galleryAPI = require('./api/galleryAPI');
const adminAPI = require('./api/adminAPI');

const checkRights = require('./utils/check-rights');

const ADMIN_ID = 8; //  ID-ul contului admin

// parsarea cookie-urilor intr-un obiect
function parseCookies(header) {
    return (header || '')
        .split('; ')
        .filter(Boolean)
        .map(c => c.split('='))
        .reduce((acc, [k, v]) => {
            acc[k] = v;
            return acc;
        }, {});
}

// crearea serverului HTTP
const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // 1) Servire Fisiere Statice
    if (req.method === 'GET' && (
        parsed.pathname.startsWith('/styles/') ||
        parsed.pathname.startsWith('/utils/') ||
        parsed.pathname.startsWith('/scripts/') ||
        parsed.pathname.startsWith('/images/') ||
        parsed.pathname.startsWith('/uploads/')
    )) {
        const filePath = path.join(__dirname, parsed.pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(`Error reading static file ${filePath}:`, err);
                return res.writeHead(404).end('Static file not found.');
            }
            // extrage extensia fisierului
            const ext = path.extname(filePath).toLowerCase();
            let ct = 'application/octet-stream';
            // seteaza Content-Type in functie de extensie
            if (ext === '.css') ct = 'text/css';
            if (ext === '.js') ct = 'application/javascript';
            if (ext === '.png') ct = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') ct = 'image/jpeg';
            if (ext === '.gif') ct = 'image/gif';
            if (ext === '.webp') ct = 'image/webp';
            if (ext === '.svg') ct = 'image/svg+xml';

            res.writeHead(200, {'Content-Type': ct});
            res.end(data);
        });
        return;
    }
    // 2) Autentificare si Inregistrare
    if (req.method === 'GET' && parsed.pathname === '/login') return showLoginForm(req, res);
    if (req.method === 'POST' && parsed.pathname === '/login') return loginUser(req, res);
    if (req.method === 'GET' && parsed.pathname === '/create-account') return showRegisterForm(req, res);
    if (req.method === 'POST' && parsed.pathname === '/create-account') return registerUser(req, res);

    // Ruta pentru Logout: invalideaza sesiunea si redirectioneaza
    if (req.method === 'GET' && parsed.pathname === '/logout') {
        res.writeHead(302, {
            'Set-Cookie': 'sessionId=; HttpOnly; Path=/; Max-Age=0',
            'Location': '/login'
        });
        res.end();
        return;
    }

    // 3) Pagini protejate
    if (req.method === 'GET' && parsed.pathname === '/profile') return checkRights(req, res, showProfile);
    if (req.method === 'GET' && parsed.pathname === '/calendar') return checkRights(req, res, showCalendar);
    if (req.method === 'GET' && parsed.pathname === '/gallery') return checkRights(req, res, showGalleryPage);
    if (req.method === 'GET' && parsed.pathname === '/timeline') return checkRights(req, res, showTimeline);
    if (req.method === 'GET' && parsed.pathname === '/rss') return checkRights(req, res, showRSS);

    // 4) Pagina Publica Home (accesibila fara autentificare)
    if (req.method === 'GET' && parsed.pathname === '/home') return showHomePage(req, res);

    // 5) API Copii (rute pentru gestionarea datelor copiilor)
    if (req.method === 'GET' && parsed.pathname === '/api/children') return childrenAPI.getChildren(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/children') return childrenAPI.createChild(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/children/')) return childrenAPI.deleteChild(req, res);

    // 6) API Evenimente
    if (req.method === 'GET' && parsed.pathname.startsWith('/api/events')) return eventsAPI.getEvents(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/events') return eventsAPI.createEvent(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/events/')) return eventsAPI.deleteEvent(req, res);

    // 7) API Galerie (rute pentru gestionarea imaginilor din galerie)
    if (req.method === 'POST' && parsed.pathname === '/api/gallery/upload') return galleryAPI.uploadImage(req, res);
    if (req.method === 'GET' && parsed.pathname === '/api/gallery/images') return galleryAPI.getGalleryImages(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/gallery/images/')) return galleryAPI.deleteImage(req, res);

    // 8) API Timeline (rute pentru gestionarea evenimentelor din cronologie)
    if (req.method === 'GET' && parsed.pathname === '/api/timeline') return timelineAPI.getTimeline(req, res);
    if (req.method === 'POST' && parsed.pathname === '/api/timeline') return timelineAPI.createTimeline(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/timeline/')) return timelineAPI.deleteTimeline(req, res);

    // Pagina admin (protejată)
    if (req.method === 'GET' && parsed.pathname === '/admin') {
        const cookies = parseCookies(req.headers.cookie);
        const userId = authService.getUserIdBySession(cookies.sessionId);

        if (!userId) {
            res.writeHead(401).end('Trebuie să fii autentificat.');
            return;
        }
        if (userId !== ADMIN_ID) {
            res.writeHead(403).end('Nu ai drepturi de admin.');
            return;
        }
        return showAdminPage(req, res);
    }

    // 9) API Admin (rute pentru gestionarea utilizatorilor de catre admin)
    if (req.method === 'GET' && parsed.pathname === '/api/admin/users')
        return adminAPI.getUsers(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/admin/users/'))
        return adminAPI.deleteUser(req, res);

    // Default: redirect la /home
    res.writeHead(302, {Location: '/home'});
    res.end();
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your application at: http://localhost:${PORT}`);
});
