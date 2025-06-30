import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import app from '../../app.js';
import { testHelpers } from '../setup.test.js';
import packageRepository from '../../package-repository.js';
import cache from '../../utils/cache.js';

describe('End-to-End Application Tests', () => {
    let testPackagesDir;

    beforeAll(async () => {
        testPackagesDir = path.join('./test-temp', 'e2e-packages');
        await fs.mkdir(testPackagesDir, { recursive: true });

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

    describe('Complete Package Lifecycle', () => {
        it('should handle full package management workflow', async () => {
            // 1. Start with empty package list
            let response = await request(app).get('/api/packages').expect(200);
            expect(response.body).toEqual([]);

            // 2. Create a new package
            const newPackage = {
                name: 'workflow-test',
                version: '1.0.0',
                description: 'End-to-end workflow test package',
                keywords: ['test', 'e2e', 'workflow'],
                author: 'Test Suite',
                license: 'MIT'
            };

            response = await request(app).post('/api/packages').send(newPackage).expect(201);
            expect(response.body.message).toBe('Package saved successfully');

            // 3. Verify package appears in list
            response = await request(app).get('/api/packages').expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('workflow-test@1.0.0');

            // 4. Get specific package
            response = await request(app).get('/api/packages/workflow-test@1.0.0').expect(200);
            expect(response.body.description).toBe('End-to-end workflow test package');

            // 5. Search for the package
            response = await request(app).get('/api/search-packages?query=workflow').expect(200);
            expect(response.body).toHaveLength(1);
            expect(response.body[0].name).toBe('workflow-test@1.0.0');

            // 6. Create a new version
            const updatedPackage = {
                name: 'workflow-test',
                version: '2.0.0',
                description: 'Updated end-to-end workflow test package',
                keywords: ['test', 'e2e', 'workflow', 'updated']
            };

            await request(app).post('/api/packages').send(updatedPackage).expect(201);

            // 7. Verify latest version is returned by default
            response = await request(app).get('/api/packages/workflow-test').expect(200);
            expect(response.body.version).toBe('2.0.0');

            // 8. Verify both versions exist
            response = await request(app).get('/api/packages/workflow-test@1.0.0').expect(200);
            expect(response.body.version).toBe('1.0.0');

            // 9. Delete specific version
            await request(app).delete('/api/packages/workflow-test@1.0.0').expect(200);

            // 10. Verify only v2.0.0 remains
            response = await request(app).get('/api/packages/workflow-test@1.0.0').expect(404);

            response = await request(app).get('/api/packages/workflow-test@2.0.0').expect(200);

            // 11. Delete all versions
            await request(app).delete('/api/packages/workflow-test').expect(200);

            // 12. Verify package is completely removed
            response = await request(app).get('/api/packages').expect(200);
            expect(response.body).toEqual([]);
        });
    });

    describe('Multi-Package Scenarios', () => {
        it('should handle multiple packages with complex relationships', async () => {
            // Create multiple related packages
            const packages = [
                {
                    name: 'core-lib',
                    version: '1.0.0',
                    description: 'Core library for the application',
                    keywords: ['core', 'library', 'foundation']
                },
                {
                    name: 'ui-components',
                    version: '1.0.0',
                    description: 'UI components built on core-lib',
                    keywords: ['ui', 'components', 'frontend']
                },
                {
                    name: 'utils',
                    version: '1.0.0',
                    description: 'Utility functions for core-lib',
                    keywords: ['utils', 'helpers', 'tools']
                }
            ];

            // Create all packages
            for (const pkg of packages) {
                await request(app).post('/api/packages').send(pkg).expect(201);
            }

            // Verify all packages exist
            const response = await request(app).get('/api/packages').expect(200);
            expect(response.body).toHaveLength(3);

            // Test complex search scenarios
            let searchResponse = await request(app)
                .get('/api/search-packages?query=core')
                .expect(200);
            expect(searchResponse.body.length).toBeGreaterThanOrEqual(1);

            searchResponse = await request(app).get('/api/search-packages?query=lib').expect(200);
            expect(searchResponse.body.length).toBeGreaterThanOrEqual(2); // core-lib and ui-components

            // Test partial name matching
            searchResponse = await request(app).get('/api/search-packages?query=ui').expect(200);
            expect(searchResponse.body.some(p => p.name.includes('ui-components'))).toBe(true);
        });

        it('should handle version conflicts and updates', async () => {
            const packageName = 'version-conflict-test';

            // Create initial version
            await request(app)
                .post('/api/packages')
                .send({
                    name: packageName,
                    version: '1.0.0',
                    description: 'Version conflict test'
                })
                .expect(201);

            // Try to create duplicate version
            await request(app)
                .post('/api/packages')
                .send({
                    name: packageName,
                    version: '1.0.0',
                    description: 'Duplicate version attempt'
                })
                .expect(401);

            // Create multiple versions
            const versions = ['1.1.0', '1.2.0', '2.0.0', '2.1.0'];
            for (const version of versions) {
                await request(app)
                    .post('/api/packages')
                    .send({
                        name: packageName,
                        version,
                        description: `Version ${version} of conflict test`
                    })
                    .expect(201);
            }

            // Verify latest version is returned
            const response = await request(app).get(`/api/packages/${packageName}`).expect(200);
            expect(response.body.version).toBe('2.1.0');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle malformed requests gracefully', async () => {
            // Invalid JSON
            await request(app)
                .post('/api/packages')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);

            // Missing required fields
            await request(app).post('/api/packages').send({ name: 'incomplete' }).expect(400);

            // Invalid version format
            await request(app)
                .post('/api/packages')
                .send({
                    name: 'invalid-version',
                    version: 'not.a.version',
                    description: 'Invalid version test'
                })
                .expect(400);
        });

        it('should handle file system errors', async () => {
            // Test deletion of non-existent package
            const response = await request(app)
                .delete('/api/packages/non-existent-package')
                .expect(200); // Should handle gracefully

            // Test getting non-existent package
            await request(app).get('/api/packages/definitely-does-not-exist').expect(404);
        });

        it('should handle concurrent operations', async () => {
            const packageName = 'concurrent-test';

            // Simulate concurrent package creation attempts
            const concurrentRequests = Array(5)
                .fill()
                .map((_, i) =>
                    request(app)
                        .post('/api/packages')
                        .send({
                            name: packageName,
                            version: `1.${i}.0`,
                            description: `Concurrent test version 1.${i}.0`
                        })
                );

            const responses = await Promise.all(concurrentRequests);

            // All should succeed with different versions
            responses.forEach(response => {
                expect(response.status).toBe(201);
            });

            // Verify all versions were created
            const listResponse = await request(app).get('/api/packages').expect(200);

            const concurrentPackages = listResponse.body.filter(p =>
                p.name.startsWith(packageName)
            );
            expect(concurrentPackages).toHaveLength(5);
        });
    });

    describe('Performance and Load Testing', () => {
        it('should handle large number of packages efficiently', async () => {
            const packageCount = 50;
            const packages = [];

            // Create many packages
            for (let i = 0; i < packageCount; i++) {
                packages.push({
                    name: `load-test-${i}`,
                    version: '1.0.0',
                    description: `Load test package ${i}`,
                    keywords: [`test-${i % 10}`, 'load', 'performance']
                });
            }

            // Create packages in batches to avoid overwhelming the system
            const batchSize = 10;
            for (let i = 0; i < packages.length; i += batchSize) {
                const batch = packages.slice(i, i + batchSize);
                const batchRequests = batch.map(pkg =>
                    request(app).post('/api/packages').send(pkg)
                );

                const batchResponses = await Promise.all(batchRequests);
                batchResponses.forEach(response => {
                    expect(response.status).toBe(201);
                });
            }

            // Verify all packages were created
            const startTime = Date.now();
            const response = await request(app).get('/api/packages').expect(200);
            const endTime = Date.now();

            expect(response.body).toHaveLength(packageCount);
            expect(endTime - startTime).toBeLessThan(1000); // Should respond within 1 second

            // Test search performance
            const searchStartTime = Date.now();
            const searchResponse = await request(app)
                .get('/api/search-packages?query=test-5')
                .expect(200);
            const searchEndTime = Date.now();

            expect(searchResponse.body.length).toBeGreaterThan(0);
            expect(searchEndTime - searchStartTime).toBeLessThan(500); // Search should be fast
        });

        it('should handle rapid successive requests', async () => {
            const packageName = 'rapid-test';

            // Create base package
            await request(app)
                .post('/api/packages')
                .send({
                    name: packageName,
                    version: '1.0.0',
                    description: 'Rapid request test'
                })
                .expect(201);

            // Make many rapid requests
            const rapidRequests = Array(20)
                .fill()
                .map(() => request(app).get(`/api/packages/${packageName}`));

            const startTime = Date.now();
            const responses = await Promise.all(rapidRequests);
            const endTime = Date.now();

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
                expect(response.body.name).toBe(`${packageName}@1.0.0`);
            });

            // Should complete within reasonable time
            expect(endTime - startTime).toBeLessThan(2000);
        });
    });

    describe('Cache Behavior', () => {
        it('should properly cache and invalidate data', async () => {
            const packageName = 'cache-test';

            // Create package
            await request(app)
                .post('/api/packages')
                .send({
                    name: packageName,
                    version: '1.0.0',
                    description: 'Cache behavior test'
                })
                .expect(201);

            // First request should populate cache
            await request(app).get('/api/packages').expect(200);

            // Verify cache is populated
            expect(cache.get('all-packages')).toBeDefined();

            // Create another package (should invalidate cache)
            await request(app)
                .post('/api/packages')
                .send({
                    name: 'cache-test-2',
                    version: '1.0.0',
                    description: 'Second cache test package'
                })
                .expect(201);

            // Cache should be cleared
            expect(cache.get('all-packages')).toBeUndefined();

            // Next request should repopulate cache
            const response = await request(app).get('/api/packages').expect(200);

            expect(response.body).toHaveLength(2);
            expect(cache.get('all-packages')).toBeDefined();
        });
    });

    describe('Static File Serving', () => {
        it('should serve static files correctly', async () => {
            // Test serving the main HTML file
            const response = await request(app).get('/').expect(200);

            expect(response.headers['content-type']).toContain('text/html');

            // Test serving JavaScript files
            const jsResponse = await request(app).get('/js/terminalAPI.js').expect(200);

            expect(jsResponse.headers['content-type']).toContain('application/javascript');

            // Test 404 for non-existent static files
            await request(app).get('/non-existent-file.js').expect(404);
        });
    });

    describe('Application Health and Monitoring', () => {
        it('should handle server startup and initialization', async () => {
            // Test that the application responds to requests
            const response = await request(app).get('/api/packages').expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should handle graceful error responses', async () => {
            // Test various error scenarios
            const errorTests = [
                { path: '/api/packages/non-existent', expectedStatus: 404 },
                { path: '/api/search-packages', expectedStatus: 400 }, // Missing query
                { path: '/api/non-existent-endpoint', expectedStatus: 404 }
            ];

            for (const test of errorTests) {
                const response = await request(app).get(test.path).expect(test.expectedStatus);

                expect(response.body).toHaveProperty('error');
                expect(typeof response.body.error).toBe('string');
            }
        });
    });
});
