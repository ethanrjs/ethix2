class ScriptLogger {
    constructor() {
        this.enabled = true;
        this.logLevel = 'info'; // 'debug', 'info', 'warn', 'error'
        this.sessionId = this.generateSessionId();
        this.scriptStack = [];
        this.startTime = null;
    }

    generateSessionId() {
        return 'script_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    enable() {
        this.enabled = true;
        this.log('info', 'Script logging enabled');
    }

    disable() {
        this.enabled = false;
        console.log('[ScriptLogger] Script logging disabled');
    }

    setLogLevel(level) {
        this.logLevel = level;
        this.log('info', `Log level set to: ${level}`);
    }

    log(level, message, data = null) {
        if (!this.enabled) return;

        const levels = { debug: 0, info: 1, warn: 2, error: 3 };
        if (levels[level] < levels[this.logLevel]) return;

        const timestamp = new Date().toISOString();
        const prefix = `[ETX-Script ${this.sessionId}]`;
        
        const logData = {
            timestamp,
            level,
            message,
            sessionId: this.sessionId,
            scriptStack: [...this.scriptStack],
            data
        };

        switch (level) {
            case 'debug':
                console.debug(prefix, message, logData);
                break;
            case 'info':
                console.info(prefix, message, logData);
                break;
            case 'warn':
                console.warn(prefix, message, logData);
                break;
            case 'error':
                console.error(prefix, message, logData);
                break;
        }
    }

    startScript(scriptPath, content) {
        this.startTime = performance.now();
        this.scriptStack.push({
            path: scriptPath,
            startTime: this.startTime,
            lineCount: content.split('\n').length
        });

        this.log('info', `Starting script execution: ${scriptPath}`, {
            contentLength: content.length,
            lineCount: content.split('\n').length,
            stackDepth: this.scriptStack.length
        });
    }

    endScript(scriptPath, success, result = null) {
        const endTime = performance.now();
        const scriptInfo = this.scriptStack.pop();
        const duration = scriptInfo ? endTime - scriptInfo.startTime : 0;

        this.log(success ? 'info' : 'error', 
            `Script execution ${success ? 'completed' : 'failed'}: ${scriptPath}`, {
            duration: `${duration.toFixed(2)}ms`,
            success,
            result,
            stackDepth: this.scriptStack.length
        });
    }

    logLine(lineNumber, line, context = {}) {
        this.log('debug', `Executing line ${lineNumber}: ${line.trim()}`, {
            lineNumber,
            line: line.trim(),
            context
        });
    }

    logCommand(command, args = []) {
        this.log('debug', `Executing command: ${command}`, {
            command,
            args,
            timestamp: Date.now()
        });
    }

    logVariable(action, name, value, oldValue = null) {
        this.log('debug', `Variable ${action}: ${name}`, {
            action, // 'set', 'get', 'unset'
            name,
            value,
            oldValue,
            type: typeof value
        });
    }

    logFunction(action, name, params = [], returnValue = null) {
        this.log('debug', `Function ${action}: ${name}`, {
            action, // 'define', 'call', 'return'
            name,
            params,
            returnValue,
            stackDepth: this.scriptStack.length
        });
    }

    logControlFlow(type, condition = null, result = null) {
        this.log('debug', `Control flow: ${type}`, {
            type, // 'if', 'elif', 'else', 'while', 'for', 'break', 'continue'
            condition,
            result,
            evaluated: result !== null ? Boolean(result) : null
        });
    }

    logError(error, context = {}) {
        this.log('error', `Script error: ${error.message}`, {
            error: {
                message: error.message,
                name: error.name,
                stack: error.stack
            },
            context,
            currentScript: this.scriptStack[this.scriptStack.length - 1]
        });
    }

    logImport(scriptPath, success) {
        this.log('info', `Import ${success ? 'successful' : 'failed'}: ${scriptPath}`, {
            scriptPath,
            success,
            stackDepth: this.scriptStack.length
        });
    }

    logParserState(state) {
        this.log('debug', 'Parser state update', {
            variables: Object.keys(state.variables || {}),
            functions: Object.keys(state.functions || {}),
            callStack: state.callStack || [],
            flags: {
                breakFlag: state.breakFlag,
                continueFlag: state.continueFlag,
                returnValue: state.returnValue
            }
        });
    }

    getStats() {
        const stats = {
            sessionId: this.sessionId,
            enabled: this.enabled,
            logLevel: this.logLevel,
            currentStackDepth: this.scriptStack.length,
            currentScripts: this.scriptStack.map(s => s.path)
        };

        this.log('info', 'Script logger statistics', stats);
        return stats;
    }

    // Performance monitoring
    startTimer(name) {
        const timer = {
            name,
            startTime: performance.now(),
            id: Math.random().toString(36).substr(2, 9)
        };
        
        this.log('debug', `Timer started: ${name}`, { timerId: timer.id });
        return timer;
    }

    endTimer(timer) {
        const duration = performance.now() - timer.startTime;
        this.log('debug', `Timer ended: ${timer.name}`, {
            timerId: timer.id,
            duration: `${duration.toFixed(2)}ms`
        });
        return duration;
    }

    // Memory usage tracking
    logMemoryUsage() {
        if (performance.memory) {
            const memory = {
                used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
            };
            
            this.log('debug', 'Memory usage', memory);
            return memory;
        }
        return null;
    }
}

export const scriptLogger = new ScriptLogger();
export { ScriptLogger };