// etx.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import { getFileContents } from '../fileSystem.js';
import { terminalAPI } from '../terminalAPI.js';
import { registerCommandDescription } from './help.js';

function resolvePath(path) {
    const currentDir = getCurrentDirectory();

    const absolutePath = path.startsWith('/') ? path : `${currentDir}/${path}`;
    const segments = absolutePath.split('/').filter(segment => segment !== '');

    const resolvedSegments = [];

    for (const segment of segments) {
        if (segment === '.') {
            continue;
        } else if (segment === '..') {
            if (resolvedSegments.length > 0) {
                resolvedSegments.pop();
            }
        } else {
            resolvedSegments.push(segment);
        }
    }

    let resolvedPath = '/' + resolvedSegments.join('/');
    if (resolvedPath === '') {
        resolvedPath = '/';
    }

    return resolvedPath;
}

export async function executeScript(scriptPath) {
    const fullPath = resolvePath(scriptPath);
    const scriptContent = getFileContents(fullPath);

    if (scriptContent === null) {
        addOutputLine({
            text: `Script not found: ${scriptPath}`,
            color: 'red'
        });
        return;
    }

    const lines = scriptContent.split('\n');
    for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
            await executeCommand(trimmedLine);
        }
    }
}

async function executeCommand(command) {
    const [cmd, ...args] = command.split(' ');
    if (terminalAPI[cmd]) {
        await terminalAPI[cmd](args);
    } else {
        addOutputLine({ text: `Unknown command: ${cmd}`, color: 'red' });
    }
}

registerCommand('etx', 'Execute an ETX script', async args => {
    if (args.length === 0) {
        addOutputLine({ text: 'Usage: etx <script_path>', color: 'red' });
        return;
    }
    await executeScript(args[0]);
});

registerCommandDescription('etx', 'Execute an ETX script file');
