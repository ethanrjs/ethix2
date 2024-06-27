const express = require('express');
const path = require('path');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandlers');
const routes = require('./routes');
const packageRepository = require('./package-repository');
const logger = require('./utils/logger');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Adds various HTTP headers for security
app.use(morgan('combined', { stream: logger.stream })); // Logging
app.use(express.json());
app.use(express.static('public'));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Routes
app.use('/api', routes);

// Serve terminalAPI.js
app.get('/js/terminalAPI.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'js', 'terminalAPI.js'));
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
async function startServer() {
    try {
        await packageRepository.initialize();
        app.listen(port, () => {
            logger.info(`Server running at http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app; // For testing purposes
