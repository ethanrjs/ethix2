import { fileSystem, saveFileSystem } from './fileSystem.js';
import { terminalAPI } from './terminalAPI.js';
import { getFileContents } from './fileSystem.js';
import { scriptParser } from './scriptParser.js';

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

    segments = Array.isArray(segments) ? segments : [segments];

    segments.forEach(segment => {
        let span = document.createElement('span');

        if (typeof segment === 'string') {
            span.innerHTML = segment;
        } else if (typeof segment === 'object' && segment !== null) {
            const { text = '', color, backgroundColor, style } = segment;
            span.innerHTML = text;

            let styles = [];

            if (color && COLORS[color]) {
                styles.push(`color: ${COLORS[color]}`);
            }

            if (backgroundColor && COLORS[backgroundColor]) {
                styles.push(`background-color: ${COLORS[backgroundColor]}`);
            }

            if (style) {
                const additionalStyles = style
                    .split(',')
                    .map(s => STYLES[s.trim()])
                    .filter(Boolean);
                styles = styles.concat(additionalStyles);
            }

            if (styles.length > 0) {
                span.style.cssText = styles.join('; ');
            }
        } else {
            return;
        }

        line.appendChild(span);
    });

    if (options.isCommand && promptElement && promptElement.textContent) {
        const promptSpan = document.createElement('span');
        promptSpan.textContent = promptElement.textContent + ' ';
        promptSpan.style.color = COLORS.green;
        line.insertBefore(promptSpan, line.firstChild);
    }

    if (options.ascii) {
        const pre = document.createElement('pre');
        pre.appendChild(line);
        output.appendChild(pre);
    } else {
        output.appendChild(line);
    }

    if (terminal) {
        terminal.scrollTop = terminal.scrollHeight;
    }
}

export function registerCommand(name, description, action) {
    commands[name] = { description, action };
}

function updatePrompt() {
    promptElement.textContent = `${currentDirectory} $`;
}

async function executeScript(scriptPath) {
    const fullPath = resolvePath(scriptPath);
    const scriptContent = getFileContents(fullPath);

    if (scriptContent === null) {
        addOutputLine({
            text: `Script not found: ${scriptPath}`,
            color: 'red'
        });
        return;
    }

    addOutputLine({ text: `Executing script: ${scriptPath}`, color: 'cyan' });
    await scriptParser.executeScript(scriptContent);
    addOutputLine({
        text: `Script execution completed: ${scriptPath}`,
        color: 'cyan'
    });
}

function resolvePath(path) {
    const currentDir = getCurrentDirectory();

    const absolutePath = path.startsWith('/') ? path : `${currentDir}/${path}`;
    const segments = absolutePath.split('/').filter(segment => segment !== '');

    const resolvedSegments = [];

    for (const segment of segments) {
        if (segment === '.') {
            continue;
        } else if (segment === '..') {
            if (resolvedSegments.length > 0) {
                resolvedSegments.pop();
            }
        } else {
            resolvedSegments.push(segment);
        }
    }

    let resolvedPath = '/' + resolvedSegments.join('/');
    if (resolvedPath === '') {
        resolvedPath = '/';
    }

    return resolvedPath;
}

export async function processCommand(input, hidden = false) {
    if (!hidden) addOutputLine({ text: input }, { isCommand: true });
    const [cmd, ...args] = input.split(' ');

    if (input.startsWith('./') || input.startsWith('/')) {
        await executeScript(input);
    } else if (commands[cmd]) {
        await commands[cmd].action(args);
    } else {
        addOutputLine({ text: `Command not found: ${cmd}`, color: 'red' });
    }
    saveFileSystem();
}

function moveCursorToEnd() {
    const range = document.createRange();
    const selection = window.getSelection();
    range.selectNodeContents(inputElement);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
}

function getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { hour12: false });
}

inputElement.addEventListener('input', e => {
    const selection = window.getSelection();
    const cursorPosition = selection.focusOffset;

    const newContent = inputElement.textContent.replace(/\n/g, '');

    if (newContent !== inputElement.textContent) {
        inputElement.textContent = newContent;

        const range = document.createRange();
        const textNode = inputElement.firstChild || inputElement;
        const newPosition = Math.min(cursorPosition, newContent.length);
        range.setStart(textNode, newPosition);
        range.setEnd(textNode, newPosition);
        selection.removeAllRanges();
        selection.addRange(range);
    }
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
        let modules = await response.json();

        const helpIndex = modules.indexOf('help.js');
        if (helpIndex > -1) {
            modules = ['help.js', ...modules.filter(m => m !== 'help.js')];
        }

        const loadPromises = modules.map(async module => {
            const startTime = performance.now();
            try {
                await import(`/js/commands/${module}`);
                const loadTime = (performance.now() - startTime).toFixed(2);
                return { module, success: true, loadTime };
            } catch (error) {
                return { module, success: false, error: error.message };
            }
        });

        const results = await Promise.all(loadPromises);

        results.forEach(({ module, success, loadTime, error }) => {
            if (success) {
                addOutputLine([
                    { text: `  ✓ ${module}`, color: 'green' },
                    { text: ` (${loadTime}ms)`, color: 'gray' },
                    { text: ` [${getTimestamp()}]`, color: 'gray' }
                ]);
            } else {
                addOutputLine([
                    { text: `  ✗ ${module}`, color: 'red' },
                    { text: ` [${getTimestamp()}]`, color: 'gray' }
                ]);
                addOutputLine(`    Error: ${error}`, {
                    color: 'red',
                    style: 'italic'
                });
            }
        });

        const successCount = results.filter(r => r.success).length;
        const failCount = results.length - successCount;

        addOutputLine([
            {
                text: '\nCommand modules loaded: ',
                color: 'green',
                style: 'bold'
            },
            { text: `${successCount} succeeded, `, color: 'green' },
            {
                text: `${failCount} failed. `,
                color: failCount > 0 ? 'red' : 'green'
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

    addOutputLine('');
}

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
    editorTextarea.setAttribute('autocorrect', 'off');
    editorTextarea.setAttribute('autocapitalize', 'off');

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

export { fileSystem, updatePrompt, inputElement };
