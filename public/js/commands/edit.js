import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import { getFileContents, saveFile } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';
import { EnhancedEditor } from '../EnhancedEditor.js';

// Create a global instance of the enhanced editor
const enhancedEditor = new EnhancedEditor();

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

    // Use the enhanced editor
    enhancedEditor.show(fileName, fileContents, newContents => {
        saveFile(filePath, newContents);
        addOutputLine({
            text: `File "${fileName}" saved successfully.`,
            color: 'green'
        });
    });
});

registerCommandDescription('edit', 'Edit a file');
