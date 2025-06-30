import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import fs from 'fs/promises';
import path from 'path';
import { testHelpers } from '../setup.test.js';
import PackageRepository from '../../package-repository.js';

describe('PackageRepository', () => {
    let packageRepository;
    let testPackagesDir;

    beforeEach(async () => {
        testPackagesDir = path.join('./test-temp', 'packages-' + Date.now());
        await fs.mkdir(testPackagesDir, { recursive: true });

        // Create a new instance with test directory
        packageRepository = new (class extends PackageRepository.constructor {
            constructor() {
                super();
                this.packagesDir = testPackagesDir;
                this.packages = {};
            }
        })();
    });

    afterEach(async () => {
        try {
            await fs.rm(testPackagesDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('initialize', () => {
        it('should create packages directory if it does not exist', async () => {
            await packageRepository.initialize();

            const stats = await fs.stat(testPackagesDir);
            expect(stats.isDirectory()).toBe(true);
        });

        it('should load existing packages on initialization', async () => {
            const mockPackage = testHelpers.createMockPackage('test-pkg', '1.0.0');
            await fs.writeFile(
                path.join(testPackagesDir, 'test-pkg@1.0.0.json'),
                JSON.stringify(mockPackage)
            );

            await packageRepository.initialize();

            const loadedPackage = packageRepository.getPackage('test-pkg@1.0.0');
            expect(loadedPackage).toEqual(mockPackage);
        });
    });

    describe('savePackage', () => {
        it('should save package to file system', async () => {
            const mockPackage = testHelpers.createMockPackage('save-test', '1.0.0');

            await packageRepository.savePackage(mockPackage);

            const filePath = path.join(testPackagesDir, 'save-test@1.0.0.json');
            const fileContent = await fs.readFile(filePath, 'utf-8');
            expect(JSON.parse(fileContent)).toEqual(mockPackage);
        });

        it('should add package to in-memory store', async () => {
            const mockPackage = testHelpers.createMockPackage('memory-test', '1.0.0');

            await packageRepository.savePackage(mockPackage);

            const retrievedPackage = packageRepository.getPackage('memory-test@1.0.0');
            expect(retrievedPackage).toEqual(mockPackage);
        });

        it('should handle multiple versions of same package', async () => {
            const pkg1 = testHelpers.createMockPackage('multi-test', '1.0.0');
            const pkg2 = testHelpers.createMockPackage('multi-test', '2.0.0');

            await packageRepository.savePackage(pkg1);
            await packageRepository.savePackage(pkg2);

            expect(packageRepository.getPackage('multi-test@1.0.0')).toEqual(pkg1);
            expect(packageRepository.getPackage('multi-test@2.0.0')).toEqual(pkg2);
        });
    });

    describe('getPackage', () => {
        beforeEach(async () => {
            const pkg1 = testHelpers.createMockPackage('get-test', '1.0.0');
            const pkg2 = testHelpers.createMockPackage('get-test', '2.0.0');
            await packageRepository.savePackage(pkg1);
            await packageRepository.savePackage(pkg2);
        });

        it('should return specific version when requested', () => {
            const pkg = packageRepository.getPackage('get-test@1.0.0');
            expect(pkg.version).toBe('1.0.0');
        });

        it('should return latest version when no version specified', () => {
            const pkg = packageRepository.getPackage('get-test');
            expect(pkg.version).toBe('2.0.0'); // Latest version
        });

        it('should return null for non-existent package', () => {
            const pkg = packageRepository.getPackage('non-existent');
            expect(pkg).toBeNull();
        });

        it('should return null for non-existent version', () => {
            const pkg = packageRepository.getPackage('get-test@3.0.0');
            expect(pkg).toBeNull();
        });
    });

    describe('getAllPackages', () => {
        it('should return empty array when no packages exist', () => {
            const packages = packageRepository.getAllPackages();
            expect(packages).toEqual([]);
        });

        it('should return latest version of each package', async () => {
            const pkg1v1 = testHelpers.createMockPackage('pkg1', '1.0.0');
            const pkg1v2 = testHelpers.createMockPackage('pkg1', '2.0.0');
            const pkg2v1 = testHelpers.createMockPackage('pkg2', '1.0.0');

            await packageRepository.savePackage(pkg1v1);
            await packageRepository.savePackage(pkg1v2);
            await packageRepository.savePackage(pkg2v1);

            const packages = packageRepository.getAllPackages();
            expect(packages).toHaveLength(2);
            expect(packages.find(p => p.name === 'pkg1@2.0.0')).toBeDefined();
            expect(packages.find(p => p.name === 'pkg2@1.0.0')).toBeDefined();
        });
    });

    describe('deletePackage', () => {
        beforeEach(async () => {
            const pkg1 = testHelpers.createMockPackage('delete-test', '1.0.0');
            const pkg2 = testHelpers.createMockPackage('delete-test', '2.0.0');
            await packageRepository.savePackage(pkg1);
            await packageRepository.savePackage(pkg2);
        });

        it('should delete specific version', async () => {
            await packageRepository.deletePackage('delete-test@1.0.0');

            expect(packageRepository.getPackage('delete-test@1.0.0')).toBeNull();
            expect(packageRepository.getPackage('delete-test@2.0.0')).toBeDefined();
        });

        it('should delete all versions when no version specified', async () => {
            await packageRepository.deletePackage('delete-test');

            expect(packageRepository.getPackage('delete-test@1.0.0')).toBeNull();
            expect(packageRepository.getPackage('delete-test@2.0.0')).toBeNull();
        });

        it('should remove file from file system', async () => {
            await packageRepository.deletePackage('delete-test@1.0.0');

            const filePath = path.join(testPackagesDir, 'delete-test@1.0.0.json');
            await expect(fs.access(filePath)).rejects.toThrow();
        });

        it('should throw error for non-existent package', async () => {
            await expect(packageRepository.deletePackage('non-existent')).rejects.toThrow(
                'Package not found'
            );
        });
    });

    describe('error handling', () => {
        it('should handle file system errors gracefully during initialization', async () => {
            const consoleSpy = mock(() => {});
            const originalConsoleError = console.error;
            console.error = consoleSpy;

            // Mock fs.readdir to throw an error
            const originalReaddir = fs.readdir;
            fs.readdir = mock(() => Promise.reject(new Error('File system error')));

            await packageRepository.initialize();

            expect(consoleSpy).toHaveBeenCalled();

            // Restore mocks
            console.error = originalConsoleError;
            fs.readdir = originalReaddir;
        });

        it('should handle JSON parsing errors during package loading', async () => {
            const consoleSpy = mock(() => {});
            const originalConsoleError = console.error;
            console.error = consoleSpy;

            // Create invalid JSON file
            await fs.writeFile(path.join(testPackagesDir, 'invalid.json'), 'invalid json content');

            await packageRepository.initialize();

            expect(consoleSpy).toHaveBeenCalled();
            console.error = originalConsoleError;
        });
    });
});
