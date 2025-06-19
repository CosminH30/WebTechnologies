// controllers/galleryController.js
const fs = require('fs');
const path = require('path');

function showGalleryPage(req, res) {
  fs.readFile(path.join(__dirname, '../pages/gallery.html'), (err, data) => {
    if (err) {
      console.error('Error loading gallery.html:', err);
      res.writeHead(500).end('Eroare la încărcarea paginii galeriei.');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

module.exports = { showGalleryPage };