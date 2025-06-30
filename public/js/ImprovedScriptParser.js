import { addOutputLine, processCommand } from './terminal.js';
import { getFileContents, saveFile, createFile } from './fileSystem.js';
import { scriptLogger } from './ScriptLogger.js';

class ImprovedETXScriptParser {
    constructor() {
        this.variables = {};
        this.functions = {};
        this.callStack = [];
        this.breakFlag = false;
        this.continueFlag = false;
        this.returnValue = null;
        this.debugMode = false;
        this.errorHandler = null;
    }

    // Reset parser state
    reset() {
        this.variables = {};
        this.functions = {};
        this.callStack = [];
        this.breakFlag = false;
        this.continueFlag = false;
        this.returnValue = null;
    }

    // Enable/disable debug mode
    setDebugMode(enabled) {
        this.debugMode = enabled;
    }

    // Set custom error handler
    setErrorHandler(handler) {
        this.errorHandler = handler;
    }

    // Main script execution
    async executeScript(scriptContent, context = {}, scriptPath = 'inline') {
        scriptLogger.startScript(scriptPath, scriptContent);
        
        try {
            // Set context variables
            Object.assign(this.variables, context);
            scriptLogger.logParserState(this);
            
            const lines = scriptContent.split('\n');
            await this.executeLines(lines, 0, lines.length - 1);
            
            const result = {
                success: true,
                variables: { ...this.variables },
                returnValue: this.returnValue
            };
            
            scriptLogger.endScript(scriptPath, true, result);
            return result;
        } catch (error) {
            scriptLogger.logError(error, { scriptPath, context });
            this.handleError(`Script execution failed: ${error.message}`, error);
            
            const result = {
                success: false,
                error: error.message,
                variables: { ...this.variables }
            };
            
            scriptLogger.endScript(scriptPath, false, result);
            return result;
        }
    }

    // Execute a range of lines
    async executeLines(lines, startIndex, endIndex) {
        for (let i = startIndex; i <= endIndex && i < lines.length; i++) {
            if (this.breakFlag || this.continueFlag || this.returnValue !== null) {
                break;
            }

            const line = lines[i].trim();
            if (line && !line.startsWith('#')) {
                scriptLogger.logLine(i + 1, line);
                
                if (this.debugMode) {
                    addOutputLine({ text: `[DEBUG] Line ${i + 1}: ${line}`, color: 'cyan' });
                }
                
                try {
                    i = await this.executeLine(line, i, lines);
                } catch (error) {
                    scriptLogger.logError(error, { line: i + 1, content: line });
                    this.handleError(`Error on line ${i + 1}: ${error.message}`, error);
                    throw error;
                }
            }
        }
    }

    // Execute a single line
    async executeLine(line, index, lines) {
        const trimmedLine = line.trim();
        
        // Control flow statements
        if (trimmedLine.startsWith('if ')) {
            return await this.executeIfBlock(index, lines);
        } else if (trimmedLine.startsWith('while ')) {
            return await this.executeWhileLoop(index, lines);
        } else if (trimmedLine.startsWith('for ')) {
            return await this.executeForLoop(index, lines);
        } else if (trimmedLine.startsWith('function ')) {
            return await this.defineFunction(index, lines);
        } else if (trimmedLine.startsWith('return')) {
            this.executeReturn(trimmedLine);
        } else if (trimmedLine === 'break') {
            this.breakFlag = true;
        } else if (trimmedLine === 'continue') {
            this.continueFlag = true;
        } else if (trimmedLine.startsWith('set ')) {
            this.executeSet(trimmedLine);
        } else if (trimmedLine.startsWith('unset ')) {
            this.executeUnset(trimmedLine);
        } else if (trimmedLine.startsWith('import ')) {
            await this.executeImport(trimmedLine);
        } else if (trimmedLine.startsWith('try')) {
            return await this.executeTryBlock(index, lines);
        } else if (this.isFunctionCall(trimmedLine)) {
            await this.executeFunctionCall(trimmedLine);
        } else {
            await this.executeCommand(trimmedLine);
        }
        
        return index;
    }

    // Enhanced if block with elif support
    async executeIfBlock(startIndex, lines) {
        let currentIndex = startIndex;
        let executed = false;
        
        while (currentIndex < lines.length) {
            const line = lines[currentIndex].trim();
            
            if (line.startsWith('if ') || line.startsWith('elif ')) {
                const condition = this.evaluateExpression(line.slice(line.indexOf(' ') + 1));
                const blockEnd = this.findBlockEnd(currentIndex, lines, ['elif', 'else', 'endif']);
                
                if (condition && !executed) {
                    await this.executeLines(lines, currentIndex + 1, blockEnd - 1);
                    executed = true;
                }
                
                currentIndex = blockEnd;
            } else if (line === 'else') {
                const blockEnd = this.findBlockEnd(currentIndex, lines, ['endif']);
                
                if (!executed) {
                    await this.executeLines(lines, currentIndex + 1, blockEnd - 1);
                }
                
                currentIndex = blockEnd;
            } else if (line === 'endif') {
                break;
            } else {
                currentIndex++;
            }
        }
        
        return currentIndex;
    }

    // While loop implementation
    async executeWhileLoop(startIndex, lines) {
        const condition = lines[startIndex].slice(6); // Remove 'while '
        const endIndex = this.findBlockEnd(startIndex, lines, ['endwhile']);
        
        while (this.evaluateExpression(condition)) {
            this.breakFlag = false;
            this.continueFlag = false;
            
            await this.executeLines(lines, startIndex + 1, endIndex - 1);
            
            if (this.breakFlag) {
                this.breakFlag = false;
                break;
            }
            
            if (this.continueFlag) {
                this.continueFlag = false;
                continue;
            }
            
            if (this.returnValue !== null) {
                break;
            }
        }
        
        return endIndex;
    }

    // Enhanced for loop with multiple formats
    async executeForLoop(startIndex, lines) {
        const forLine = lines[startIndex].slice(4); // Remove 'for '
        const endIndex = this.findBlockEnd(startIndex, lines, ['endfor']);
        
        // Parse different for loop formats
        if (forLine.includes(' in ')) {
            // for item in list
            const [variable, listExpr] = forLine.split(' in ');
            const list = this.evaluateExpression(listExpr.trim());
            
            if (Array.isArray(list)) {
                for (const item of list) {
                    this.variables[variable.trim()] = item;
                    this.breakFlag = false;
                    this.continueFlag = false;
                    
                    await this.executeLines(lines, startIndex + 1, endIndex - 1);
                    
                    if (this.breakFlag) {
                        this.breakFlag = false;
                        break;
                    }
                    
                    if (this.continueFlag) {
                        this.continueFlag = false;
                        continue;
                    }
                    
                    if (this.returnValue !== null) {
                        break;
                    }
                }
            }
        } else {
            // Traditional for loop: for var start end [step]
            const parts = forLine.split(' ');
            const variable = parts[0];
            const start = this.evaluateExpression(parts[1]);
            const end = this.evaluateExpression(parts[2]);
            const step = parts[3] ? this.evaluateExpression(parts[3]) : 1;
            
            for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
                this.variables[variable] = i;
                this.breakFlag = false;
                this.continueFlag = false;
                
                await this.executeLines(lines, startIndex + 1, endIndex - 1);
                
                if (this.breakFlag) {
                    this.breakFlag = false;
                    break;
                }
                
                if (this.continueFlag) {
                    this.continueFlag = false;
                    continue;
                }
                
                if (this.returnValue !== null) {
                    break;
                }
            }
        }
        
        return endIndex;
    }

    // Function definition
    async defineFunction(startIndex, lines) {
        const funcLine = lines[startIndex].slice(9); // Remove 'function '
        const [nameAndParams] = funcLine.split(' ');
        const [name, paramsStr] = nameAndParams.includes('(') ? 
            nameAndParams.split('(') : [nameAndParams, ''];
        
        const params = paramsStr ? paramsStr.replace(')', '').split(',').map(p => p.trim()) : [];
        const endIndex = this.findBlockEnd(startIndex, lines, ['endfunction']);
        
        this.functions[name] = {
            params,
            body: lines.slice(startIndex + 1, endIndex),
            startLine: startIndex
        };
        
        return endIndex;
    }

    // Function call execution
    async executeFunctionCall(line) {
        const match = line.match(/(\w+)\s*\((.*)\)/);
        if (!match) return;
        
        const [, funcName, argsStr] = match;
        const args = argsStr ? argsStr.split(',').map(arg => this.evaluateExpression(arg.trim())) : [];
        
        if (this.functions[funcName]) {
            const func = this.functions[funcName];
            const savedVars = { ...this.variables };
            
            // Set parameters
            func.params.forEach((param, index) => {
                this.variables[param] = args[index] || null;
            });
            
            this.callStack.push({ function: funcName, line: 0 });
            
            try {
                await this.executeLines(func.body, 0, func.body.length - 1);
            } finally {
                this.callStack.pop();
                // Restore variables (local scope)
                this.variables = savedVars;
            }
        } else {
            throw new Error(`Function '${funcName}' is not defined`);
        }
    }

    // Try-catch block
    async executeTryBlock(startIndex, lines) {
        const catchIndex = this.findBlockEnd(startIndex, lines, ['catch']);
        const endIndex = this.findBlockEnd(catchIndex, lines, ['endtry']);
        
        try {
            await this.executeLines(lines, startIndex + 1, catchIndex - 1);
        } catch (error) {
            // Set error variable
            this.variables['$error'] = error.message;
            await this.executeLines(lines, catchIndex + 1, endIndex - 1);
        }
        
        return endIndex;
    }

    // Import another script
    async executeImport(line) {
        const filePath = this.replaceVariables(line.slice(7).trim());
        scriptLogger.logImport(filePath, false);
        
        const scriptContent = getFileContents(filePath);
        
        if (scriptContent === null) {
            scriptLogger.logImport(filePath, false);
            throw new Error(`Cannot import file: ${filePath}`);
        }
        
        scriptLogger.logImport(filePath, true);
        
        // Execute imported script in current context
        await this.executeScript(scriptContent, this.variables, filePath);
    }

    // Enhanced set command with expressions and arrays
    executeSet(line) {
        const match = line.match(/set\s+(\w+)(?:\[([^\]]+)\])?\s+(.+)/);
        if (match) {
            const [, variable, index, value] = match;
            const evaluatedValue = this.evaluateExpression(value);
            const oldValue = this.variables[variable];
            
            if (index !== undefined) {
                // Array assignment
                if (!this.variables[variable]) {
                    this.variables[variable] = [];
                }
                const arrayIndex = this.evaluateExpression(index);
                this.variables[variable][arrayIndex] = evaluatedValue;
                scriptLogger.logVariable('set', `${variable}[${arrayIndex}]`, evaluatedValue, oldValue);
            } else {
                this.variables[variable] = evaluatedValue;
                scriptLogger.logVariable('set', variable, evaluatedValue, oldValue);
            }
        }
    }

    // Unset variables
    executeUnset(line) {
        const variable = line.slice(6).trim();
        delete this.variables[variable];
    }

    // Return statement
    executeReturn(line) {
        const value = line.slice(6).trim();
        this.returnValue = value ? this.evaluateExpression(value) : null;
    }

    // Enhanced expression evaluation
    evaluateExpression(expression) {
        try {
            if (typeof expression === 'number') {
                return expression;
            }
            
            if (typeof expression !== 'string') {
                return expression;
            }
            
            // Handle string literals
            if ((expression.startsWith('"') && expression.endsWith('"')) ||
                (expression.startsWith("'") && expression.endsWith("'"))) {
                return expression.slice(1, -1);
            }
            
            // Handle arrays
            if (expression.startsWith('[') && expression.endsWith(']')) {
                const items = expression.slice(1, -1).split(',');
                return items.map(item => this.evaluateExpression(item.trim()));
            }
            
            // Replace variables first
            const replacedExpr = this.replaceVariables(expression);
            
            // Handle simple cases
            if (!isNaN(replacedExpr)) {
                return parseFloat(replacedExpr);
            }
            
            if (replacedExpr === 'true') return true;
            if (replacedExpr === 'false') return false;
            if (replacedExpr === 'null') return null;
            
            // Handle mathematical and logical expressions
            return this.customEval(replacedExpr);
        } catch (error) {
            this.handleError(`Error evaluating expression: ${expression}`, error);
            return null;
        }
    }

    // Enhanced custom evaluation with more operators
    customEval(expression) {
        try {
            const tokens = expression.match(/(\d+\.?\d*|\w+|"[^"]*"|'[^']*'|\+|\-|\*|\/|%|\(|\)|<=|>=|==|!=|<|>|&&|\|\||!|\?|:)/g) || [];
            const output = [];
            const operators = [];
            const precedence = {
                '?': 1, ':': 1,
                '||': 2,
                '&&': 3,
                '==': 4, '!=': 4,
                '<': 5, '>': 5, '<=': 5, '>=': 5,
                '+': 6, '-': 6,
                '*': 7, '/': 7, '%': 7,
                '!': 8
            };

        for (const token of tokens) {
            if (!isNaN(token)) {
                output.push(parseFloat(token));
            } else if (token.startsWith('"') || token.startsWith("'")) {
                output.push(token.slice(1, -1));
            } else if (this.variables.hasOwnProperty(token)) {
                output.push(this.variables[token]);
            } else if (token === '(') {
                operators.push(token);
            } else if (token === ')') {
                while (operators.length && operators[operators.length - 1] !== '(') {
                    output.push(operators.pop());
                }
                operators.pop();
            } else if (token in precedence) {
                while (
                    operators.length &&
                    operators[operators.length - 1] !== '(' &&
                    precedence[operators[operators.length - 1]] >= precedence[token]
                ) {
                    output.push(operators.pop());
                }
                operators.push(token);
            } else {
                output.push(token);
            }
        }

        while (operators.length) {
            output.push(operators.pop());
        }

            return this.evaluatePostfix(output);
        } catch (error) {
            scriptLogger.logError(error, { expression });
            throw new Error(`Expression evaluation failed: ${expression}`);
        }
    }

    // Evaluate postfix expression
    evaluatePostfix(tokens) {
        const stack = [];
        
        for (const token of tokens) {
            if (typeof token === 'number' || typeof token === 'string' || typeof token === 'boolean') {
                stack.push(token);
            } else {
                switch (token) {
                    case '+':
                        const b1 = stack.pop();
                        const a1 = stack.pop();
                        stack.push(a1 + b1);
                        break;
                    case '-':
                        const b2 = stack.pop();
                        const a2 = stack.pop();
                        stack.push(a2 - b2);
                        break;
                    case '*':
                        const b3 = stack.pop();
                        const a3 = stack.pop();
                        stack.push(a3 * b3);
                        break;
                    case '/':
                        const b4 = stack.pop();
                        const a4 = stack.pop();
                        stack.push(a4 / b4);
                        break;
                    case '%':
                        const b5 = stack.pop();
                        const a5 = stack.pop();
                        stack.push(a5 % b5);
                        break;
                    case '<':
                        const b6 = stack.pop();
                        const a6 = stack.pop();
                        stack.push(a6 < b6);
                        break;
                    case '>':
                        const b7 = stack.pop();
                        const a7 = stack.pop();
                        stack.push(a7 > b7);
                        break;
                    case '<=':
                        const b8 = stack.pop();
                        const a8 = stack.pop();
                        stack.push(a8 <= b8);
                        break;
                    case '>=':
                        const b9 = stack.pop();
                        const a9 = stack.pop();
                        stack.push(a9 >= b9);
                        break;
                    case '==':
                        const b10 = stack.pop();
                        const a10 = stack.pop();
                        stack.push(a10 === b10);
                        break;
                    case '!=':
                        const b11 = stack.pop();
                        const a11 = stack.pop();
                        stack.push(a11 !== b11);
                        break;
                    case '&&':
                        const b12 = stack.pop();
                        const a12 = stack.pop();
                        stack.push(a12 && b12);
                        break;
                    case '||':
                        const b13 = stack.pop();
                        const a13 = stack.pop();
                        stack.push(a13 || b13);
                        break;
                    case '!':
                        const a14 = stack.pop();
                        stack.push(!a14);
                        break;
                    default:
                        stack.push(token);
                }
            }
        }

        return stack[0];
    }

    // Enhanced variable replacement with array access
    replaceVariables(str) {
        return str.replace(/\$(\w+)(?:\[([^\]]+)\])?/g, (match, variable, index) => {
            if (this.variables.hasOwnProperty(variable)) {
                const value = this.variables[variable];
                if (index !== undefined && Array.isArray(value)) {
                    const arrayIndex = this.evaluateExpression(index);
                    return value[arrayIndex] || '';
                }
                return value;
            }
            return match;
        });
    }

    // Utility methods
    findBlockEnd(startIndex, lines, endKeywords) {
        let depth = 1;
        let index = startIndex + 1;
        
        const startKeywords = ['if', 'while', 'for', 'function', 'try'];
        
        while (index < lines.length && depth > 0) {
            const line = lines[index].trim();
            
            if (startKeywords.some(keyword => line.startsWith(keyword + ' '))) {
                depth++;
            } else if (endKeywords.includes(line)) {
                depth--;
            }
            
            if (depth === 0) {
                return index;
            }
            
            index++;
        }
        
        return index;
    }

    isFunctionCall(line) {
        return /^\w+\s*\(.*\)$/.test(line.trim());
    }

    async executeCommand(command) {
        const processedCommand = this.replaceVariables(command);
        scriptLogger.logCommand(processedCommand);
        await processCommand(processedCommand, true);
    }

    handleError(message, error) {
        if (this.errorHandler) {
            this.errorHandler(message, error);
        } else {
            addOutputLine({ text: message, color: 'red' });
        }
    }

    // Get current execution context
    getContext() {
        return {
            variables: { ...this.variables },
            functions: Object.keys(this.functions),
            callStack: [...this.callStack]
        };
    }
}

export const improvedScriptParser = new ImprovedETXScriptParser();
export { ImprovedETXScriptParser };