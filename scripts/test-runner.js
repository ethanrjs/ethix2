#!/usr/bin/env bun

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

class TestRunner {
    constructor() {
        this.results = {
            unit: null,
            integration: null,
            e2e: null,
            frontend: null,
            performance: null,
            lint: null,
            format: null
        };
        this.startTime = Date.now();
    }

    log(message, color = 'reset') {
        console.log(`${colors[color]}${message}${colors.reset}`);
    }

    async runCommand(command, args = [], options = {}) {
        return new Promise((resolve, reject) => {
            const proc = spawn(command, args, {
                stdio: 'pipe',
                shell: true,
                ...options
            });

            let stdout = '';
            let stderr = '';

            proc.stdout?.on('data', data => {
                stdout += data.toString();
            });

            proc.stderr?.on('data', data => {
                stderr += data.toString();
            });

            proc.on('close', code => {
                resolve({
                    code,
                    stdout,
                    stderr,
                    success: code === 0
                });
            });

            proc.on('error', error => {
                reject(error);
            });
        });
    }

    async ensureTestDirectories() {
        const testDirs = [
            'tests/unit',
            'tests/integration',
            'tests/e2e',
            'tests/frontend',
            'tests/performance'
        ];

        for (const dir of testDirs) {
            try {
                await fs.access(dir);
            } catch {
                await fs.mkdir(dir, { recursive: true });
                this.log(`Created test directory: ${dir}`, 'yellow');
            }
        }
    }

    async runLinting() {
        this.log('\n🔍 Running ESLint...', 'cyan');
        const result = await this.runCommand('bun', ['run', 'lint']);

        if (result.success) {
            this.log('✅ Linting passed', 'green');
        } else {
            this.log('❌ Linting failed', 'red');
            this.log(result.stdout, 'red');
            this.log(result.stderr, 'red');
        }

        this.results.lint = result;
        return result;
    }

    async runFormatCheck() {
        this.log('\n📐 Checking code formatting...', 'cyan');
        const result = await this.runCommand('bun', ['run', 'format:check']);

        if (result.success) {
            this.log('✅ Code formatting is correct', 'green');
        } else {
            this.log('❌ Code formatting issues found', 'red');
            this.log(result.stdout, 'red');
        }

        this.results.format = result;
        return result;
    }

    async runUnitTests() {
        this.log('\n🧪 Running unit tests...', 'cyan');
        const result = await this.runCommand('bun', ['test', 'tests/unit/']);

        if (result.success) {
            this.log('✅ Unit tests passed', 'green');
        } else {
            this.log('❌ Unit tests failed', 'red');
        }

        this.log(result.stdout);
        if (result.stderr) {
            this.log(result.stderr, 'yellow');
        }

        this.results.unit = result;
        return result;
    }

    async runIntegrationTests() {
        this.log('\n🔗 Running integration tests...', 'cyan');
        const result = await this.runCommand('bun', ['test', 'tests/integration/']);

        if (result.success) {
            this.log('✅ Integration tests passed', 'green');
        } else {
            this.log('❌ Integration tests failed', 'red');
        }

        this.log(result.stdout);
        if (result.stderr) {
            this.log(result.stderr, 'yellow');
        }

        this.results.integration = result;
        return result;
    }

    async runE2ETests() {
        this.log('\n🎭 Running end-to-end tests...', 'cyan');
        const result = await this.runCommand('bun', ['test', 'tests/e2e/']);

        if (result.success) {
            this.log('✅ E2E tests passed', 'green');
        } else {
            this.log('❌ E2E tests failed', 'red');
        }

        this.log(result.stdout);
        if (result.stderr) {
            this.log(result.stderr, 'yellow');
        }

        this.results.e2e = result;
        return result;
    }

    async runFrontendTests() {
        this.log('\n🖥️  Running frontend tests...', 'cyan');
        const result = await this.runCommand('bun', ['test', 'tests/frontend/']);

        if (result.success) {
            this.log('✅ Frontend tests passed', 'green');
        } else {
            this.log('❌ Frontend tests failed', 'red');
        }

        this.log(result.stdout);
        if (result.stderr) {
            this.log(result.stderr, 'yellow');
        }

        this.results.frontend = result;
        return result;
    }

    async runPerformanceTests() {
        this.log('\n⚡ Running performance tests...', 'cyan');
        const result = await this.runCommand('bun', ['test', 'tests/performance/']);

        if (result.success) {
            this.log('✅ Performance tests passed', 'green');
        } else {
            this.log('❌ Performance tests failed', 'red');
        }

        this.log(result.stdout);
        if (result.stderr) {
            this.log(result.stderr, 'yellow');
        }

        this.results.performance = result;
        return result;
    }

    async runCoverageReport() {
        this.log('\n📊 Generating coverage report...', 'cyan');
        const result = await this.runCommand('bun', ['test', '--coverage']);

        if (result.success) {
            this.log('✅ Coverage report generated', 'green');
        } else {
            this.log('❌ Coverage report failed', 'red');
        }

        this.log(result.stdout);
        return result;
    }

    async generateSummaryReport() {
        const endTime = Date.now();
        const totalTime = endTime - this.startTime;

        this.log('\n' + '='.repeat(60), 'bright');
        this.log('📋 TEST SUMMARY REPORT', 'bright');
        this.log('='.repeat(60), 'bright');

        const testSuites = [
            { name: 'Linting', result: this.results.lint, icon: '🔍' },
            { name: 'Formatting', result: this.results.format, icon: '📐' },
            { name: 'Unit Tests', result: this.results.unit, icon: '🧪' },
            { name: 'Integration Tests', result: this.results.integration, icon: '🔗' },
            { name: 'E2E Tests', result: this.results.e2e, icon: '🎭' },
            { name: 'Frontend Tests', result: this.results.frontend, icon: '🖥️' },
            { name: 'Performance Tests', result: this.results.performance, icon: '⚡' }
        ];

        let passedCount = 0;
        let totalCount = 0;

        for (const suite of testSuites) {
            if (suite.result !== null) {
                totalCount++;
                const status = suite.result.success ? '✅ PASS' : '❌ FAIL';
                const color = suite.result.success ? 'green' : 'red';

                if (suite.result.success) {
                    passedCount++;
                }

                this.log(`${suite.icon} ${suite.name.padEnd(20)} ${status}`, color);
            }
        }

        this.log('\n' + '-'.repeat(60), 'bright');
        this.log(
            `📈 Overall: ${passedCount}/${totalCount} test suites passed`,
            passedCount === totalCount ? 'green' : 'red'
        );
        this.log(`⏱️  Total time: ${(totalTime / 1000).toFixed(2)}s`, 'cyan');

        if (passedCount === totalCount) {
            this.log('\n🎉 All tests passed! Ready for deployment.', 'green');
            return true;
        } else {
            this.log('\n⚠️  Some tests failed. Please review and fix.', 'red');
            return false;
        }
    }

    async saveResultsToFile() {
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            results: this.results,
            summary: {
                total: Object.values(this.results).filter(r => r !== null).length,
                passed: Object.values(this.results).filter(r => r?.success).length,
                failed: Object.values(this.results).filter(r => r && !r.success).length
            }
        };

        try {
            await fs.mkdir('test-reports', { recursive: true });
            const filename = `test-reports/test-report-${Date.now()}.json`;
            await fs.writeFile(filename, JSON.stringify(report, null, 2));
            this.log(`\n📄 Test report saved to: ${filename}`, 'cyan');
        } catch (error) {
            this.log(`\n⚠️  Failed to save test report: ${error.message}`, 'yellow');
        }
    }

    async run(options = {}) {
        this.log('🚀 Starting comprehensive test suite...', 'bright');
        this.log(`📅 ${new Date().toLocaleString()}`, 'cyan');

        await this.ensureTestDirectories();

        try {
            // Code quality checks
            if (!options.skipLint) {
                await this.runLinting();
            }

            if (!options.skipFormat) {
                await this.runFormatCheck();
            }

            // Test suites
            if (!options.skipUnit) {
                await this.runUnitTests();
            }

            if (!options.skipIntegration) {
                await this.runIntegrationTests();
            }

            if (!options.skipE2E) {
                await this.runE2ETests();
            }

            if (!options.skipFrontend) {
                await this.runFrontendTests();
            }

            if (!options.skipPerformance) {
                await this.runPerformanceTests();
            }

            // Coverage report
            if (options.coverage) {
                await this.runCoverageReport();
            }

            // Generate reports
            const allPassed = await this.generateSummaryReport();
            await this.saveResultsToFile();

            process.exit(allPassed ? 0 : 1);
        } catch (error) {
            this.log(`\n💥 Fatal error: ${error.message}`, 'red');
            console.error(error);
            process.exit(1);
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    skipLint: args.includes('--skip-lint'),
    skipFormat: args.includes('--skip-format'),
    skipUnit: args.includes('--skip-unit'),
    skipIntegration: args.includes('--skip-integration'),
    skipE2E: args.includes('--skip-e2e'),
    skipFrontend: args.includes('--skip-frontend'),
    skipPerformance: args.includes('--skip-performance'),
    coverage: args.includes('--coverage')
};

// Help text
if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Comprehensive Test Runner for Ethix Package Manager

Usage: bun run scripts/test-runner.js [options]

Options:
  --skip-lint          Skip ESLint checks
  --skip-format        Skip Prettier format checks
  --skip-unit          Skip unit tests
  --skip-integration   Skip integration tests
  --skip-e2e           Skip end-to-end tests
  --skip-frontend      Skip frontend tests
  --skip-performance   Skip performance tests
  --coverage           Generate coverage report
  --help, -h           Show this help message

Examples:
  bun run scripts/test-runner.js                    # Run all tests
  bun run scripts/test-runner.js --coverage         # Run all tests with coverage
  bun run scripts/test-runner.js --skip-performance # Skip performance tests
    `);
    process.exit(0);
}

// Run the test suite
const runner = new TestRunner();
runner.run(options);
