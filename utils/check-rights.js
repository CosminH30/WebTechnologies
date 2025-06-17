const authService = require('../controllers/authService');

// middleware pentru verificarea autentificarii utilizatorului
module.exports = function(req, res, next) {
  // extrage cookie-urile din header-ul cererii HTTP.
  const cookies = Object.fromEntries(
      req.headers.cookie?.split('; ').map(c => c.split('=')) || []
  );
  // verifica daca exista o sesiune valida asociata cu cookie-ul
  if (!authService.getUserIdBySession(cookies.sessionId)) {
    // redirectioneaza utilizatorul catre pagina de login daca nu este autentificat
    res.writeHead(302, { Location: '/login' });
    return res.end();
  }
  // urmatorul handler in lantul middleware/ruta.
  next(req, res);
};