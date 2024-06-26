// create-package.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import {
    createDirectory,
    createFile,
    getDirectoryContents
} from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('create-package', 'Create a new package', args => {
    if (args.length < 1) {
        addOutputLine({
            text: 'Usage: create-package <package-name>',
            color: 'red'
        });
        return;
    }

    const packageName = args[0];
    const currentDir = getCurrentDirectory();
    const packageDir = `${currentDir}/${packageName}`.replace(/\/+/g, '/');

    if (getDirectoryContents(packageDir)) {
        addOutputLine({
            text: `Package "${packageName}" already exists.`,
            color: 'red'
        });
        return;
    }

    createDirectory(packageDir);
    createFile(
        `${packageDir}/package.json`,
        JSON.stringify(
            {
                name: packageName,
                version: '1.0.0',
                description: 'A sample package',
                main: 'index.js'
            },
            null,
            2
        )
    );

    createFile(
        `${packageDir}/index.js`,
        `console.log('Hello from ${packageName}!');\n\nmodule.exports = {\n  greet: () => console.log('Greetings from ${packageName}!')\n};`
    );

    addOutputLine({
        text: `Package "${packageName}" created successfully.`,
        color: 'green'
    });
    addOutputLine({ text: 'To install this package, use:', color: 'cyan' });
    addOutputLine({ text: `install ${packageDir}`, color: 'yellow' });
});

registerCommandDescription('create-package', 'Create a new package');
