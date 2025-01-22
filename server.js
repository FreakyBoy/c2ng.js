const express = require('express');
const path = require('path');

const app = express();

// Definiere das Verzeichnis zum Bereitstellen von Dateien
const publicDirectory = path.join(__dirname, 'public');
app.use(express.static(publicDirectory)); // Stellt Dateien im "public"-Ordner bereit
app.use((req, res, next) => {
    res.setHeader('Referrer-Policy', 'no-restriction'); // oder: 'origin-when-cross-origin'
    next();
});

// Standardseite
app.get('/', (req, res) => {
    res.sendFile(path.join(publicDirectory, 'index.html'));
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Lokaler Server läuft auf http://localhost:${PORT}`);
});
