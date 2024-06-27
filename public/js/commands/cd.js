import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory,
    setCurrentDirectory
} from '../terminal.js';
import { getDirectoryContents, resolvePath } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('cd', 'Change directory', args => {
    if (args.length === 0) {
        setCurrentDirectory('/');
    } else {
        const newPath = resolvePath(args[0]);
        const contents = getDirectoryContents(newPath);
        if (contents) {
            setCurrentDirectory(newPath);
        } else {
            addOutputLine(`cd: ${args[0]}: No such file or directory`, {
                color: 'red'
            });
        }
    }
});

registerCommandDescription('cd', 'Change directory');
