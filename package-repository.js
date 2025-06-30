import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import semver from 'semver';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PackageRepository {
    constructor() {
        this.packages = {};
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
                    const [name, version] = packageInfo.name.split('@');
                    if (!this.packages[name]) {
                        this.packages[name] = {};
                    }
                    this.packages[name][version] = packageInfo;
                }
            }
        } catch (error) {
            console.error('Error loading packages:', error);
        }
    }

    async savePackage(packageInfo) {
        try {
            const [name, version] = packageInfo.name.split('@');
            const filePath = path.join(this.packagesDir, `${name}@${version}.json`);
            await fs.writeFile(filePath, JSON.stringify(packageInfo, null, 2));
            if (!this.packages[name]) {
                this.packages[name] = {};
            }
            this.packages[name][version] = packageInfo;
        } catch (error) {
            console.error('Error saving package:', error);
            throw error;
        }
    }

    getPackage(packageName) {
        const [name, version] = packageName.split('@');
        if (!this.packages[name]) {
            return null;
        }
        if (version) {
            return this.packages[name][version] || null;
        }
        const versions = Object.keys(this.packages[name]);
        const newestVersion = semver.maxSatisfying(versions, '*');
        return this.packages[name][newestVersion] || null;
    }

    getAllPackages() {
        const allPackages = [];
        for (const packageName in this.packages) {
            const versions = Object.keys(this.packages[packageName]);
            const newestVersion = semver.maxSatisfying(versions, '*');
            allPackages.push(this.packages[packageName][newestVersion]);
        }
        return allPackages;
    }

    async deletePackage(packageName) {
        try {
            const [name, version] = packageName.split('@');
            if (!this.packages[name]) {
                throw new Error('Package not found');
            }
            if (version) {
                const filePath = path.join(this.packagesDir, `${name}@${version}.json`);
                await fs.unlink(filePath);
                delete this.packages[name][version];
                if (Object.keys(this.packages[name]).length === 0) {
                    delete this.packages[name];
                }
            } else {
                const versions = Object.keys(this.packages[name]);
                for (const v of versions) {
                    const filePath = path.join(this.packagesDir, `${name}@${v}.json`);
                    await fs.unlink(filePath);
                }
                delete this.packages[name];
            }
        } catch (error) {
            console.error('Error deleting package:', error);
            throw error;
        }
    }
}

const packageRepository = new PackageRepository();

export default packageRepository;
