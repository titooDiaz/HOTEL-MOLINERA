const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/hotel", (req, res) => {
    res.json({
        name: "Hotel Molinera"
    });
});

module.exports = app;