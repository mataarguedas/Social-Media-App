const { Sequelize } = require('sequelize');
require('dotenv').config();

// Create Sequelize connection
const sequelize = new Sequelize(
    process.env.DB_NAME=app_db, 
    process.env.DB_USER=emma, 
    process.env.DB_PASSWORD=636363636363, 
    {
        host: process.env.DB_HOST=localhost,
        dialect: 'postgres',
        logging: false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);

// Test the connection
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
}

testConnection();

module.exports = sequelize;