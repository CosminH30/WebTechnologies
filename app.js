// app.js
const http = require('http');
const fs   = require('fs');
const path = require('path');
const url  = require('url');

const { showLoginForm, loginUser }           = require('./controllers/loginController');
const { showRegisterForm, registerUser }     = require('./controllers/createAccountController');
const { showHomePage }                       = require('./controllers/myAccountController');
const { showProfile }                        = require('./controllers/childrenController');
const { showCalendar }                       = require('./controllers/calendarController');
const { showTest4Page }                      = require('./controllers/test4Controller');
const { showGalleryPage }                    = require('./controllers/galleryController');

const childrenAPI = require('./api/childrenAPI');
const eventsAPI   = require('./api/eventsAPI');
const galleryAPI  = require('./api/galleryAPI');

const checkRights = require('./utils/check-rights');

const server = http.createServer((req, res) => {
    const parsed = url.parse(req.url, true);

    // 1) Serve static files: CSS, JS utils, imagini şi POZE UPLOADATE
    if (req.method === 'GET' && (
        parsed.pathname.startsWith('/styles/') ||
        parsed.pathname.startsWith('/utils/') ||      // Păstrează aceasta dacă ai și alte scripturi în /utils/
        parsed.pathname.startsWith('/scripts/') ||    // ADAUGĂ ACEASTĂ LINIE NOUĂ
        parsed.pathname.startsWith('/images/') ||
        parsed.pathname.startsWith('/uploads/') // Ruta statică pentru a servi imaginile încărcate
    )) {
        const filePath = path.join(__dirname, parsed.pathname);
        fs.readFile(filePath, (err, data) => {
            if (err) {
                console.error(`Error reading static file ${filePath}:`, err);
                // Pentru erori la fișiere statice, e mai bine să returnezi 404 direct.
                return res.writeHead(404).end('Static file not found.');
            }
            const ext = path.extname(filePath).toLowerCase();
            let ct = 'application/octet-stream';
            if (ext === '.css')    ct = 'text/css';
            if (ext === '.js')     ct = 'application/javascript';
            if (ext === '.png')    ct = 'image/png';
            if (ext === '.jpg' || ext === '.jpeg') ct = 'image/jpeg';
            if (ext === '.gif')    ct = 'image/gif';
            if (ext === '.webp') ct = 'image/webp';
            if (ext === '.svg') ct = 'image/svg+xml';

            res.writeHead(200, { 'Content-Type': ct });
            res.end(data);
        });
        return;
    }

    // 2) Autentificare
    if (req.method === 'GET'  && parsed.pathname === '/login')          return showLoginForm(req, res);
    if (req.method === 'POST' && parsed.pathname === '/login')          return loginUser(req, res);
    if (req.method === 'GET'  && parsed.pathname === '/create-account') return showRegisterForm(req, res);
    if (req.method === 'POST' && parsed.pathname === '/create-account') return registerUser(req, res);

    // 3) Pagini protejate - cu log-uri pentru debugging
    if (req.method === 'GET' && parsed.pathname === '/profile') {
        console.log('DEBUG: Type of showProfile for /profile:', typeof showProfile);
        return checkRights(req, res, showProfile);
    }
    if (req.method === 'GET' && parsed.pathname === '/calendar') {
        console.log('DEBUG: Type of showCalendar for /calendar:', typeof showCalendar);
        return checkRights(req, res, showCalendar);
    }
    if (req.method === 'GET' && parsed.pathname === '/gallery') {
        console.log('DEBUG: Type of showGalleryPage for /gallery:', typeof showGalleryPage);
        return checkRights(req, res, showGalleryPage);
    }

    // 4) Pagină publică Home
    if (req.method === 'GET' && parsed.pathname === '/home')     return showHomePage(req, res);

    // 5) API copii
    if (req.method === 'GET'    && parsed.pathname === '/api/children')          return childrenAPI.getChildren(req, res);
    if (req.method === 'POST'   && parsed.pathname === '/api/children')          return childrenAPI.createChild(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/children/')) return childrenAPI.deleteChild(req, res);

    // 6) API evenimente
    if (req.method === 'GET'    && parsed.pathname.startsWith('/api/events'))     return eventsAPI.getEvents(req, res);
    if (req.method === 'POST'   && parsed.pathname === '/api/events')            return eventsAPI.createEvent(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/events/'))   return eventsAPI.deleteEvent(req, res);

    // 7) NOU: API Galerie (upload și listare)
    if (req.method === 'POST'   && parsed.pathname === '/api/gallery/upload') return galleryAPI.uploadImage(req, res);
    if (req.method === 'GET'    && parsed.pathname === '/api/gallery/images') return galleryAPI.getGalleryImages(req, res);
    if (req.method === 'DELETE' && parsed.pathname.startsWith('/api/gallery/images/')) return galleryAPI.deleteImage(req, res);


    // 8) Alte pagini Test - cu log-uri pentru debugging
    if (req.method === 'GET' && parsed.pathname === '/test3') {
        console.log('DEBUG: Type of showTest3Page for /test3:', typeof showTest3Page);
        return checkRights(req, res, showTest3Page);
    }
    if (req.method === 'GET' && parsed.pathname === '/test4') {
        console.log('DEBUG: Type of showTest4Page for /test4:', typeof showTest4Page);
        return checkRights(req, res, showTest4Page);
    }


    // 9) Default: redirect la /home
    res.writeHead(302, { Location: '/home' });
    res.end();
});

const PORT = process.env.PORT || 3006;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Access your application at: http://localhost:${PORT}`);
});