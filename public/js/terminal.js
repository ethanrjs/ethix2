// terminal.js
import { fileSystem, saveFileSystem } from './fileSystem.js';

const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const promptElement = document.getElementById('prompt');
const inputElement = document.getElementById('input');

let currentDirectory = '/';
let commandHistory = [];
let historyIndex = -1;

const commands = {};

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

export function addOutputLine(text, options = {}) {
    const line = document.createElement('div');
    line.className = 'output-line';

    let styledText = text;

    if (options.color && COLORS[options.color]) {
        styledText = `<span style="color: ${
            COLORS[options.color]
        };">${styledText}</span>`;
    }

    if (options.backgroundColor && COLORS[options.backgroundColor]) {
        styledText = `<span style="background-color: ${
            COLORS[options.backgroundColor]
        };">${styledText}</span>`;
    }

    if (options.style) {
        const styles = options.style
            .split(',')
            .map(s => STYLES[s.trim()])
            .filter(Boolean);
        if (styles.length > 0) {
            styledText = `<span style="${styles.join(
                ' '
            )}">${styledText}</span>`;
        }
    }

    if (options.isCommand) {
        styledText = promptElement.textContent + ' ' + styledText;
    }

    if (options.ascii) {
        styledText = `<pre>${styledText}</pre>`;
    }

    line.innerHTML = styledText;
    output.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
}

export function registerCommand(name, description, action) {
    commands[name] = { description, action };
}

function updatePrompt() {
    promptElement.textContent = `${currentDirectory} $`;
}

function processCommand(command) {
    addOutputLine(command, { isCommand: true, color: 'cyan' });
    const [cmd, ...args] = command.split(' ');
    if (commands[cmd]) {
        commands[cmd].action(args);
    } else {
        addOutputLine(`Command not found: ${cmd}`, { color: 'red' });
    }
    saveFileSystem();
}

function moveCursorToEnd() {
    const range = document.createRange();
    const sel = window.getSelection();
    range.selectNodeContents(inputElement);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
}

inputElement.addEventListener('input', () => {
    // Ensure the input stays on one line
    inputElement.textContent = inputElement.textContent.replace(/\n/g, '');
});

inputElement.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const command = inputElement.textContent.trim();
        if (command) {
            processCommand(command);
            commandHistory.unshift(command);
            historyIndex = -1;
            inputElement.textContent = '';
        }
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex < commandHistory.length - 1) {
            historyIndex++;
            inputElement.textContent = commandHistory[historyIndex];
            moveCursorToEnd();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex > -1) {
            historyIndex--;
            inputElement.textContent =
                historyIndex === -1 ? '' : commandHistory[historyIndex];
            moveCursorToEnd();
        }
    } else if (e.key === 'Tab') {
        e.preventDefault();
        autocomplete();
    }
});

function autocomplete() {
    const input = inputElement.textContent.trim();
    const [partialCmd, ...args] = input.split(' ');
    const matches = Object.keys(commands).filter(cmd =>
        cmd.startsWith(partialCmd)
    );

    if (matches.length === 1) {
        inputElement.textContent =
            matches[0] + (args.length ? ' ' + args.join(' ') : '');
        moveCursorToEnd();
    } else if (matches.length > 1) {
        addOutputLine('Possible commands:');
        matches.forEach(match => addOutputLine('  ' + match));
    }
}

// Ensure input stays focused
document.addEventListener('click', () => {
    inputElement.focus();
});

async function loadCommandModules() {
    addOutputLine('\nLoading command modules...', {
        color: 'yellow',
        style: 'bold'
    });

    try {
        const response = await fetch('/api/command-modules');
        const modules = await response.json();

        // Ensure help.js is loaded first
        const helpIndex = modules.indexOf('help.js');
        if (helpIndex > -1) {
            modules.splice(helpIndex, 1);
            modules.unshift('help.js');
        }

        for (const module of modules) {
            try {
                await import(`/js/commands/${module}`);
                addOutputLine(`  ✓ ${module}`, { color: 'green' });
            } catch (moduleEwrror) {
                addOutputLine(`  ✗ ${module}`, { color: 'red' });
                addOutputLine(`    Error: ${moduleError.message}`, {
                    color: 'red',
                    style: 'italic'
                });
            }
        }

        addOutputLine('\nCommand modules loaded successfully.', {
            color: 'green',
            style: 'bold'
        });
    } catch (error) {
        addOutputLine('\nError loading command modules:', {
            color: 'red',
            style: 'bold'
        });
        addOutputLine(`  ${error.message}`, { color: 'red' });
    }

    addOutputLine(''); // Add an empty line for better readability
}

// Initialize terminal
export async function initializeTerminal() {
    await loadCommandModules();
    addOutputLine('Welcome to the Improved Browser Terminal!');
    addOutputLine('Type "help" for a list of available commands.');
    updatePrompt();
    inputElement.focus();
}

export function getCurrentDirectory() {
    return currentDirectory;
}

export function setCurrentDirectory(newDir) {
    currentDirectory = newDir;
    updatePrompt();
}

initializeTerminal();

// Expose necessary functions and variables
export { fileSystem, updatePrompt };
