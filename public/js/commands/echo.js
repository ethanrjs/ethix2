// echo.js
import { registerCommand, addOutputLine } from '../terminal.js';

registerCommand('echo', 'Print arguments to the terminal', args => {
    addOutputLine(args.join(' '));
});
