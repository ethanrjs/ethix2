import { registerCommand, addOutputLine } from '../terminal.js';

const colorMap = {
    black: 'black',
    red: 'red',
    green: 'green',
    yellow: 'yellow',
    blue: 'blue',
    magenta: 'magenta',
    cyan: 'cyan',
    white: 'white',
    gray: 'gray'
};

function parseColoredText(text) {
    const segments = [];
    const stack = [];
    let currentText = '';
    let i = 0;

    while (i < text.length) {
        if (text.startsWith('{{', i)) {
            const endIndex = text.indexOf('}}', i);
            if (endIndex !== -1) {
                if (currentText) {
                    segments.push({
                        text: currentText,
                        color: stack[stack.length - 1] || null
                    });
                    currentText = '';
                }
                const color = text.slice(i + 2, endIndex).toLowerCase();
                if (color in colorMap) {
                    stack.push(colorMap[color]);
                } else if (color === '') {
                    stack.pop();
                }
                i = endIndex + 2;
            } else {
                currentText += text[i];
                i++;
            }
        } else {
            currentText += text[i];
            i++;
        }
    }

    if (currentText) {
        segments.push({
            text: currentText,
            color: stack[stack.length - 1] || null
        });
    }

    return segments;
}

registerCommand('echo', 'Print arguments to the terminal with optional color formatting', args => {
    const fullText = args.join(' ');
    const segments = parseColoredText(fullText);
    addOutputLine(segments.filter(segment => segment.text));
});
