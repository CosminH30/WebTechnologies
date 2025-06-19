// controllers/myAccountController.js
const fs = require('fs');
const path = require('path');

function showHomePage(req, res) {
  const file = path.join(__dirname, '../pages/myAccount.html');
  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(500);
      return res.end('Eroare la încărcarea paginii.');
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(data);
  });
}

module.exports = { showHomePage };
