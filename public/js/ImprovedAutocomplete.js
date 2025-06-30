import { getDirectoryContents } from './fileSystem.js';
import { getCurrentDirectory } from './terminal.js';
export class ImprovedAutocomplete {
    constructor(commands, fileSystem) {
        this.commands = commands;
        this.fileSystem = fileSystem;
    }

    getSuggestions(input) {
        const [cmd, ...args] = input.split(' ');
        if (args.length === 0) {
            return this.getCommandSuggestions(cmd);
        } else {
            return this.getPathSuggestions(args[args.length - 1]);
        }
    }

    getCommandSuggestions(partial) {
        return Object.keys(this.commands).filter(cmd => cmd.startsWith(partial));
    }

    getPathSuggestions(partial) {
        const currentDir = getCurrentDirectory();
        const contents = getDirectoryContents(currentDir);
        return Object.keys(contents).filter(item => item.startsWith(partial));
    }
}
