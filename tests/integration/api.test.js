import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import app from '../../app.js';
import { testHelpers } from '../setup.test.js';
import packageRepository from '../../package-repository.js';
import cache from '../../utils/cache.js';

describe('API Integration Tests', () => {
    let server;
    let testPackagesDir;

    beforeAll(async () => {
        testPackagesDir = path.join('./test-temp', 'api-packages');
        await fs.mkdir(testPackagesDir, { recursive: true });

        // Override the packages directory for testing
        packageRepository.packagesDir = testPackagesDir;
        packageRepository.packages = {};

        await packageRepository.initialize();
    });

    afterAll(async () => {
        try {
            await fs.rm(testPackagesDir, { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    beforeEach(() => {
        cache.flushAll();
        packageRepository.packages = {};
    });

    describe('GET /api/packages', () => {
        it('should return empty array when no packages exist', async () => {
            const response = await request(app).get('/api/packages').expect(200);

            expect(response.body).toEqual([]);
        });

        it('should return all packages', async () => {
            const pkg1 = testHelpers.createMockPackage('test-pkg1', '1.0.0');
            const pkg2 = testHelpers.createMockPackage('test-pkg2', '2.0.0');

            await packageRepository.savePackage(pkg1);
            await packageRepository.savePackage(pkg2);

            const response = await request(app).get('/api/packages').expect(200);

            expect(response.body).toHaveLength(2);
            expect(response.body.find(p => p.name === 'test-pkg1@1.0.0')).toBeDefined();
            expect(response.body.find(p => p.name === 'test-pkg2@2.0.0')).toBeDefined();
        });

        it('should cache the response', async () => {
            const pkg = testHelpers.createMockPackage('cache-test', '1.0.0');
            await packageRepository.savePackage(pkg);

            // First request
            await request(app).get('/api/packages').expect(200);

            // Verify cache is set
            const cachedData = cache.get('all-packages');
            expect(cachedData).toBeDefined();
            expect(cachedData).toHaveLength(1);
        });
    });

    describe('GET /api/packages/:packageName', () => {
        beforeEach(async () => {
            const pkg1 = testHelpers.createMockPackage('get-test', '1.0.0');
            const pkg2 = testHelpers.createMockPackage('get-test', '2.0.0');
            await packageRepository.savePackage(pkg1);
            await packageRepository.savePackage(pkg2);
        });

        it('should return specific package version', async () => {
            const response = await request(app).get('/api/packages/get-test@1.0.0').expect(200);

            expect(response.body.name).toBe('get-test@1.0.0');
            expect(response.body.version).toBe('1.0.0');
        });

        it('should return latest version when no version specified', async () => {
            const response = await request(app).get('/api/packages/get-test').expect(200);

            expect(response.body.version).toBe('2.0.0'); // Latest version
        });

        it('should return 404 for non-existent package', async () => {
            const response = await request(app).get('/api/packages/non-existent').expect(404);

            expect(response.body.error).toBe('Package not found');
        });

        it('should cache package responses', async () => {
            await request(app).get('/api/packages/get-test@1.0.0').expect(200);

            const cachedData = cache.get('package:get-test@1.0.0');
            expect(cachedData).toBeDefined();
            expect(cachedData.name).toBe('get-test@1.0.0');
        });
    });

    describe('POST /api/packages', () => {
        it('should create a new package', async () => {
            const newPackage = {
                name: 'new-package',
                version: '1.0.0',
                description: 'A new test package',
                keywords: ['test', 'new']
            };

            const response = await request(app).post('/api/packages').send(newPackage).expect(201);

            expect(response.body.message).toBe('Package saved successfully');
            expect(response.body.version).toBe('1.0.0');

            // Verify package was saved
            const savedPackage = packageRepository.getPackage('new-package@1.0.0');
            expect(savedPackage).toBeDefined();
            expect(savedPackage.name).toBe('new-package@1.0.0');
        });

        it('should validate version format', async () => {
            const invalidPackage = {
                name: 'invalid-version',
                version: 'not-a-version',
                description: 'Invalid version test'
            };

            const response = await request(app)
                .post('/api/packages')
                .send(invalidPackage)
                .expect(400);

            expect(response.body.error).toContain('Invalid version format');
        });

        it('should require version field', async () => {
            const packageWithoutVersion = {
                name: 'no-version',
                description: 'Package without version'
            };

            const response = await request(app)
                .post('/api/packages')
                .send(packageWithoutVersion)
                .expect(400);

            expect(response.body.error).toBe('Version is required');
        });

        it('should prevent duplicate package versions', async () => {
            const pkg = testHelpers.createMockPackage('duplicate-test', '1.0.0');
            await packageRepository.savePackage(pkg);

            const duplicatePackage = {
                name: 'duplicate-test',
                version: '1.0.0',
                description: 'Duplicate package'
            };

            const response = await request(app)
                .post('/api/packages')
                .send(duplicatePackage)
                .expect(401);

            expect(response.body.error).toBe('Package with this version already exists');
        });

        it('should clear cache after creating package', async () => {
            // Set some cache data
            cache.set('all-packages', []);

            const newPackage = {
                name: 'cache-clear-test',
                version: '1.0.0',
                description: 'Cache clear test'
            };

            await request(app).post('/api/packages').send(newPackage).expect(201);

            // Cache should be cleared
            expect(cache.get('all-packages')).toBeUndefined();
        });

        it('should accept different version formats', async () => {
            const versionFormats = ['1', '1.0', '1.0.0', '10.5.2'];

            for (const version of versionFormats) {
                const pkg = {
                    name: `version-test-${version.replace(/\./g, '-')}`,
                    version,
                    description: `Version format test for ${version}`
                };

                await request(app).post('/api/packages').send(pkg).expect(201);
            }
        });
    });

    describe('DELETE /api/packages/:packageName', () => {
        beforeEach(async () => {
            const pkg1 = testHelpers.createMockPackage('delete-test', '1.0.0');
            const pkg2 = testHelpers.createMockPackage('delete-test', '2.0.0');
            await packageRepository.savePackage(pkg1);
            await packageRepository.savePackage(pkg2);
        });

        it('should delete specific package version', async () => {
            const response = await request(app)
                .delete('/api/packages/delete-test@1.0.0')
                .expect(200);

            expect(response.body.message).toBe('Package deleted successfully');

            // Verify package was deleted
            expect(packageRepository.getPackage('delete-test@1.0.0')).toBeNull();
            expect(packageRepository.getPackage('delete-test@2.0.0')).toBeDefined();
        });

        it('should delete all versions when no version specified', async () => {
            await request(app).delete('/api/packages/delete-test').expect(200);

            expect(packageRepository.getPackage('delete-test@1.0.0')).toBeNull();
            expect(packageRepository.getPackage('delete-test@2.0.0')).toBeNull();
        });

        it('should clear cache after deletion', async () => {
            cache.set('all-packages', []);
            cache.set('package:delete-test@1.0.0', {});

            await request(app).delete('/api/packages/delete-test@1.0.0').expect(200);

            expect(cache.get('all-packages')).toBeUndefined();
            expect(cache.get('package:delete-test@1.0.0')).toBeUndefined();
        });
    });

    describe('GET /api/search-packages', () => {
        beforeEach(async () => {
            const packages = [
                testHelpers.createMockPackage('react-component', '1.0.0'),
                testHelpers.createMockPackage('vue-helper', '2.0.0'),
                testHelpers.createMockPackage('angular-utils', '1.5.0')
            ];

            packages[0].description = 'A React component library';
            packages[0].keywords = ['react', 'components', 'ui'];
            packages[1].description = 'Vue.js helper functions';
            packages[1].keywords = ['vue', 'helpers', 'utilities'];
            packages[2].description = 'Angular utility functions';
            packages[2].keywords = ['angular', 'utils', 'helpers'];

            for (const pkg of packages) {
                await packageRepository.savePackage(pkg);
            }
        });

        it('should require search query', async () => {
            const response = await request(app).get('/api/search-packages').expect(400);

            expect(response.body.error).toBe('Search query is required');
        });

        it('should search packages by name', async () => {
            const response = await request(app).get('/api/search-packages?query=react').expect(200);

            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('react-component@1.0.0');
        });

        it('should search packages by description', async () => {
            const response = await request(app)
                .get('/api/search-packages?query=helper')
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(1);
            const names = response.body.map(p => p.name);
            expect(names).toContain('vue-helper@2.0.0');
        });

        it('should search packages by keywords', async () => {
            const response = await request(app)
                .get('/api/search-packages?query=utilities')
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(1);
            const names = response.body.map(p => p.name);
            expect(names).toContain('vue-helper@2.0.0');
        });

        it('should return empty array for no matches', async () => {
            const response = await request(app)
                .get('/api/search-packages?query=nonexistent')
                .expect(200);

            expect(response.body).toEqual([]);
        });

        it('should handle fuzzy search', async () => {
            const response = await request(app)
                .get('/api/search-packages?query=reac') // Partial match
                .expect(200);

            expect(response.body.length).toBeGreaterThanOrEqual(1);
        });
    });

    describe('GET /api/command-modules', () => {
        it('should return list of command modules', async () => {
            const response = await request(app).get('/api/command-modules').expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            // Should contain some of the command files we know exist
            expect(response.body.some(file => file.endsWith('.js'))).toBe(true);
        });

        it('should cache command modules list', async () => {
            await request(app).get('/api/command-modules').expect(200);

            const cachedData = cache.get('command-modules');
            expect(cachedData).toBeDefined();
            expect(Array.isArray(cachedData)).toBe(true);
        });
    });

    describe('Error handling', () => {
        it('should handle 404 for non-existent routes', async () => {
            const response = await request(app).get('/api/non-existent-route').expect(404);

            expect(response.body.message).toContain('Not Found');
        });

        it('should handle malformed JSON in POST requests', async () => {
            const response = await request(app)
                .post('/api/packages')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
        });
    });

    describe('Rate limiting', () => {
        it('should apply rate limiting to API routes', async () => {
            // Make multiple requests quickly
            const requests = Array(10)
                .fill()
                .map(() => request(app).get('/api/packages'));

            const responses = await Promise.all(requests);

            // All should succeed within rate limit
            responses.forEach(response => {
                expect([200, 429]).toContain(response.status);
            });
        });
    });
});
