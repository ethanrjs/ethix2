// install.js
import { registerCommand, addOutputLine } from '../terminal.js';
import {
    fileSystem,
    createDirectory,
    createFile,
    saveFileSystem
} from '../fileSystem.js';

registerCommand('install', 'Install a package', async args => {
    if (args.length === 0) {
        addOutputLine('Usage: install <package-name>');
        return;
    }
    const packageName = args[0];
    const packagesDir = fileSystem['/'].contents['packages'].contents;
    if (packagesDir[packageName]) {
        addOutputLine(`Package ${packageName} is already installed.`);
    } else {
        addOutputLine(`Fetching package ${packageName}...`);
        try {
            const response = await fetch(`/api/packages/${packageName}`);
            if (!response.ok) throw new Error('Package not found');
            const packageData = await response.json();

            createDirectory(`/packages/${packageName}`);
            createFile(`/packages/${packageName}/index.js`, packageData.code);
            addOutputLine(
                `Successfully installed ${packageName} to /packages/${packageName}`
            );
            saveFileSystem();

            // Execute the package
            try {
                eval(packageData.code);
                addOutputLine(`Package ${packageName} executed successfully.`);
            } catch (execError) {
                addOutputLine(
                    `Error executing package ${packageName}: ${execError.message}`
                );
            }
        } catch (error) {
            addOutputLine(`Error installing package: ${error.message}`);
        }
    }
});
