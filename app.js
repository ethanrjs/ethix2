// server.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const port = process.env.PORT || 3000;

// Serve static files from the 'public' directory
app.use(express.static('public'));

// API endpoint to get the list of command modules
app.get('/api/command-modules', async (req, res) => {
    try {
        const commandsDir = path.join(__dirname, 'public', 'js', 'commands');
        const files = await fs.readdir(commandsDir);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        res.json(jsFiles);
    } catch (error) {
        console.error('Error reading command modules:', error);
        res.status(500).json({ error: 'Unable to retrieve command modules' });
    }
});

// Simple in-memory package repository
const packageRepository = {
    'example-package': {
        name: 'example-package',
        version: '1.0.0',
        description: 'An example package',
        code: 'console.log("Example package loaded!");'
    },
    'math-utils': {
        name: 'math-utils',
        version: '1.1.0',
        description: 'Basic math utilities',
        code: `
            function add(a, b) { return a + b; }
            function subtract(a, b) { return a - b; }
            console.log("Math utilities loaded!");
        `
    }
};

// API endpoint to get package information
app.get('/api/packages/:packageName', (req, res) => {
    const packageName = req.params.packageName;
    const packageInfo = packageRepository[packageName];

    if (packageInfo) {
        res.json(packageInfo);
    } else {
        res.status(404).json({ error: 'Package not found' });
    }
});

// Catch-all route to serve the index.html for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
