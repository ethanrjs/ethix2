import { registerCommand, addOutputLine } from '../terminal.js';

const commandDescriptions = new Map();

export function registerCommandDescription(name, description) {
    commandDescriptions.set(name, description);
}

registerCommand('help', 'Show available commands', () => {
    addOutputLine('Available commands:', { color: 'green', style: 'bold' });
    for (const [name, description] of commandDescriptions) {
        addOutputLine(`  ${name}: ${description}`, { color: 'cyan' });
    }

    addOutputLine(
        '\nTip: You can use colors and styles in your own commands!',
        { color: 'yellow', style: 'italic' }
    );
});

// Register the help command's own description
registerCommandDescription('help', 'Show available commands');
