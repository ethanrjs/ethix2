import { registerCommand, addOutputLine } from '../terminal.js';

const commandDescriptions = new Map();

export function registerCommandDescription(name, description) {
    commandDescriptions.set(name, description);
}

registerCommand('help', 'Show available commands', () => {
    addOutputLine({
        text: 'Available commands:',
        color: 'green',
        style: 'bold'
    });
    for (const [name, description] of commandDescriptions) {
        addOutputLine({ text: `  ${name}: ${description}`, color: 'cyan' });
    }
});

// Register the help command's own description
registerCommandDescription('help', 'Show available commands');
