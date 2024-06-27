const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const packageRepository = require('./package-repository');
const NodeCache = require('node-cache');

const app = express();
const port = process.env.PORT || 3000;

const cache = new NodeCache({ stdTTL: 600 });

app.use(express.static('public'));

app.get('/js/terminalAPI.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'js', 'terminalAPI.js'));
});

app.use(express.json());

app.get('/api/command-modules', async (req, res) => {
    try {
        const cacheKey = 'command-modules';
        let jsFiles = cache.get(cacheKey);

        if (jsFiles == undefined) {
            const commandsDir = path.join(
                __dirname,
                'public',
                'js',
                'commands'
            );
            const files = await fs.readdir(commandsDir);
            jsFiles = files.filter(file => file.endsWith('.js'));
            cache.set(cacheKey, jsFiles);
        }

        res.json(jsFiles);
    } catch (error) {
        console.error('Error reading command modules:', error);
        res.status(500).json({ error: 'Unable to retrieve command modules' });
    }
});

app.get('/api/packages/:packageName', (req, res) => {
    const packageName = req.params.packageName;
    const cacheKey = `package:${packageName}`;
    let packageInfo = cache.get(cacheKey);

    if (packageInfo == undefined) {
        packageInfo = packageRepository.getPackage(packageName);
        if (packageInfo) {
            cache.set(cacheKey, packageInfo);
        }
    }

    if (packageInfo) {
        res.json(packageInfo);
    } else {
        res.status(404).json({ error: 'Package not found' });
    }
});

app.get('/api/packages', (req, res) => {
    const cacheKey = 'all-packages';
    let packages = cache.get(cacheKey);

    if (packages == undefined) {
        packages = packageRepository.getAllPackages();
        cache.set(cacheKey, packages);
    }

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

        cache.del('all-packages');
        cache.del(`package:${packageInfo.name}`);

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

        cache.del('all-packages');
        cache.del(`package:${packageName}`);

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
