// clear.js
import { registerCommand } from '../terminal.js';

registerCommand('clear', 'Clear the terminal', () => {
    document.getElementById('output').innerHTML = '';
});
