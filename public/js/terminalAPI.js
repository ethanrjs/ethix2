const output = document.getElementById('output');
const terminal = document.getElementById('terminal');

import {
    addOutputLine,
    getCurrentDirectory,
    setCurrentDirectory,
    inputElement
} from './terminal.js';

const COLORS = {
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    yellow: '#ffff00',
    blue: '#0000ff',
    magenta: '#ff00ff',
    cyan: '#00ffff',
    white: '#ffffff',
    gray: '#808080'
};

const STYLES = {
    bold: 'font-weight: bold;',
    italic: 'font-style: italic;',
    underline: 'text-decoration: underline;',
    strikethrough: 'text-decoration: line-through;'
};

class TerminalAPI {
    constructor() {
        this.inputCallbacks = [];
        this.keyCallbacks = [];
    }

    write(text, options = {}) {
        const segments = Array.isArray(text) ? text : [{ text }];
        addOutputLine(
            segments.map(segment => ({
                ...segment,
                color: options.color || segment.color,
                backgroundColor: options.backgroundColor || segment.backgroundColor,
                style: options.style || segment.style
            }))
        );
    }

    writeLine(text, options = {}) {
        this.write(text + '\n', options);
    }

    async readLine(prompt = '') {
        return new Promise(resolve => {
            this.write(prompt, { color: 'cyan' });
            this.inputCallbacks.push(resolve);
        });
    }

    async readKey() {
        return new Promise(resolve => {
            const handleKeyPress = event => {
                event.preventDefault();
                document.removeEventListener('keydown', handleKeyPress);
                resolve(event.key);
            };
            document.addEventListener('keydown', handleKeyPress);
        });
    }

    getCurrentDirectory() {
        return getCurrentDirectory();
    }

    setCurrentDirectory(path) {
        setCurrentDirectory(path);
    }

    parseArguments(args) {
        const parsedArgs = {
            flags: {},
            positional: []
        };

        for (let i = 0; i < args.length; i++) {
            const arg = args[i];
            if (arg.startsWith('--')) {
                const [key, value] = arg.slice(2).split('=');
                parsedArgs.flags[key] = value === undefined ? true : value;
            } else if (arg.startsWith('-')) {
                const flags = arg.slice(1).split('');
                flags.forEach(flag => {
                    parsedArgs.flags[flag] = true;
                });
            } else {
                parsedArgs.positional.push(arg);
            }
        }

        return parsedArgs;
    }

    getColor(colorName) {
        return COLORS[colorName] || colorName;
    }

    getStyle(styleName) {
        return STYLES[styleName] || '';
    }

    clear() {
        output.innerHTML = '';
    }

    setPrompt(prompt) {
        const promptElement = document.getElementById('prompt');
        if (promptElement) {
            promptElement.textContent = prompt;
        }
    }

    focusInput() {
        inputElement.focus();
    }

    disableInput() {
        inputElement.contentEditable = 'false';
    }

    enableInput() {
        inputElement.contentEditable = 'true';
    }

    scrollToBottom() {
        terminal.scrollTop = terminal.scrollHeight;
    }

    async confirm(message) {
        this.writeLine(message + ' (y/n)', { color: 'yellow' });
        while (true) {
            const response = await this.readKey();
            if (response.toLowerCase() === 'y') return true;
            if (response.toLowerCase() === 'n') return false;
        }
    }

    async select(options, prompt = 'Select an option:') {
        this.writeLine(prompt, { color: 'cyan' });
        options.forEach((option, index) => {
            this.writeLine(`${index + 1}. ${option}`, { color: 'white' });
        });
        while (true) {
            const response = await this.readLine('Enter your choice: ');
            const choice = parseInt(response);
            if (choice > 0 && choice <= options.length) {
                return options[choice - 1];
            }
            this.writeLine('Invalid choice. Please try again.', {
                color: 'red'
            });
        }
    }
}

export const terminalAPI = new TerminalAPI();
