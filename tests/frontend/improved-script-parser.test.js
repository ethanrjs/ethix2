import { ImprovedETXScriptParser } from '../../public/js/ImprovedScriptParser.js';

// Mock dependencies
const mockAddOutputLine = jest.fn();
const mockProcessCommand = jest.fn();
const mockGetFileContents = jest.fn();

jest.mock('../../public/js/terminal.js', () => ({
    addOutputLine: mockAddOutputLine,
    processCommand: mockProcessCommand
}));

jest.mock('../../public/js/fileSystem.js', () => ({
    getFileContents: mockGetFileContents,
    saveFile: jest.fn(),
    createFile: jest.fn()
}));

describe('ImprovedETXScriptParser', () => {
    let parser;

    beforeEach(() => {
        parser = new ImprovedETXScriptParser();
        mockAddOutputLine.mockClear();
        mockProcessCommand.mockClear();
        mockGetFileContents.mockClear();
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(parser.variables).toEqual({});
            expect(parser.functions).toEqual({});
            expect(parser.callStack).toEqual([]);
            expect(parser.breakFlag).toBe(false);
            expect(parser.continueFlag).toBe(false);
            expect(parser.returnValue).toBeNull();
            expect(parser.debugMode).toBe(false);
            expect(parser.errorHandler).toBeNull();
        });

        test('should reset parser state correctly', () => {
            parser.variables = { test: 'value' };
            parser.functions = { testFunc: {} };
            parser.callStack = [{ function: 'test', line: 1 }];
            parser.breakFlag = true;
            parser.continueFlag = true;
            parser.returnValue = 'test';

            parser.reset();

            expect(parser.variables).toEqual({});
            expect(parser.functions).toEqual({});
            expect(parser.callStack).toEqual([]);
            expect(parser.breakFlag).toBe(false);
            expect(parser.continueFlag).toBe(false);
            expect(parser.returnValue).toBeNull();
        });
    });

    describe('Configuration', () => {
        test('should set debug mode correctly', () => {
            parser.setDebugMode(true);
            expect(parser.debugMode).toBe(true);

            parser.setDebugMode(false);
            expect(parser.debugMode).toBe(false);
        });

        test('should set error handler correctly', () => {
            const handler = jest.fn();
            parser.setErrorHandler(handler);
            expect(parser.errorHandler).toBe(handler);
        });
    });

    describe('Variable Operations', () => {
        test('should set and get variables correctly', () => {
            parser.executeSet('set myvar 42');
            expect(parser.variables.myvar).toBe(42);

            parser.executeSet('set name "John"');
            expect(parser.variables.name).toBe('John');
        });

        test('should handle array variables', () => {
            parser.executeSet('set arr[0] "hello"');
            expect(parser.variables.arr[0]).toBe('hello');

            parser.executeSet('set arr[1] "world"');
            expect(parser.variables.arr[1]).toBe('world');
        });

        test('should unset variables correctly', () => {
            parser.variables.testVar = 'value';
            parser.executeUnset('unset testVar');
            expect(parser.variables.testVar).toBeUndefined();
        });

        test('should replace variables in strings', () => {
            parser.variables.name = 'John';
            parser.variables.age = 30;
            
            const result = parser.replaceVariables('Hello $name, you are $age years old');
            expect(result).toBe('Hello John, you are 30 years old');
        });

        test('should replace array variables', () => {
            parser.variables.arr = ['first', 'second', 'third'];
            
            const result = parser.replaceVariables('Item: $arr[1]');
            expect(result).toBe('Item: second');
        });
    });

    describe('Expression Evaluation', () => {
        test('should evaluate numeric expressions', () => {
            expect(parser.evaluateExpression('5 + 3')).toBe(8);
            expect(parser.evaluateExpression('10 - 4')).toBe(6);
            expect(parser.evaluateExpression('6 * 7')).toBe(42);
            expect(parser.evaluateExpression('15 / 3')).toBe(5);
            expect(parser.evaluateExpression('17 % 5')).toBe(2);
        });

        test('should evaluate comparison expressions', () => {
            expect(parser.evaluateExpression('5 > 3')).toBe(true);
            expect(parser.evaluateExpression('5 < 3')).toBe(false);
            expect(parser.evaluateExpression('5 >= 5')).toBe(true);
            expect(parser.evaluateExpression('5 <= 4')).toBe(false);
            expect(parser.evaluateExpression('5 == 5')).toBe(true);
            expect(parser.evaluateExpression('5 != 3')).toBe(true);
        });

        test('should evaluate logical expressions', () => {
            expect(parser.evaluateExpression('true && true')).toBe(true);
            expect(parser.evaluateExpression('true && false')).toBe(false);
            expect(parser.evaluateExpression('true || false')).toBe(true);
            expect(parser.evaluateExpression('false || false')).toBe(false);
            expect(parser.evaluateExpression('!true')).toBe(false);
            expect(parser.evaluateExpression('!false')).toBe(true);
        });

        test('should handle string literals', () => {
            expect(parser.evaluateExpression('"hello"')).toBe('hello');
            expect(parser.evaluateExpression("'world'")).toBe('world');
        });

        test('should handle boolean literals', () => {
            expect(parser.evaluateExpression('true')).toBe(true);
            expect(parser.evaluateExpression('false')).toBe(false);
            expect(parser.evaluateExpression('null')).toBe(null);
        });

        test('should handle array literals', () => {
            const result = parser.evaluateExpression('[1, 2, 3]');
            expect(result).toEqual([1, 2, 3]);
        });

        test('should evaluate expressions with variables', () => {
            parser.variables.x = 10;
            parser.variables.y = 5;
            
            expect(parser.evaluateExpression('$x + $y')).toBe(15);
            expect(parser.evaluateExpression('$x > $y')).toBe(true);
        });
    });

    describe('Control Flow - If Statements', () => {
        test('should execute simple if statement', async () => {
            const script = `
                set x 5
                if $x > 3
                    echo "x is greater than 3"
                endif
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "x is greater than 3"', true);
        });

        test('should execute if-else statement', async () => {
            const script = `
                set x 2
                if $x > 3
                    echo "greater"
                else
                    echo "not greater"
                endif
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "not greater"', true);
        });

        test('should execute if-elif-else statement', async () => {
            const script = `
                set x 5
                if $x < 3
                    echo "less than 3"
                elif $x == 5
                    echo "equals 5"
                else
                    echo "other"
                endif
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "equals 5"', true);
        });
    });

    describe('Control Flow - Loops', () => {
        test('should execute for loop', async () => {
            const script = `
                for i 1 3
                    echo $i
                endfor
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 1', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 2', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 3', true);
        });

        test('should execute for-in loop with array', async () => {
            const script = `
                set items ["apple", "banana", "cherry"]
                for item in $items
                    echo $item
                endfor
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo apple', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo banana', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo cherry', true);
        });

        test('should execute while loop', async () => {
            const script = `
                set counter 1
                while $counter <= 3
                    echo $counter
                    set counter $counter + 1
                endwhile
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 1', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 2', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 3', true);
        });

        test('should handle break in loop', async () => {
            const script = `
                for i 1 5
                    if $i == 3
                        break
                    endif
                    echo $i
                endfor
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 1', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 2', true);
            expect(mockProcessCommand).not.toHaveBeenCalledWith('echo 3', true);
        });

        test('should handle continue in loop', async () => {
            const script = `
                for i 1 3
                    if $i == 2
                        continue
                    endif
                    echo $i
                endfor
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 1', true);
            expect(mockProcessCommand).not.toHaveBeenCalledWith('echo 2', true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 3', true);
        });
    });

    describe('Functions', () => {
        test('should define and call functions', async () => {
            const script = `
                function greet(name)
                    echo "Hello $name"
                endfunction
                
                greet("World")
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "Hello World"', true);
        });

        test('should handle function parameters correctly', async () => {
            const script = `
                function add(a, b)
                    set result $a + $b
                    echo $result
                endfunction
                
                add(5, 3)
            `;
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo 8', true);
        });

        test('should handle function return values', async () => {
            const script = `
                function multiply(a, b)
                    return $a * $b
                endfunction
                
                multiply(4, 5)
            `;
            
            const result = await parser.executeScript(script);
            expect(result.returnValue).toBe(20);
        });

        test('should handle local variable scope', async () => {
            parser.variables.globalVar = 'global';
            
            const script = `
                function testScope(param)
                    set localVar "local"
                    set globalVar "modified"
                    echo $param
                endfunction
                
                testScope("test")
                echo $globalVar
            `;
            
            await parser.executeScript(script);
            expect(parser.variables.globalVar).toBe('global'); // Should be restored
            expect(parser.variables.localVar).toBeUndefined(); // Should not exist
        });
    });

    describe('Error Handling', () => {
        test('should handle try-catch blocks', async () => {
            const script = `
                try
                    nonexistentCommand
                catch
                    echo "Error caught: $error"
                endtry
            `;
            
            // Mock processCommand to throw an error
            mockProcessCommand.mockRejectedValueOnce(new Error('Command not found'));
            
            await parser.executeScript(script);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "Error caught: Command not found"', true);
        });

        test('should handle syntax errors gracefully', async () => {
            const script = 'invalid syntax here';
            
            const result = await parser.executeScript(script);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should use custom error handler when set', async () => {
            const customHandler = jest.fn();
            parser.setErrorHandler(customHandler);
            
            const script = 'set invalid syntax';
            await parser.executeScript(script);
            
            expect(customHandler).toHaveBeenCalled();
        });
    });

    describe('Import Functionality', () => {
        test('should import and execute external scripts', async () => {
            const importedScript = 'echo "Imported script executed"';
            mockGetFileContents.mockReturnValue(importedScript);
            
            const script = 'import "/path/to/script.etx"';
            
            await parser.executeScript(script);
            expect(mockGetFileContents).toHaveBeenCalledWith('/path/to/script.etx');
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "Imported script executed"', true);
        });

        test('should handle import errors', async () => {
            mockGetFileContents.mockReturnValue(null);
            
            const script = 'import "/nonexistent/script.etx"';
            
            const result = await parser.executeScript(script);
            expect(result.success).toBe(false);
            expect(result.error).toContain('Cannot import file');
        });
    });

    describe('Debug Mode', () => {
        test('should output debug information when enabled', async () => {
            parser.setDebugMode(true);
            
            const script = 'echo "test"';
            await parser.executeScript(script);
            
            expect(mockAddOutputLine).toHaveBeenCalledWith(
                expect.objectContaining({
                    text: expect.stringContaining('[DEBUG]'),
                    color: 'cyan'
                })
            );
        });

        test('should not output debug information when disabled', async () => {
            parser.setDebugMode(false);
            
            const script = 'echo "test"';
            await parser.executeScript(script);
            
            const debugCalls = mockAddOutputLine.mock.calls.filter(call => 
                call[0].text && call[0].text.includes('[DEBUG]')
            );
            expect(debugCalls).toHaveLength(0);
        });
    });

    describe('Context and State', () => {
        test('should provide execution context', () => {
            parser.variables.testVar = 'value';
            parser.functions.testFunc = { params: [], body: [] };
            parser.callStack.push({ function: 'test', line: 1 });
            
            const context = parser.getContext();
            
            expect(context.variables.testVar).toBe('value');
            expect(context.functions).toContain('testFunc');
            expect(context.callStack).toHaveLength(1);
        });

        test('should execute with initial context', async () => {
            const initialContext = { username: 'testuser', version: '1.0' };
            
            const script = 'echo "User: $username, Version: $version"';
            
            await parser.executeScript(script, initialContext);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "User: testuser, Version: 1.0"', true);
        });

        test('should return execution results', async () => {
            const script = `
                set result "success"
                return $result
            `;
            
            const executionResult = await parser.executeScript(script);
            
            expect(executionResult.success).toBe(true);
            expect(executionResult.returnValue).toBe('success');
            expect(executionResult.variables.result).toBe('success');
        });
    });

    describe('Utility Functions', () => {
        test('should find block end correctly', () => {
            const lines = [
                'if condition',
                '    echo "inside if"',
                '    if nested',
                '        echo "nested"',
                '    endif',
                'endif'
            ];
            
            const endIndex = parser.findBlockEnd(0, lines, ['endif']);
            expect(endIndex).toBe(5);
        });

        test('should identify function calls', () => {
            expect(parser.isFunctionCall('myFunction()')).toBe(true);
            expect(parser.isFunctionCall('test(arg1, arg2)')).toBe(true);
            expect(parser.isFunctionCall('echo "hello"')).toBe(false);
            expect(parser.isFunctionCall('set var value')).toBe(false);
        });
    });

    describe('Complex Scripts', () => {
        test('should execute complex script with multiple features', async () => {
            const script = `
                # Complex ETX script test
                set numbers [1, 2, 3, 4, 5]
                set sum 0
                
                function calculateSum(arr)
                    set total 0
                    for item in $arr
                        set total $total + $item
                    endfor
                    return $total
                endfunction
                
                set result calculateSum($numbers)
                
                if $result > 10
                    echo "Sum is greater than 10: $result"
                else
                    echo "Sum is 10 or less: $result"
                endif
            `;
            
            const result = await parser.executeScript(script);
            
            expect(result.success).toBe(true);
            expect(mockProcessCommand).toHaveBeenCalledWith('echo "Sum is greater than 10: 15"', true);
        });
    });
});