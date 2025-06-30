import { registerCommand, addOutputLine } from '../terminal.js';
import { scriptLogger } from '../ScriptLogger.js';
import { registerCommandDescription } from './help.js';

registerCommand('script-log', 'Control script logging', args => {
    if (args.length === 0) {
        // Show current status
        const stats = scriptLogger.getStats();
        addOutputLine([
            { text: 'Script Logger Status:', color: 'cyan' }
        ]);
        addOutputLine([
            { text: `  Enabled: `, color: 'white' },
            { text: stats.enabled ? 'Yes' : 'No', color: stats.enabled ? 'green' : 'red' }
        ]);
        addOutputLine([
            { text: `  Log Level: `, color: 'white' },
            { text: stats.logLevel, color: 'yellow' }
        ]);
        addOutputLine([
            { text: `  Session ID: `, color: 'white' },
            { text: stats.sessionId, color: 'brightBlack' }
        ]);
        if (stats.currentStackDepth > 0) {
            addOutputLine([
                { text: `  Currently executing: `, color: 'white' },
                { text: stats.currentScripts.join(', '), color: 'cyan' }
            ]);
        }
        addOutputLine([
            { text: '\nUsage:', color: 'yellow' }
        ]);
        addOutputLine('  script-log on|off           - Enable/disable logging');
        addOutputLine('  script-log level <level>     - Set log level (debug, info, warn, error)');
        addOutputLine('  script-log stats             - Show detailed statistics');
        addOutputLine('  script-log memory            - Show memory usage');
        return;
    }

    const command = args[0].toLowerCase();

    switch (command) {
        case 'on':
        case 'enable':
            scriptLogger.enable();
            addOutputLine({ text: 'Script logging enabled', color: 'green' });
            addOutputLine({ text: 'Check browser console for detailed logs', color: 'cyan' });
            break;

        case 'off':
        case 'disable':
            scriptLogger.disable();
            addOutputLine({ text: 'Script logging disabled', color: 'red' });
            break;

        case 'level':
            if (args.length < 2) {
                addOutputLine({ text: 'Usage: script-log level <debug|info|warn|error>', color: 'red' });
                return;
            }
            const level = args[1].toLowerCase();
            if (['debug', 'info', 'warn', 'error'].includes(level)) {
                scriptLogger.setLogLevel(level);
                addOutputLine([
                    { text: 'Log level set to: ', color: 'green' },
                    { text: level, color: 'yellow' }
                ]);
            } else {
                addOutputLine({ text: 'Invalid log level. Use: debug, info, warn, or error', color: 'red' });
            }
            break;

        case 'stats':
            const stats = scriptLogger.getStats();
            addOutputLine([
                { text: 'Detailed Script Logger Statistics:', color: 'cyan' }
            ]);
            addOutputLine([
                { text: '  Session ID: ', color: 'white' },
                { text: stats.sessionId, color: 'brightBlack' }
            ]);
            addOutputLine([
                { text: '  Status: ', color: 'white' },
                { text: stats.enabled ? 'Enabled' : 'Disabled', color: stats.enabled ? 'green' : 'red' }
            ]);
            addOutputLine([
                { text: '  Log Level: ', color: 'white' },
                { text: stats.logLevel, color: 'yellow' }
            ]);
            addOutputLine([
                { text: '  Stack Depth: ', color: 'white' },
                { text: stats.currentStackDepth.toString(), color: 'cyan' }
            ]);
            if (stats.currentScripts.length > 0) {
                addOutputLine([
                    { text: '  Active Scripts:', color: 'white' }
                ]);
                stats.currentScripts.forEach(script => {
                    addOutputLine([
                        { text: '    - ', color: 'white' },
                        { text: script, color: 'cyan' }
                    ]);
                });
            }
            break;

        case 'memory':
            const memory = scriptLogger.logMemoryUsage();
            if (memory) {
                addOutputLine([
                    { text: 'Memory Usage:', color: 'cyan' }
                ]);
                addOutputLine([
                    { text: `  Used: `, color: 'white' },
                    { text: `${memory.used} MB`, color: 'yellow' }
                ]);
                addOutputLine([
                    { text: `  Total: `, color: 'white' },
                    { text: `${memory.total} MB`, color: 'yellow' }
                ]);
                addOutputLine([
                    { text: `  Limit: `, color: 'white' },
                    { text: `${memory.limit} MB`, color: 'yellow' }
                ]);
            } else {
                addOutputLine({ text: 'Memory usage information not available', color: 'red' });
            }
            break;

        default:
            addOutputLine({ text: `Unknown command: ${command}`, color: 'red' });
            addOutputLine({ text: 'Use "script-log" without arguments to see usage', color: 'yellow' });
    }
});

registerCommandDescription('script-log', 'Control script logging and view execution details');