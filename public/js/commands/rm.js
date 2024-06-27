import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import {
    deleteItem,
    getDirectoryContents,
    resolvePath
} from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

function removeRecursive(path) {
    const contents = getDirectoryContents(path);
    if (contents) {
        for (const [name, item] of Object.entries(contents)) {
            const itemPath = `${path}/${name}`;
            if (item.type === 'directory') {
                removeRecursive(itemPath);
            } else {
                deleteItem(itemPath);
            }
        }
    }
    return deleteItem(path);
}

registerCommand('rm', 'Remove files or directories', args => {
    let recursive = false;
    let paths = [];

    for (const arg of args) {
        if (arg === '-r' || arg === '-R' || arg === '--recursive') {
            recursive = true;
        } else {
            paths.push(arg);
        }
    }

    if (paths.length === 0) {
        addOutputLine({
            text: 'Usage: rm [-r] (file_or_directory...)',
            color: 'red'
        });
        return;
    }

    for (const path of paths) {
        const fullPath = resolvePath(path);
        const contents = getDirectoryContents(fullPath);

        if (contents === null) {
            if (deleteItem(fullPath)) {
                addOutputLine({
                    text: `Removed file: ${fullPath}`,
                    color: 'green'
                });
            } else {
                addOutputLine({
                    text: `Error: Unable to remove ${fullPath}. File may not exist.`,
                    color: 'red'
                });
            }
        } else {
            if (recursive) {
                if (removeRecursive(fullPath)) {
                    addOutputLine({
                        text: `Removed directory: ${fullPath}`,
                        color: 'green'
                    });
                } else {
                    addOutputLine({
                        text: `Error: Unable to remove ${fullPath}.`,
                        color: 'red'
                    });
                }
            } else {
                addOutputLine({
                    text: `Error: ${fullPath} is a directory. Use -r to remove directories.`,
                    color: 'red'
                });
            }
        }
    }
});

registerCommandDescription(
    'rm',
    'Remove files or directories. Use -r for recursive removal of directories.'
);
