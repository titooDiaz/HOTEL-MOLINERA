const express = require('express');
const path = require('path');
const app = express();

// Tu ruta API actual
app.get("/api/hotel", (req, res) => {
    res.json({
        name: "Hotel Molinera"
    });
});

// 1. Definir la ruta a la carpeta 'dist' del frontend
// Usamos '../..' porque app.js está dentro de backend/src/
const frontendDistPath = path.join(__dirname, '../../frontend/dist');

// 2. Servir los archivos estáticos (JS, CSS, imágenes)
app.use(express.static(frontendDistPath));

// 3. Capturar cualquier otra ruta y devolver el index.html de React
// Esto es esencial si usas React Router para la navegación interna
// 3. Capturar cualquier otra ruta y devolver el index.html de React
// Se usa una expresión regular /.*/ en lugar del string '*'
app.get(/.*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
});

module.exports = app;