require('dotenv').config({ override: true });

const { Sequelize } = require('sequelize');

const databaseName = process.env.DB_NAME;

const sequelize = new Sequelize(
    databaseName,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false
    }
);

async function connectDatabase() {
    const adminSequelize = new Sequelize({
        username: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        host: process.env.DB_HOST,
        dialect: process.env.DB_DIALECT,
        logging: false
    });

    const escapedDatabaseName = databaseName.replace(/`/g, '``');

    await adminSequelize.authenticate();
    await adminSequelize.query(`CREATE DATABASE IF NOT EXISTS \`${escapedDatabaseName}\``);
    await adminSequelize.close();

    await sequelize.authenticate();
    console.log('Database connected');
}

module.exports = { sequelize, connectDatabase };