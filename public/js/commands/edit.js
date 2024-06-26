// edit.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory,
    enterEditMode,
    exitEditMode
} from '../terminal.js';
import { getFileContents, saveFile } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('edit', 'Edit a file', args => {
    if (args.length < 1) {
        addOutputLine({ text: 'Usage: edit <filename>', color: 'red' });
        return;
    }

    const fileName = args[0];
    const currentDir = getCurrentDirectory();
    const filePath = `${currentDir}/${fileName}`.replace(/\/+/g, '/');

    const fileContents = getFileContents(filePath);
    if (fileContents === null) {
        addOutputLine({
            text: `File "${fileName}" does not exist.`,
            color: 'red'
        });
        return;
    }

    enterEditMode(fileName, fileContents, newContents => {
        saveFile(filePath, newContents);
        exitEditMode();
        addOutputLine({
            text: `File "${fileName}" saved successfully.`,
            color: 'green'
        });
    });
});

registerCommandDescription('edit', 'Edit a file');
