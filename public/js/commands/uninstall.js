// uninstall.js
import { registerCommand, addOutputLine } from '../terminal.js';
import { fileSystem, deleteItem, saveFileSystem } from '../fileSystem.js';

registerCommand('uninstall', 'Uninstall a package', args => {
    if (args.length === 0) {
        addOutputLine('Usage: uninstall <package-name>');
        return;
    }
    const packageName = args[0];
    const packagesDir = fileSystem['/'].contents['packages'].contents;
    if (packagesDir[packageName]) {
        if (deleteItem(`/packages/${packageName}`)) {
            addOutputLine(`Successfully uninstalled ${packageName}`);
            saveFileSystem();
        } else {
            addOutputLine(`Error uninstalling package: ${packageName}`);
        }
    } else {
        addOutputLine(`Package not found: ${packageName}`);
    }
});
