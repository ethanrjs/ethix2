import { fileSystem, saveFileSystem, getFileContents } from './fileSystem.js';
import { terminalAPI } from './terminalAPI.js';
import { scriptParser } from './scriptParser.js';

const terminal = document.getElementById('terminal');
const output = document.getElementById('output');
const inputLine = document.getElementById('input-line');
const promptElement = document.getElementById('prompt');
const inputElement = document.getElementById('input');

const state = {
    currentDirectory: '/',
    commandHistory: [],
    historyIndex: -1,
    isEditMode: false
};

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
        const span = createSegmentSpan(segment);
        if (span) line.appendChild(span);
    });

    if (options.isCommand && promptElement?.textContent) {
        const promptSpan = createPromptSpan();
        line.insertBefore(promptSpan, line.firstChild);
    }

    appendLineToOutput(line, options.ascii);
    scrollToBottom();
}

function createSegmentSpan(segment) {
    if (typeof segment === 'string') {
        const span = document.createElement('span');
        span.innerHTML = segment;
        return span;
    } else if (typeof segment === 'object' && segment !== null) {
        const { text = '', color, backgroundColor, style } = segment;
        const span = document.createElement('span');
        span.innerHTML = text;
        applyStyles(span, color, backgroundColor, style);
        return span;
    }
    return null;
}

function applyStyles(element, color, backgroundColor, style) {
    const styles = [];
    if (color && COLORS[color]) styles.push(`color: ${COLORS[color]}`);
    if (backgroundColor && COLORS[backgroundColor])
        styles.push(`background-color: ${COLORS[backgroundColor]}`);
    if (style) {
        const additionalStyles = style
            .split(',')
            .map(s => STYLES[s.trim()])
            .filter(Boolean);
        styles.push(...additionalStyles);
    }
    if (styles.length > 0) element.style.cssText = styles.join('; ');
}

function createPromptSpan() {
    const promptSpan = document.createElement('span');
    promptSpan.textContent = promptElement.textContent + ' ';
    promptSpan.style.color = COLORS.green;
    return promptSpan;
}

function appendLineToOutput(line, isAscii) {
    if (isAscii) {
        const pre = document.createElement('pre');
        pre.appendChild(line);
        output.appendChild(pre);
    } else {
        output.appendChild(line);
    }
}

function scrollToBottom() {
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
}

export function registerCommand(name, description, action) {
    commands[name] = { description, action };
}

function updatePrompt() {
    promptElement.textContent = `${state.currentDirectory} $`;
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
    const currentDir = state.currentDirectory;
    const absolutePath = path.startsWith('/') ? path : `${currentDir}/${path}`;
    const segments = absolutePath.split('/').filter(Boolean);
    const resolvedSegments = [];

    for (const segment of segments) {
        if (segment === '.') continue;
        if (segment === '..') {
            if (resolvedSegments.length > 0) resolvedSegments.pop();
        } else {
            resolvedSegments.push(segment);
        }
    }

    return '/' + resolvedSegments.join('/') || '/';
}

export async function processCommand(input, hidden = false) {
    if (!hidden) addOutputLine({ text: input }, { isCommand: true });
    const [cmd, ...args] = input.split(' ');

    if (
        input.startsWith('./') ||
        input.startsWith('/') ||
        input.startsWith('../')
    ) {
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
    return new Date().toLocaleTimeString('en-US', { hour12: false });
}

function handleInput(e) {
    const selection = window.getSelection();
    const cursorPosition = selection.focusOffset;
    const newContent = inputElement.textContent.replace(/\n/g, '');

    if (newContent !== inputElement.textContent) {
        inputElement.textContent = newContent;
        setCursorPosition(cursorPosition, newContent.length);
    }
}

function setCursorPosition(cursorPosition, maxLength) {
    const range = document.createRange();
    const selection = window.getSelection();
    const textNode = inputElement.firstChild || inputElement;
    const newPosition = Math.min(cursorPosition, maxLength);
    range.setStart(textNode, newPosition);
    range.setEnd(textNode, newPosition);
    selection.removeAllRanges();
    selection.addRange(range);
}

function handleKeyDown(e) {
    switch (e.key) {
        case 'Enter':
            handleEnterKey(e);
            break;
        case 'ArrowUp':
            handleArrowUpKey(e);
            break;
        case 'ArrowDown':
            handleArrowDownKey(e);
            break;
        case 'Tab':
            handleTabKey(e);
            break;
    }
}

function handleEnterKey(e) {
    e.preventDefault();
    const command = inputElement.textContent.trim();
    if (command) {
        processCommand(command);
        state.commandHistory.unshift(command);
        state.historyIndex = -1;
        inputElement.textContent = '';

        if (terminalAPI.inputCallbacks.length > 0) {
            const callback = terminalAPI.inputCallbacks.shift();
            callback(command);
        }
    }
}

function handleArrowUpKey(e) {
    e.preventDefault();
    if (state.historyIndex < state.commandHistory.length - 1) {
        state.historyIndex++;
        inputElement.textContent = state.commandHistory[state.historyIndex];
        moveCursorToEnd();
    }
}

function handleArrowDownKey(e) {
    e.preventDefault();
    if (state.historyIndex > -1) {
        state.historyIndex--;
        inputElement.textContent =
            state.historyIndex === -1
                ? ''
                : state.commandHistory[state.historyIndex];
        moveCursorToEnd();
    }
}

function handleTabKey(e) {
    e.preventDefault();
    autocomplete();
}

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
        const modules = await fetchCommandModules();
        const results = await loadModules(modules);
        displayLoadResults(results);
    } catch (error) {
        displayLoadError(error);
    }

    addOutputLine('');
}

async function fetchCommandModules() {
    const response = await fetch('/api/command-modules');
    let modules = await response.json();
    const helpIndex = modules.indexOf('help.js');
    if (helpIndex > -1) {
        modules = ['help.js', ...modules.filter(m => m !== 'help.js')];
    }
    return modules;
}

async function loadModules(modules) {
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
    return await Promise.all(loadPromises);
}

function displayLoadResults(results) {
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
        { text: '\nCommand modules loaded: ', color: 'green', style: 'bold' },
        { text: `${successCount} succeeded, `, color: 'green' },
        {
            text: `${failCount} failed. `,
            color: failCount > 0 ? 'red' : 'green'
        },
        { text: `[${getTimestamp()}]`, color: 'gray' }
    ]);
}

function displayLoadError(error) {
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

export async function initializeTerminal() {
    await loadCommandModules();
    addOutputLine('Type "help" for a list of available commands.');
    updatePrompt();
    inputElement.focus();
}

export function getCurrentDirectory() {
    return state.currentDirectory;
}

export function setCurrentDirectory(newDir) {
    state.currentDirectory = newDir;
    updatePrompt();
}

export function enterEditMode(fileName, initialContent, saveCallback) {
    state.isEditMode = true;
    terminal.innerHTML = '';

    const editorContainer = createEditorContainer(fileName);
    const editorTextarea = createEditorTextarea(initialContent);

    editorContainer.appendChild(createEditorHeader(fileName));
    editorContainer.appendChild(editorTextarea);
    terminal.appendChild(editorContainer);

    editorTextarea.focus();

    editorTextarea.addEventListener('keydown', e =>
        handleEditorKeyDown(e, saveCallback)
    );
}

function createEditorContainer(fileName) {
    const container = document.createElement('div');
    container.id = 'editor-container';
    container.style.cssText =
        'height: 100%; display: flex; flex-direction: column;';
    return container;
}

function createEditorHeader(fileName) {
    const header = document.createElement('div');
    header.textContent = `Editing: ${fileName} (Press Ctrl+S to save, Ctrl+Q to quit)`;
    header.style.cssText = 'padding: 5px; background-color: #333; color: #fff;';
    return header;
}

function createEditorTextarea(initialContent) {
    const textarea = document.createElement('textarea');
    textarea.value = initialContent;
    textarea.style.cssText = `
        flex-grow: 1; width: 100%; background-color: #1e1e1e; color: #f0f0f0;
        border: none; padding: 10px; font-size: 16px; resize: none; outline: none;
        font-family: 'IBM Plex Mono', monospace;
    `;
    textarea.spellcheck = false;
    textarea.setAttribute('autocorrect', 'off');
    textarea.setAttribute('autocapitalize', 'off');
    return textarea;
}

function handleEditorKeyDown(e, saveCallback) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveCallback(e.target.value);
    } else if (e.ctrlKey && e.key === 'q') {
        e.preventDefault();
        exitEditMode();
    }
}

export function exitEditMode() {
    state.isEditMode = false;
    terminal.innerHTML = '';
    terminal.appendChild(output);
    terminal.appendChild(inputLine);
    inputElement.focus();
}

inputElement.addEventListener('input', handleInput);
inputElement.addEventListener('keydown', handleKeyDown);

initializeTerminal();

export { fileSystem, updatePrompt, inputElement };
