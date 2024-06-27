const express = require('express');
const packageRepository = require('./package-repository');
const cache = require('./utils/cache');
const { asyncHandler } = require('./middleware/asyncHandler');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

router.get(
    '/command-modules',
    asyncHandler(async (req, res) => {
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
    })
);

router.get('/packages/:packageName', (req, res) => {
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

router.get('/packages', (req, res) => {
    const cacheKey = 'all-packages';
    let packages = cache.get(cacheKey);

    if (packages == undefined) {
        packages = packageRepository.getAllPackages();
        cache.set(cacheKey, packages);
    }

    res.json(packages);
});

router.post(
    '/packages',
    asyncHandler(async (req, res) => {
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
    })
);

router.delete(
    '/packages/:packageName',
    asyncHandler(async (req, res) => {
        const packageName = req.params.packageName;
        await packageRepository.deletePackage(packageName);

        cache.del('all-packages');
        cache.del(`package:${packageName}`);

        res.json({ message: 'Package deleted successfully' });
    })
);

module.exports = router;
