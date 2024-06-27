// create.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import { createFile, getDirectoryContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('create', 'Create a new file', args => {
    if (args.length < 1) {
        addOutputLine({ text: 'Usage: create (filename)', color: 'red' });
        return;
    }

    const fileName = args[0];
    const currentDir = getCurrentDirectory();
    const filePath = `${currentDir}/${fileName}`.replace(/\/+/g, '/');

    if (getDirectoryContents(filePath)) {
        addOutputLine({
            text: `File "${fileName}" already exists.`,
            color: 'red'
        });
        return;
    }

    createFile(filePath, '');
    addOutputLine({
        text: `File "${fileName}" created successfully.`,
        color: 'green'
    });
    addOutputLine({ text: 'To edit this file, use:', color: 'cyan' });
    addOutputLine({ text: `edit ${fileName}`, color: 'yellow' });
});

registerCommandDescription('create', 'Create a new file');
