import {
    addOutputLine,
    getCurrentDirectory,
    registerCommand
} from '../terminal.js';

registerCommand('pwd', 'Print the working directory', args => {
    addOutputLine(getCurrentDirectory());
});
