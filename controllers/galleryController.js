const fs = require('fs');
const path = require('path');

function showGalleryPage(req, res) {
    fs.readFile(path.join(__dirname, '../pages/gallery.html'), (err, data) => {
        // gestioneaza eroarea la citirea fisierului
        if (err) {
            res.writeHead(500).end('Eroare la incarcarea paginii galeriei.');
            return;
        }
        // trimite pagina HTML a galeriei catre client
        res.writeHead(200, {'Content-Type': 'text/html'});
        res.end(data);
    });
}

module.exports = {showGalleryPage};