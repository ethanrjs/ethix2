import { registerCommand, addOutputLine } from '../terminal.js';

const commandDescriptions = new Map();

export function registerCommandDescription(name, description) {
    commandDescriptions.set(name, description);
}

registerCommand('help', 'show available commands', () => {
    addOutputLine({
        text: 'available commands:',
        color: 'green'
    });
    for (const [name, description] of commandDescriptions) {
        addOutputLine([
            { text: `  ${name} `, color: 'cyan' },
            { text: description, color: 'gray' }
        ]);
    }
});

registerCommandDescription('help', 'show available commands');
