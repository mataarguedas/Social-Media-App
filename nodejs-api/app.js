const express = require('express');
    const bodyParser = require('body-parser');
    const cors = require('cors'); // Import cors
    const sequelize = require('./config/database');
    const userRoutes = require('./routes/userRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// --- CORS Configuration ---
const corsOptions = {
    origin: 'http://localhost:8081', // Allow requests from RN Metro Bundler
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Authorization'], // Allow necessary headers
    optionsSuccessStatus: 200 // Some legacy browsers choke on 204
  };
  app.use(cors(corsOptions)); // Use CORS middleware
  // --- End CORS Configuration ---

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api/users', userRoutes);

// Sync database and start server
sequelize.sync()
.then(() => {
    app.listen(PORT, '0.0.0.0', () => { // Listen on 0.0.0.0 to be accessible externally
        console.log(`Node.js API server running on port ${PORT}`);
    });
})
.catch(err => {
    console.error('Unable to sync database:', err);
});