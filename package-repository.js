// Enhanced package repository

const fs = require('fs').promises;
const path = require('path');

class PackageRepository {
    constructor() {
        this.packages = {
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
        this.packagesDir = path.join(__dirname, 'packages');
    }

    async initialize() {
        try {
            await fs.mkdir(this.packagesDir, { recursive: true });
            await this.loadPackages();
        } catch (error) {
            console.error('Error initializing package repository:', error);
        }
    }

    async loadPackages() {
        try {
            const files = await fs.readdir(this.packagesDir);
            for (const file of files) {
                if (file.endsWith('.json')) {
                    const packageData = await fs.readFile(
                        path.join(this.packagesDir, file),
                        'utf-8'
                    );
                    const packageInfo = JSON.parse(packageData);
                    this.packages[packageInfo.name] = packageInfo;
                }
            }
        } catch (error) {
            console.error('Error loading packages:', error);
        }
    }

    async savePackage(packageInfo) {
        try {
            const filePath = path.join(
                this.packagesDir,
                `${packageInfo.name}.json`
            );
            await fs.writeFile(filePath, JSON.stringify(packageInfo, null, 2));
            this.packages[packageInfo.name] = packageInfo;
        } catch (error) {
            console.error('Error saving package:', error);
            throw error;
        }
    }

    getPackage(packageName) {
        return this.packages[packageName] || null;
    }

    getAllPackages() {
        return Object.values(this.packages);
    }

    async deletePackage(packageName) {
        try {
            const filePath = path.join(this.packagesDir, `${packageName}.json`);
            await fs.unlink(filePath);
            delete this.packages[packageName];
        } catch (error) {
            console.error('Error deleting package:', error);
            throw error;
        }
    }
}

const packageRepository = new PackageRepository();

module.exports = packageRepository;
