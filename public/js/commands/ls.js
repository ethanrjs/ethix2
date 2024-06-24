// ls.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory,
    fileSystem
} from '../terminal.js';
import { getDirectoryContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('ls', 'List directory contents', args => {
    const path = args.length > 0 ? resolvePath(args[0]) : getCurrentDirectory();
    const contents = getDirectoryContents(path);
    if (contents) {
        addOutputLine(`Contents of ${path}:`, {
            color: 'yellow',
            style: 'bold'
        });
        Object.entries(contents).forEach(([name, item]) => {
            const itemType = item.type === 'directory' ? 'd' : '-';
            const itemColor = item.type === 'directory' ? 'cyan' : 'white';
            addOutputLine(`${itemType} ${name}`, { color: itemColor });
        });
    } else {
        addOutputLine(
            `ls: cannot access '${path}': No such file or directory`,
            { color: 'red' }
        );
    }
});
registerCommandDescription('ls', 'List directory contents');

function resolvePath(path) {
    // Implementation of resolvePath function...
}
