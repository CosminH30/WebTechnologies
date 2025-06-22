const authService = require('../controllers/authService');

// middleware pentru verificarea autentificarii utilizatorului
module.exports = function (req, res, next) {
    // parse cookies
    const cookies = Object.fromEntries(
        req.headers.cookie?.split('; ').map(c => c.split('=')) || []
    );
    // accepta fie session, fie sessionId
    const sid = cookies.sessionId || cookies.session;
    const userId = authService.getUserIdBySession(sid);
    if (!userId) {
        // redirectionam la login daca nu e autentificat
        res.writeHead(302, {Location: '/login'});
        return res.end();
    }
    // atasam userId in req (opțional)
    req.userId = userId;
    return next(req, res);
};