// d.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import { deleteItem, getDirectoryContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

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

registerCommand('d', 'Delete a file or directory', args => {
    if (args.length === 0) {
        addOutputLine('Usage: d <file_or_directory>', { color: 'red' });
        return;
    }

    const path = resolvePath(args[0]);
    const contents = getDirectoryContents(path);

    if (contents === null) {
        // It's a file or doesn't exist
        if (deleteItem(path)) {
            addOutputLine(`Deleted file: ${path}`, { color: 'green' });
        } else {
            addOutputLine(
                `Error: Unable to delete ${path}. File may not exist.`,
                { color: 'red' }
            );
        }
    } else {
        // It's a directory
        if (
            Object.keys(contents).length > 0 &&
            !args.includes('-r') &&
            !args.includes('--recursive')
        ) {
            addOutputLine(
                `Error: ${path} is a directory. Use -r or --recursive to delete directories.`,
                { color: 'red' }
            );
        } else {
            if (deleteItem(path)) {
                addOutputLine(`Deleted directory: ${path}`, { color: 'green' });
            } else {
                addOutputLine(`Error: Unable to delete ${path}.`, {
                    color: 'red'
                });
            }
        }
    }
});

registerCommandDescription(
    'd',
    'Delete a file or directory (use -r or --recursive for directories)'
);
