// app.js
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const packageRepository = require('./package-repository');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

app.get('/js/terminalAPI.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'js', 'terminalAPI.js'));
});

app.use(express.json());

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

app.get('/api/packages/:packageName', (req, res) => {
    const packageName = req.params.packageName;
    const packageInfo = packageRepository.getPackage(packageName);

    if (packageInfo) {
        res.json(packageInfo);
    } else {
        res.status(404).json({ error: 'Package not found' });
    }
});

app.get('/api/packages', (req, res) => {
    const packages = packageRepository.getAllPackages();
    res.json(packages);
});

app.post('/api/packages', async (req, res) => {
    try {
        const packageInfo = req.body;
        await packageRepository.savePackage(packageInfo);
        res.status(201).json({ message: 'Package saved successfully' });
    } catch (error) {
        console.error('Error saving package:', error);
        res.status(500).json({ error: 'Unable to save package' });
    }
});

app.delete('/api/packages/:packageName', async (req, res) => {
    try {
        const packageName = req.params.packageName;
        await packageRepository.deletePackage(packageName);
        res.json({ message: 'Package deleted successfully' });
    } catch (error) {
        console.error('Error deleting package:', error);
        res.status(500).json({ error: 'Unable to delete package' });
    }
});

// Catch-all route to serve the index.html for any unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize the package repository before starting the server
packageRepository.initialize().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
