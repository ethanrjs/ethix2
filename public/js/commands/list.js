import { registerCommand, addOutputLine } from '../terminal.js';
import { fileSystem } from '../fileSystem.js';

registerCommand('list', 'List installed packages', () => {
    const packages = Object.keys(fileSystem['/'].contents['packages'].contents);
    if (packages.length === 0) {
        addOutputLine('No packages installed.');
    } else {
        addOutputLine('Installed packages:');
        packages.forEach(pkg => addOutputLine(`  ${pkg}`));
    }
});
