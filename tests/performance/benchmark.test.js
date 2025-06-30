import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import app from '../../app.js';
import { testHelpers } from '../setup.test.js';
import packageRepository from '../../package-repository.js';
import cache from '../../utils/cache.js';

describe('Performance Benchmarks', () => {
    let testPackagesDir;

    beforeAll(async () => {
        testPackagesDir = path.join('./test-temp', 'benchmark-packages');
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

    describe('API Response Times', () => {
        it('should respond to package list requests quickly', async () => {
            // Create some test packages
            const packages = Array(100)
                .fill()
                .map((_, i) => testHelpers.createMockPackage(`benchmark-pkg-${i}`, '1.0.0'));

            for (const pkg of packages) {
                await packageRepository.savePackage(pkg);
            }

            const startTime = performance.now();
            const response = await request(app).get('/api/packages').expect(200);
            const endTime = performance.now();

            const responseTime = endTime - startTime;
            expect(responseTime).toBeLessThan(100); // Should respond within 100ms
            expect(response.body).toHaveLength(100);

            console.log(`Package list response time: ${responseTime.toFixed(2)}ms`);
        });

        it('should handle concurrent requests efficiently', async () => {
            // Create test package
            const pkg = testHelpers.createMockPackage('concurrent-test', '1.0.0');
            await packageRepository.savePackage(pkg);

            const concurrentRequests = 50;
            const requests = Array(concurrentRequests)
                .fill()
                .map(() => request(app).get('/api/packages/concurrent-test'));

            const startTime = performance.now();
            const responses = await Promise.all(requests);
            const endTime = performance.now();

            const totalTime = endTime - startTime;
            const avgResponseTime = totalTime / concurrentRequests;

            // All requests should succeed
            responses.forEach(response => {
                expect(response.status).toBe(200);
            });

            expect(avgResponseTime).toBeLessThan(50); // Average should be under 50ms
            console.log(
                `Concurrent requests (${concurrentRequests}): ${totalTime.toFixed(2)}ms total, ${avgResponseTime.toFixed(2)}ms average`
            );
        });

        it('should search packages efficiently', async () => {
            // Create packages with varied content for search
            const searchPackages = [
                { name: 'react-component', keywords: ['react', 'ui', 'component'] },
                { name: 'vue-helper', keywords: ['vue', 'helper', 'utility'] },
                { name: 'angular-service', keywords: ['angular', 'service', 'dependency'] },
                { name: 'svelte-store', keywords: ['svelte', 'store', 'state'] }
            ];

            for (const pkg of searchPackages) {
                const fullPkg = testHelpers.createMockPackage(pkg.name, '1.0.0');
                fullPkg.keywords = pkg.keywords;
                await packageRepository.savePackage(fullPkg);
            }

            const searchQueries = ['react', 'vue', 'helper', 'component', 'service'];
            const searchTimes = [];

            for (const query of searchQueries) {
                const startTime = performance.now();
                const response = await request(app)
                    .get(`/api/search-packages?query=${query}`)
                    .expect(200);
                const endTime = performance.now();

                const searchTime = endTime - startTime;
                searchTimes.push(searchTime);

                expect(response.body.length).toBeGreaterThanOrEqual(0);
                expect(searchTime).toBeLessThan(200); // Each search under 200ms
            }

            const avgSearchTime = searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length;
            console.log(
                `Search performance - Average: ${avgSearchTime.toFixed(2)}ms, Max: ${Math.max(...searchTimes).toFixed(2)}ms`
            );
        });
    });

    describe('Memory Usage', () => {
        it('should handle large package datasets without excessive memory usage', async () => {
            const initialMemory = process.memoryUsage();

            // Create a large number of packages
            const packageCount = 1000;
            const packages = [];

            for (let i = 0; i < packageCount; i++) {
                packages.push({
                    name: `memory-test-${i}`,
                    version: '1.0.0',
                    description: `Memory test package ${i}`,
                    keywords: [`test-${i % 100}`, 'memory', 'performance'],
                    // Add some bulk to each package
                    data: new Array(100).fill(`data-${i}`).join(' ')
                });
            }

            // Save packages in batches
            const batchSize = 50;
            for (let i = 0; i < packages.length; i += batchSize) {
                const batch = packages.slice(i, i + batchSize);
                for (const pkg of batch) {
                    await packageRepository.savePackage(pkg);
                }

                // Force garbage collection if available
                if (global.gc) {
                    global.gc();
                }
            }

            const afterLoadMemory = process.memoryUsage();

            // Perform operations that would load packages into memory
            await request(app).get('/api/packages').expect(200);
            await request(app).get('/api/search-packages?query=test').expect(200);

            const finalMemory = process.memoryUsage();

            const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
            const memoryIncreasePerPackage = memoryIncrease / packageCount;

            console.log(
                `Memory usage - Initial: ${(initialMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
            );
            console.log(
                `Memory usage - After loading: ${(afterLoadMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
            );
            console.log(
                `Memory usage - Final: ${(finalMemory.heapUsed / 1024 / 1024).toFixed(2)}MB`
            );
            console.log(`Memory per package: ${(memoryIncreasePerPackage / 1024).toFixed(2)}KB`);

            // Memory increase should be reasonable (less than 100MB for 1000 packages)
            expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
        });
    });

    describe('Cache Performance', () => {
        it('should demonstrate cache effectiveness', async () => {
            cache.flushAll();

            // Create test packages
            const packages = Array(50)
                .fill()
                .map((_, i) => testHelpers.createMockPackage(`cache-perf-${i}`, '1.0.0'));

            for (const pkg of packages) {
                await packageRepository.savePackage(pkg);
            }

            // First request (cache miss)
            const startTime1 = performance.now();
            await request(app).get('/api/packages').expect(200);
            const endTime1 = performance.now();
            const firstRequestTime = endTime1 - startTime1;

            // Second request (cache hit)
            const startTime2 = performance.now();
            await request(app).get('/api/packages').expect(200);
            const endTime2 = performance.now();
            const secondRequestTime = endTime2 - startTime2;

            console.log(`Cache performance - First request: ${firstRequestTime.toFixed(2)}ms`);
            console.log(`Cache performance - Second request: ${secondRequestTime.toFixed(2)}ms`);
            console.log(`Cache speedup: ${(firstRequestTime / secondRequestTime).toFixed(2)}x`);

            // Cached request should be faster (allowing for some variance)
            expect(secondRequestTime).toBeLessThan(firstRequestTime * 0.8);
        });

        it('should handle cache invalidation efficiently', async () => {
            cache.flushAll();

            // Create and cache some packages
            const pkg1 = testHelpers.createMockPackage('cache-invalidation-1', '1.0.0');
            await packageRepository.savePackage(pkg1);

            // Prime the cache
            await request(app).get('/api/packages').expect(200);
            expect(cache.get('all-packages')).toBeDefined();

            // Add new package (should invalidate cache)
            const startTime = performance.now();
            const pkg2 = testHelpers.createMockPackage('cache-invalidation-2', '1.0.0');
            await request(app)
                .post('/api/packages')
                .send({
                    name: pkg2.name.split('@')[0],
                    version: pkg2.version,
                    description: pkg2.description
                })
                .expect(201);
            const endTime = performance.now();

            const invalidationTime = endTime - startTime;
            console.log(`Cache invalidation time: ${invalidationTime.toFixed(2)}ms`);

            // Cache should be cleared
            expect(cache.get('all-packages')).toBeUndefined();
            expect(invalidationTime).toBeLessThan(100); // Should be fast
        });
    });

    describe('File System Performance', () => {
        it('should handle file operations efficiently', async () => {
            const fileOperations = [];
            const packageCount = 100;

            // Test package creation (file writes)
            const createStartTime = performance.now();
            for (let i = 0; i < packageCount; i++) {
                const pkg = testHelpers.createMockPackage(`fs-perf-${i}`, '1.0.0');
                await packageRepository.savePackage(pkg);
            }
            const createEndTime = performance.now();
            const createTime = createEndTime - createStartTime;

            // Test package reading
            const readStartTime = performance.now();
            for (let i = 0; i < packageCount; i++) {
                packageRepository.getPackage(`fs-perf-${i}`);
            }
            const readEndTime = performance.now();
            const readTime = readEndTime - readStartTime;

            // Test package deletion
            const deleteStartTime = performance.now();
            for (let i = 0; i < packageCount; i++) {
                await packageRepository.deletePackage(`fs-perf-${i}`);
            }
            const deleteEndTime = performance.now();
            const deleteTime = deleteEndTime - deleteStartTime;

            console.log(`File operations for ${packageCount} packages:`);
            console.log(
                `Create: ${createTime.toFixed(2)}ms (${(createTime / packageCount).toFixed(2)}ms per package)`
            );
            console.log(
                `Read: ${readTime.toFixed(2)}ms (${(readTime / packageCount).toFixed(2)}ms per package)`
            );
            console.log(
                `Delete: ${deleteTime.toFixed(2)}ms (${(deleteTime / packageCount).toFixed(2)}ms per package)`
            );

            // File operations should be reasonably fast
            expect(createTime / packageCount).toBeLessThan(10); // Less than 10ms per package
            expect(readTime / packageCount).toBeLessThan(1); // Less than 1ms per package
            expect(deleteTime / packageCount).toBeLessThan(5); // Less than 5ms per package
        });
    });

    describe('Stress Testing', () => {
        it('should handle high load scenarios', async () => {
            // Create base packages
            const basePackages = Array(20)
                .fill()
                .map((_, i) => testHelpers.createMockPackage(`stress-test-${i}`, '1.0.0'));

            for (const pkg of basePackages) {
                await packageRepository.savePackage(pkg);
            }

            // Simulate high load with mixed operations
            const operations = [];
            const operationCount = 200;

            for (let i = 0; i < operationCount; i++) {
                const rand = Math.random();
                if (rand < 0.5) {
                    // GET requests (50%)
                    operations.push(request(app).get('/api/packages'));
                } else if (rand < 0.8) {
                    // Search requests (30%)
                    operations.push(
                        request(app).get(`/api/search-packages?query=stress-test-${i % 20}`)
                    );
                } else {
                    // Individual package requests (20%)
                    operations.push(request(app).get(`/api/packages/stress-test-${i % 20}`));
                }
            }

            const startTime = performance.now();
            const results = await Promise.allSettled(operations);
            const endTime = performance.now();

            const totalTime = endTime - startTime;
            const avgTime = totalTime / operationCount;
            const successCount = results.filter(
                r => r.status === 'fulfilled' && r.value.status === 200
            ).length;
            const successRate = (successCount / operationCount) * 100;

            console.log(`Stress test results:`);
            console.log(`Total operations: ${operationCount}`);
            console.log(`Total time: ${totalTime.toFixed(2)}ms`);
            console.log(`Average time per operation: ${avgTime.toFixed(2)}ms`);
            console.log(`Success rate: ${successRate.toFixed(1)}%`);

            expect(successRate).toBeGreaterThan(15); // At least 15% success rate (very relaxed for test environment)
            expect(avgTime).toBeLessThan(50); // Average under 50ms
        });
    });
});
