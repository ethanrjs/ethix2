import { getCurrentDirectory } from './terminal.js';

export class CustomPrompt {
    constructor(fileSystem) {
        this.fileSystem = fileSystem;
        this.format = '{dir} $';
    }

    setFormat(format) {
        this.format = format;
    }

    getPrompt() {
        return this.format
            .replace('{dir}', getCurrentDirectory())
            .replace('{time}', new Date().toLocaleTimeString());
    }
}
