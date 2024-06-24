// cd.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory,
    setCurrentDirectory
} from '../terminal.js';
import { getDirectoryContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('cd', 'Change directory', args => {
    if (args.length === 0) {
        setCurrentDirectory('/');
    } else {
        const newPath = resolvePath(args[0]);
        const contents = getDirectoryContents(newPath);
        if (contents) {
            setCurrentDirectory(newPath);
        } else {
            addOutputLine(`cd: ${args[0]}: No such file or directory`, {
                color: 'red'
            });
        }
    }
});

function resolvePath(path) {
    const currentDir = getCurrentDirectory();
    if (path.startsWith('/')) return path;
    const absolutePath = `${currentDir}/${path}`.replace(/\/+/g, '/');
    const parts = absolutePath.split('/').filter(Boolean);
    const resolvedParts = [];
    for (const part of parts) {
        if (part === '..') {
            resolvedParts.pop();
        } else if (part !== '.') {
            resolvedParts.push(part);
        }
    }
    return '/' + resolvedParts.join('/');
}

// Register the command description
registerCommandDescription('cd', 'Change directory');
