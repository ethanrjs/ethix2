import { registerCommand, addOutputLine } from '../terminal.js';
import { createDirectory, resolvePath } from '../fileSystem.js';

registerCommand('mkdir', 'Create a directory', args => {
    if (args.length === 0) {
        addOutputLine('mkdir: missing operand');
        return;
    }
    const newDir = resolvePath(args[0]);
    if (createDirectory(newDir)) {
        addOutputLine(`Directory created: ${newDir}`);
    } else {
        addOutputLine(
            `mkdir: cannot create directory '${args[0]}': File exists or parent directory is missing`
        );
    }
});
