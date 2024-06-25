// terminal.js
import { fileSystem, saveFileSystem } from './fileSystem.js';
import { terminalAPI } from './terminalAPI.js';

const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const promptElement = document.getElementById('prompt');
const inputElement = document.getElementById('input');

let currentDirectory = '/';
let commandHistory = [];
let historyIndex = -1;
let isEditMode = false;

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

export function addOutputLine(segments, options = {}) {
    const line = document.createElement('div');
    line.className = 'output-line';

    let content = '';

    if (Array.isArray(segments)) {
        segments.forEach(segment => {
            const { text, color, backgroundColor, style } = segment;
            let styledText = text;

            if (color && COLORS[color]) {
                styledText = `<span style="color: ${COLORS[color]};">${styledText}</span>`;
            }

            if (backgroundColor && COLORS[backgroundColor]) {
                styledText = `<span style="background-color: ${COLORS[backgroundColor]};">${styledText}</span>`;
            }

            if (style) {
                const styles = style
                    .split(',')
                    .map(s => STYLES[s.trim()])
                    .filter(Boolean);
                if (styles.length > 0) {
                    styledText = `<span style="${styles.join(
                        ' '
                    )}">${styledText}</span>`;
                }
            }

            content += styledText;
        });
    } else {
        content = segments; // Fallback for single-string input
    }

    if (options.isCommand) {
        content = promptElement.textContent + ' ' + content;
    }

    if (options.ascii) {
        content = `<pre>${content}</pre>`;
    }

    line.innerHTML = content;
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

function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
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

            // Check if there are any pending input callbacks
            if (terminalAPI.inputCallbacks.length > 0) {
                const callback = terminalAPI.inputCallbacks.shift();
                callback(command);
            }
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

async function loadCommandModules() {
    addOutputLine([
        {
            text: '\nLoading command modules... ',
            color: 'yellow',
            style: 'bold'
        },
        { text: `[${getTimestamp()}]`, color: 'gray' }
    ]);

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
            const startTime = performance.now();
            try {
                await import(`/js/commands/${module}`);
                const endTime = performance.now();
                const loadTime = (endTime - startTime).toFixed(2);
                addOutputLine([
                    { text: `  ✓ ${module}`, color: 'green' },
                    { text: ` (${loadTime}ms)`, color: 'gray' },
                    { text: ` [${getTimestamp()}]`, color: 'gray' }
                ]);
            } catch (moduleError) {
                addOutputLine([
                    { text: `  ✗ ${module}`, color: 'red' },
                    { text: ` [${getTimestamp()}]`, color: 'gray' }
                ]);
                addOutputLine(`    Error: ${moduleError.message}`, {
                    color: 'red',
                    style: 'italic'
                });
            }
        }

        addOutputLine([
            {
                text: '\nCommand modules loaded successfully. ',
                color: 'green',
                style: 'bold'
            },
            { text: `[${getTimestamp()}]`, color: 'gray' }
        ]);
    } catch (error) {
        addOutputLine([
            {
                text: '\nError loading command modules: ',
                color: 'red',
                style: 'bold'
            },
            { text: `[${getTimestamp()}]`, color: 'gray' }
        ]);
        addOutputLine(`  ${error.message}`, { color: 'red' });
    }

    addOutputLine(''); // Add an empty line for better readability
}

// Initialize terminal
export async function initializeTerminal() {
    await loadCommandModules();
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

export function enterEditMode(fileName, initialContent, saveCallback) {
    isEditMode = true;
    terminal.innerHTML = '';

    const editorContainer = document.createElement('div');
    editorContainer.id = 'editor-container';
    editorContainer.style.height = '100%';
    editorContainer.style.display = 'flex';
    editorContainer.style.flexDirection = 'column';

    const editorHeader = document.createElement('div');
    editorHeader.textContent = `Editing: ${fileName} (Press Ctrl+S to save, Ctrl+Q to quit)`;
    editorHeader.style.padding = '5px';
    editorHeader.style.backgroundColor = '#333';
    editorHeader.style.color = '#fff';

    const editorTextarea = document.createElement('textarea');
    editorTextarea.value = initialContent;
    editorTextarea.style.flexGrow = '1';
    editorTextarea.style.width = '100%';
    editorTextarea.style.backgroundColor = '#1e1e1e';
    editorTextarea.style.color = '#f0f0f0';
    editorTextarea.style.border = 'none';
    editorTextarea.style.padding = '10px';
    editorTextarea.style.fontSize = '16px';
    editorTextarea.style.resize = 'none';
    editorTextarea.style.outline = 'none';
    editorTextarea.style.fontFamily = 'IBM Plex Mono, monospace';
    editorTextarea.spellcheck = false;
    editorTextarea.setAttribute('autocorrect', 'off'); // Additional attribute to disable autocorrect
    editorTextarea.setAttribute('autocapitalize', 'off'); // Additional attribute to disable autocapitalize

    editorContainer.appendChild(editorHeader);
    editorContainer.appendChild(editorTextarea);
    terminal.appendChild(editorContainer);

    editorTextarea.focus();

    editorTextarea.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            saveCallback(editorTextarea.value);
        } else if (e.ctrlKey && e.key === 'q') {
            e.preventDefault();
            exitEditMode();
        }
    });
}

export function exitEditMode() {
    isEditMode = false;
    terminal.innerHTML = '';
    terminal.appendChild(output);
    terminal.appendChild(inputLine);
    inputElement.focus();
}

// Expose necessary functions and variables
export { fileSystem, updatePrompt, inputElement };
