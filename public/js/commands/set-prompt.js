import { registerCommand } from '../terminal.js';

registerCommand('set-prompt', 'Set custom prompt format', args => {
    if (args.length === 0) {
        addOutputLine('Current prompt format: ' + customPrompt.format);
    } else {
        customPrompt.setFormat(args.join(' '));
        updatePrompt();
        addOutputLine('Prompt format updated');
    }
});
