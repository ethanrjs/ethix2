import {
    addOutputLine,
    getCurrentDirectory,
    registerCommand
} from '../terminal.js';
import { registerCommandDescription } from './help.js';

registerCommand('pwd', 'Print the working directory', args => {
    addOutputLine(getCurrentDirectory());
});
