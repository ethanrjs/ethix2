import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandlers.js';
import { asyncHandler } from '../../middleware/asyncHandler.js';

describe('Middleware Tests', () => {
    let mockReq, mockRes, mockNext;

    beforeEach(() => {
        mockReq = {
            originalUrl: '/test-url',
            method: 'GET',
            headers: {}
        };

        mockRes = {
            status: mock(function (code) {
                this.statusCode = code;
                return this;
            }),
            json: mock(function (data) {
                this.body = data;
                return this;
            }),
            statusCode: 200
        };

        mockNext = mock(() => {});
    });

    describe('errorHandler', () => {
        it('should handle errors with default 500 status', () => {
            const error = new Error('Test error');

            errorHandler(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Test error',
                stack: expect.any(String)
            });
        });

        it('should use existing status code if not 200', () => {
            const error = new Error('Not found error');
            mockRes.statusCode = 404;

            errorHandler(error, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Not found error',
                stack: expect.any(String)
            });
        });

        it('should hide stack trace in production', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'production';

            const error = new Error('Production error');

            errorHandler(error, mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Production error',
                stack: '🥞'
            });

            process.env.NODE_ENV = originalEnv;
        });

        it('should handle errors without message', () => {
            const error = {};

            errorHandler(error, mockReq, mockRes, mockNext);

            expect(mockRes.json).toHaveBeenCalledWith({
                message: undefined,
                stack: expect.any(String)
            });
        });
    });

    describe('notFoundHandler', () => {
        it('should create 404 error and call next', () => {
            notFoundHandler(mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(404);
            expect(mockNext).toHaveBeenCalledWith(expect.any(Error));

            const error = mockNext.mock.calls[0][0];
            expect(error.message).toBe('Not Found - /test-url');
        });

        it('should include original URL in error message', () => {
            mockReq.originalUrl = '/api/packages/non-existent';

            notFoundHandler(mockReq, mockRes, mockNext);

            const error = mockNext.mock.calls[0][0];
            expect(error.message).toBe('Not Found - /api/packages/non-existent');
        });
    });

    describe('asyncHandler', () => {
        it('should handle successful async operations', async () => {
            const asyncFn = mock(async (req, res, next) => {
                res.json({ success: true });
            });

            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);

            expect(asyncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).not.toHaveBeenCalled();
        });

        it('should catch and forward async errors', async () => {
            const error = new Error('Async operation failed');
            const asyncFn = mock(async () => {
                throw error;
            });

            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it('should handle rejected promises', async () => {
            const error = new Error('Promise rejected');
            const asyncFn = mock(() => Promise.reject(error));

            const wrappedFn = asyncHandler(asyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it('should handle synchronous errors', async () => {
            const error = new Error('Sync error');
            const syncFn = mock(() => {
                throw error;
            });

            const wrappedFn = asyncHandler(syncFn);
            await wrappedFn(mockReq, mockRes, mockNext);

            expect(mockNext).toHaveBeenCalledWith(error);
        });

        it('should preserve function context', async () => {
            let capturedThis;
            const contextFn = mock(function () {
                capturedThis = this;
                return Promise.resolve();
            });

            const context = { test: 'context' };
            const wrappedFn = asyncHandler(contextFn);
            await wrappedFn.call(context, mockReq, mockRes, mockNext);

            expect(capturedThis).toBe(context);
        });

        it('should handle functions that return non-promises', async () => {
            const syncFn = mock((req, res) => {
                res.json({ data: 'sync response' });
            });

            const wrappedFn = asyncHandler(syncFn);
            await wrappedFn(mockReq, mockRes, mockNext);

            expect(syncFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });

    describe('Middleware Integration', () => {
        it('should work together in error flow', async () => {
            // Simulate the middleware chain
            const error = new Error('Integration test error');

            // First, notFoundHandler creates an error
            notFoundHandler(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();

            // Then errorHandler processes it
            errorHandler(error, mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalled();
        });

        it('should handle async middleware errors in chain', async () => {
            const asyncError = new Error('Async middleware error');
            const faultyAsyncFn = mock(async () => {
                throw asyncError;
            });

            // Wrap with asyncHandler
            const wrappedFn = asyncHandler(faultyAsyncFn);
            await wrappedFn(mockReq, mockRes, mockNext);

            // Should call next with error
            expect(mockNext).toHaveBeenCalledWith(asyncError);

            // Then errorHandler would process it
            const capturedError = mockNext.mock.calls[0][0];
            errorHandler(capturedError, mockReq, mockRes, mockNext);

            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                message: 'Async middleware error',
                stack: expect.any(String)
            });
        });
    });
});
