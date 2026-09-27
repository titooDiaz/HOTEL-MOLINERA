const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();

app.use(cors()); // 2. Activar cors para permitir peticiones de React

// Tu ruta API actual
app.get("/api/hotel", (req, res) => {
    res.json({
        name: "Hotel Molinera"
    });
});

// Código de producción (estáticos y catch-all)
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

module.exports = app;