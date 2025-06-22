const fs = require('fs');
const path = require('path');

function showTimeline(req, res) {
    const file = path.join(__dirname, '../pages/timeline.html');
    fs.readFile(file, (err, data) => {
        // gestioneaza eroarea la citirea fisierului
        if (err) {
            res.writeHead(500).end('Eroare la incarcarea paginii Timeline.');
            return;
        }
        // trimite pagina HTML a cronologiei catre client, cu set de caractere UTF-8
        res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'});
        res.end(data);
    });
}

module.exports = {showTimeline};