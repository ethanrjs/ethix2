import { beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
import { Window } from 'happy-dom';
import fs from 'fs/promises';
import path from 'path';

// Global test setup
beforeAll(async () => {
    // Setup DOM environment for frontend tests
    global.window = new Window();
    global.document = global.window.document;
    global.navigator = global.window.navigator;

    // Create test directories
    await fs.mkdir('./test-packages', { recursive: true });
    await fs.mkdir('./test-temp', { recursive: true });
});

afterAll(async () => {
    // Cleanup test directories
    try {
        await fs.rm('./test-packages', { recursive: true, force: true });
        await fs.rm('./test-temp', { recursive: true, force: true });
    } catch (error) {
        // Ignore cleanup errors
    }
});

beforeEach(() => {
    // Reset environment variables
    process.env.NODE_ENV = 'test';
});

afterEach(() => {
    // Clean up after each test
    delete process.env.TEST_PORT;
});

export const testHelpers = {
    createMockPackage: (name = 'test-package', version = '1.0.0') => ({
        name: `${name}@${version}`,
        version,
        description: `Test package ${name}`,
        keywords: ['test', 'mock'],
        author: 'Test Author',
        license: 'MIT'
    }),

    waitFor: ms => new Promise(resolve => setTimeout(resolve, ms)),

    createTempFile: async (filename, content) => {
        const filePath = path.join('./test-temp', filename);
        await fs.writeFile(filePath, content);
        return filePath;
    }
};
