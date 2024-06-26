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

        if (!packageInfo.version) {
            return res.status(400).json({ error: 'Version is required' });
        }

        const versionRegex = /^(\d+)(\.\d+)?(\.\d+)?$/;
        if (!versionRegex.test(packageInfo.version)) {
            return res.status(400).json({
                error: 'Invalid version format. Use (number)[.(number).(number)]'
            });
        }

        const existingPackage = packageRepository.getPackage(
            `${packageInfo.name}@${packageInfo.version}`
        );
        if (existingPackage) {
            return res
                .status(401)
                .json({ error: 'Package with this version already exists' });
        }

        packageInfo.name = `${packageInfo.name}@${packageInfo.version}`;

        await packageRepository.savePackage(packageInfo);
        res.status(201).json({
            message: 'Package saved successfully',
            version: packageInfo.version
        });
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

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

packageRepository.initialize().then(() => {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
});
