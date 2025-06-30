# Testing Guide for Ethix Package Manager

This document provides comprehensive information about the testing strategy,
setup, and execution for the Ethix package manager project.

## Overview

The Ethix project uses a comprehensive testing strategy that covers:

- **Unit Tests**: Individual component testing
- **Integration Tests**: API endpoint testing
- **End-to-End Tests**: Complete workflow testing
- **Frontend Tests**: Browser/DOM testing
- **Performance Tests**: Load and benchmark testing
- **Code Quality**: Linting and formatting checks

## Technology Stack

- **Test Runner**: Bun's built-in test runner
- **Assertion Library**: Bun's built-in expect
- **HTTP Testing**: SuperTest
- **DOM Testing**: Happy-DOM
- **Mocking**: Bun's built-in mock functions
- **Code Quality**: ESLint + Prettier

## Project Structure

```
tests/
├── setup.test.js           # Global test setup and helpers
├── unit/                   # Unit tests
│   ├── package-repository.test.js
│   ├── cache.test.js
│   └── middleware.test.js
├── integration/            # Integration tests
│   └── api.test.js
├── e2e/                   # End-to-end tests
│   └── application.test.js
├── frontend/              # Frontend tests
│   └── terminal.test.js
└── performance/           # Performance tests
    └── benchmark.test.js
```

## Running Tests

### Quick Start

```bash
# Run all tests
bun test

# Run comprehensive test suite
bun run test:all

# Run with coverage
bun run test:all:coverage
```

### Individual Test Suites

```bash
# Unit tests only
bun run test:unit

# Integration tests only
bun run test:integration

# End-to-end tests only
bun run test:e2e

# Frontend tests only
bun run test:frontend

# Performance tests only
bun run test:performance
```

### Development Workflow

```bash
# Watch mode for development
bun test --watch

# Run tests with coverage
bun test --coverage

# Lint and format check
bun run lint
bun run format:check

# Fix linting and formatting issues
bun run lint:fix
bun run format
```

## Test Categories

### 1. Unit Tests (`tests/unit/`)

Test individual components in isolation:

- **PackageRepository**: File system operations, package management
- **Cache**: Caching functionality and TTL behavior
- **Middleware**: Error handling and async wrapper functions

**Key Features Tested:**

- Package CRUD operations
- Cache hit/miss scenarios
- Error handling and edge cases
- File system interactions

### 2. Integration Tests (`tests/integration/`)

Test API endpoints and component interactions:

- **API Routes**: All REST endpoints
- **Request/Response**: HTTP status codes and payloads
- **Cache Integration**: Cache behavior with API operations
- **Error Responses**: Proper error handling

**Key Features Tested:**

- GET /api/packages
- POST /api/packages
- DELETE /api/packages/:name
- GET /api/search-packages
- Rate limiting
- Validation

### 3. End-to-End Tests (`tests/e2e/`)

Test complete application workflows:

- **Package Lifecycle**: Create, read, update, delete workflows
- **Multi-Package Scenarios**: Complex package relationships
- **Error Handling**: Graceful error recovery
- **Performance**: Load testing and concurrent operations

**Key Features Tested:**

- Complete package management workflow
- Version conflict handling
- Concurrent operations
- Large dataset handling

### 4. Frontend Tests (`tests/frontend/`)

Test browser-side functionality:

- **Terminal Interface**: Command processing and display
- **File System Operations**: Virtual file system
- **API Integration**: Frontend-backend communication
- **UI Interactions**: Keyboard navigation and themes

**Key Features Tested:**

- Terminal initialization
- Command parsing and execution
- Autocomplete functionality
- Error handling in UI

### 5. Performance Tests (`tests/performance/`)

Test application performance and scalability:

- **Response Times**: API endpoint performance
- **Memory Usage**: Memory consumption patterns
- **Cache Effectiveness**: Cache performance impact
- **Stress Testing**: High-load scenarios

**Key Metrics:**

- Response times under 100ms for most operations
- Memory usage stays reasonable with large datasets
- Cache provides significant speedup
- 95%+ success rate under load

## Configuration

### Bun Configuration (`bunfig.toml`)

```toml
[test]
preload = ["./tests/setup.test.js"]
coverage = true
timeout = 30000
testPathPattern = ["tests/**/*.test.js"]
coverageThreshold = 80
```

### ESLint Configuration (`.eslintrc.js`)

- Modern ES2022+ syntax support
- Node.js and Bun environment
- Prettier integration
- Test-specific overrides

### Prettier Configuration (`.prettierrc`)

- Consistent code formatting
- 4-space indentation
- Single quotes
- 100 character line width

## Test Helpers and Utilities

### Global Setup (`tests/setup.test.js`)

Provides:

- DOM environment setup
- Test directory management
- Mock package creation helpers
- Cleanup utilities

### Test Helpers

```javascript
import { testHelpers } from '../setup.test.js';

// Create mock package
const pkg = testHelpers.createMockPackage('test-pkg', '1.0.0');

// Wait utility
await testHelpers.waitFor(1000);

// Create temporary files
const filePath = await testHelpers.createTempFile('test.json', '{}');
```

## Coverage Requirements

- **Minimum Coverage**: 80% overall
- **Critical Components**: 90%+ coverage required
    - PackageRepository
    - API routes
    - Error handlers

### Coverage Reports

```bash
# Generate HTML coverage report
bun test --coverage

# View coverage in browser
open coverage/index.html
```

## Continuous Integration

The comprehensive test runner (`scripts/test-runner.js`) provides:

- **Parallel Execution**: Tests run concurrently where possible
- **Detailed Reporting**: Color-coded output with timing
- **Flexible Options**: Skip specific test suites
- **Report Generation**: JSON reports for CI integration

### CI Usage

```bash
# Full test suite for CI
bun run test:all --coverage

# Skip performance tests for faster CI
bun run scripts/test-runner.js --skip-performance

# Generate reports
bun run test:all --coverage
```

## Best Practices

### Writing Tests

1. **Descriptive Names**: Use clear, descriptive test names
2. **Arrange-Act-Assert**: Follow the AAA pattern
3. **Isolation**: Each test should be independent
4. **Cleanup**: Always clean up test data
5. **Edge Cases**: Test boundary conditions and error scenarios

### Test Organization

1. **Group Related Tests**: Use `describe` blocks effectively
2. **Setup/Teardown**: Use `beforeEach`/`afterEach` for consistency
3. **Mock External Dependencies**: Isolate units under test
4. **Test Data**: Use factories for consistent test data

### Performance Considerations

1. **Parallel Execution**: Tests run concurrently by default
2. **Resource Cleanup**: Clean up files and connections
3. **Test Data Size**: Keep test datasets reasonable
4. **Timeout Management**: Set appropriate timeouts

## Debugging Tests

### Common Issues

1. **Port Conflicts**: Tests use different ports/directories
2. **Async Timing**: Use proper async/await patterns
3. **File System**: Ensure proper cleanup of test files
4. **Cache State**: Clear cache between tests

### Debug Commands

```bash
# Run single test file
bun test tests/unit/cache.test.js

# Verbose output
bun test --verbose

# Debug mode
bun test --inspect
```

## Troubleshooting

### Test Failures

1. **Check Dependencies**: Ensure all packages are installed
2. **File Permissions**: Verify write permissions for test directories
3. **Port Availability**: Ensure test ports are available
4. **Environment**: Check NODE_ENV and other environment variables

### Performance Issues

1. **Memory Leaks**: Monitor memory usage during tests
2. **File Handles**: Ensure proper cleanup of file operations
3. **Concurrent Limits**: Adjust concurrency for system capabilities

## Contributing

When adding new features:

1. **Write Tests First**: Follow TDD principles
2. **Cover Edge Cases**: Test error conditions and boundaries
3. **Update Documentation**: Keep this guide current
4. **Run Full Suite**: Ensure all tests pass before submitting

### Test Coverage Goals

- New features: 100% test coverage
- Bug fixes: Add regression tests
- Refactoring: Maintain existing coverage

## Reporting Issues

When reporting test-related issues:

1. **Include Test Output**: Provide full error messages
2. **Environment Details**: OS, Bun version, etc.
3. **Reproduction Steps**: Clear steps to reproduce
4. **Expected vs Actual**: What should happen vs what does happen

## Resources

- [Bun Test Documentation](https://bun.sh/docs/cli/test)
- [SuperTest Documentation](https://github.com/ladjs/supertest)
- [Happy-DOM Documentation](https://github.com/capricorn86/happy-dom)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
