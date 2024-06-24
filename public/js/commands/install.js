// install.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import {
    fileSystem,
    createDirectory,
    createFile,
    saveFileSystem,
    getDirectoryContents
} from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

registerCommand('install', 'Install a package', async args => {
    if (args.length === 0) {
        addOutputLine(
            'Usage: install <package-name> or install <package-path>',
            { color: 'red' }
        );
        return;
    }

    const packageNameOrPath = args[0];
    const packagesDir = fileSystem['/'].contents['packages'].contents;

    if (packagesDir[packageNameOrPath]) {
        addOutputLine(`Package ${packageNameOrPath} is already installed.`, {
            color: 'yellow'
        });
        return;
    }

    // Check if it's a local package
    const currentDir = getCurrentDirectory();
    const localPackagePath = `${currentDir}/${packageNameOrPath}`.replace(
        /\/+/g,
        '/'
    );
    const localPackageContents = getDirectoryContents(localPackagePath);

    if (localPackageContents) {
        // Local package installation
        addOutputLine(`Installing local package from ${localPackagePath}...`, {
            color: 'cyan'
        });

        const packageJsonContent =
            localPackageContents['package.json']?.content;
        if (!packageJsonContent) {
            addOutputLine(
                'Error: package.json not found in the package directory.',
                { color: 'red' }
            );
            return;
        }

        const packageInfo = JSON.parse(packageJsonContent);
        const packageName = packageInfo.name;

        createDirectory(`/packages/${packageName}`);
        Object.entries(localPackageContents).forEach(([fileName, fileData]) => {
            createFile(
                `/packages/${packageName}/${fileName}`,
                fileData.content
            );
        });

        addOutputLine(`Local package ${packageName} installed successfully.`, {
            color: 'green'
        });
    } else {
        // Remote package installation (simulated)
        addOutputLine(`Fetching package ${packageNameOrPath}...`, {
            color: 'cyan'
        });
        try {
            // Simulated remote package data
            const packageData = {
                name: packageNameOrPath,
                version: '1.0.0',
                description: `A sample remote package: ${packageNameOrPath}`,
                code: `console.log('Hello from ${packageNameOrPath}!');\n\nmodule.exports = {\n  greet: () => console.log('Greetings from ${packageNameOrPath}!')\n};`
            };

            createDirectory(`/packages/${packageNameOrPath}`);
            createFile(
                `/packages/${packageNameOrPath}/package.json`,
                JSON.stringify(
                    {
                        name: packageData.name,
                        version: packageData.version,
                        description: packageData.description
                    },
                    null,
                    2
                )
            );
            createFile(
                `/packages/${packageNameOrPath}/index.js`,
                packageData.code
            );

            addOutputLine(
                `Package ${packageNameOrPath} installed successfully.`,
                { color: 'green' }
            );
        } catch (error) {
            addOutputLine(`Error installing package: ${error.message}`, {
                color: 'red'
            });
        }
    }

    saveFileSystem();
});

registerCommandDescription('install', 'Install a package (local or remote)');
