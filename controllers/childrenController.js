const fs = require('fs');
const path = require('path');

function showProfile(req, res) {
    const file = path.join(__dirname, '../pages/profile.html');
    fs.readFile(file, (err, data) => {
        // gestioneaza eroarea la citirea fisierului
        if (err) {
            res.writeHead(500);
            return res.end('Eroare la incarcarea paginii de profil.');
        }
        // trimite pagina HTML catre client
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}

module.exports = {showProfile};