import { describe, it, expect, beforeEach } from 'bun:test';
import cache from '../../utils/cache.js';

describe('Cache Utility', () => {
    beforeEach(() => {
        // Clear cache before each test
        cache.flushAll();
    });

    describe('basic operations', () => {
        it('should set and get values', () => {
            cache.set('test-key', 'test-value');
            const value = cache.get('test-key');
            expect(value).toBe('test-value');
        });

        it('should return undefined for non-existent keys', () => {
            const value = cache.get('non-existent-key');
            expect(value).toBeUndefined();
        });

        it('should handle different data types', () => {
            const testData = {
                string: 'hello',
                number: 42,
                boolean: true,
                array: [1, 2, 3],
                object: { nested: 'value' },
                null: null
            };

            Object.entries(testData).forEach(([key, value]) => {
                cache.set(`test-${key}`, value);
                expect(cache.get(`test-${key}`)).toEqual(value);
            });
        });
    });

    describe('deletion operations', () => {
        beforeEach(() => {
            cache.set('key1', 'value1');
            cache.set('key2', 'value2');
            cache.set('key3', 'value3');
        });

        it('should delete individual keys', () => {
            cache.del('key1');
            expect(cache.get('key1')).toBeUndefined();
            expect(cache.get('key2')).toBe('value2');
            expect(cache.get('key3')).toBe('value3');
        });

        it('should delete multiple keys', () => {
            cache.del(['key1', 'key2']);
            expect(cache.get('key1')).toBeUndefined();
            expect(cache.get('key2')).toBeUndefined();
            expect(cache.get('key3')).toBe('value3');
        });

        it('should flush all keys', () => {
            cache.flushAll();
            expect(cache.get('key1')).toBeUndefined();
            expect(cache.get('key2')).toBeUndefined();
            expect(cache.get('key3')).toBeUndefined();
        });
    });

    describe('TTL (Time To Live)', () => {
        it('should expire keys after TTL', async () => {
            // Set with 1 second TTL
            cache.set('ttl-key', 'ttl-value', 1);

            // Should exist immediately
            expect(cache.get('ttl-key')).toBe('ttl-value');

            // Wait for expiration
            await new Promise(resolve => setTimeout(resolve, 1100));

            // Should be expired
            expect(cache.get('ttl-key')).toBeUndefined();
        });

        it('should get TTL for a key', () => {
            cache.set('ttl-test', 'value', 10);
            const ttl = cache.getTtl('ttl-test');
            expect(ttl).toBeGreaterThan(0);
            // TTL returns timestamp, so check if it's reasonable
            expect(ttl).toBeLessThan(Date.now() + 15000);
        });
    });

    describe('key operations', () => {
        beforeEach(() => {
            cache.set('prefix:key1', 'value1');
            cache.set('prefix:key2', 'value2');
            cache.set('other:key3', 'value3');
        });

        it('should list all keys', () => {
            const keys = cache.keys();
            expect(keys).toContain('prefix:key1');
            expect(keys).toContain('prefix:key2');
            expect(keys).toContain('other:key3');
            expect(keys).toHaveLength(3);
        });

        it('should check if key exists', () => {
            expect(cache.has('prefix:key1')).toBe(true);
            expect(cache.has('non-existent')).toBe(false);
        });
    });

    describe('statistics', () => {
        it('should provide cache statistics', () => {
            cache.set('stat-key1', 'value1');
            cache.set('stat-key2', 'value2');
            cache.get('stat-key1'); // Hit
            cache.get('non-existent'); // Miss

            const stats = cache.getStats();
            expect(stats.keys).toBe(2);
            expect(stats.hits).toBeGreaterThanOrEqual(1);
            expect(stats.misses).toBeGreaterThanOrEqual(1);
        });
    });

    describe('edge cases', () => {
                it('should handle undefined and null values', () => {
            cache.set('null-key', null);
            
            // Note: node-cache converts undefined to null
            expect(cache.get('null-key')).toBeNull();
            expect(cache.get('non-existent-key')).toBeUndefined();
        });

        it('should handle empty strings and zero values', () => {
            cache.set('empty-string', '');
            cache.set('zero', 0);
            cache.set('false', false);

            expect(cache.get('empty-string')).toBe('');
            expect(cache.get('zero')).toBe(0);
            expect(cache.get('false')).toBe(false);
        });

        it('should handle large objects', () => {
            const largeObject = {
                data: new Array(1000).fill(0).map((_, i) => ({ id: i, value: `item-${i}` }))
            };

            cache.set('large-object', largeObject);
            const retrieved = cache.get('large-object');

            expect(retrieved.data).toHaveLength(1000);
            expect(retrieved.data[0]).toEqual({ id: 0, value: 'item-0' });
            expect(retrieved.data[999]).toEqual({ id: 999, value: 'item-999' });
        });
    });
});
