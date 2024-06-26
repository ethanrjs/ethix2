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
    getDirectoryContents,
    getFileContents
} from '../fileSystem.js';
import { terminalAPI } from '../terminalAPI.js';

registerCommand('install', 'Install a package', async args => {
    if (args.length === 0) {
        addOutputLine({
            text: 'Usage: install <package-name> or install <package-path>',
            color: 'red'
        });
        return;
    }

    const packageNameOrPath = args[0];
    const packagesDir = fileSystem['/'].contents['packages'].contents;

    if (packagesDir[packageNameOrPath]) {
        addOutputLine({
            text: `Package ${packageNameOrPath} is already installed.`,
            color: 'yellow'
        });
        return;
    }

    const currentDir = getCurrentDirectory();
    const localPackagePath = `${currentDir}/${packageNameOrPath}`.replace(
        /\/+/g,
        '/'
    );
    const localPackageContents = getDirectoryContents(localPackagePath);

    if (localPackageContents) {
        addOutputLine({
            text: `Installing local package from ${localPackagePath}...`,
            color: 'cyan'
        });

        const packageJsonContent =
            localPackageContents['package.json']?.content;
        if (!packageJsonContent) {
            addOutputLine({
                text: 'Error: package.json not found in the package directory.',
                color: 'red'
            });
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

        addOutputLine({
            text: `Local package ${packageName} installed successfully.`,
            color: 'green'
        });

        await runPackageInitialization(packageName);
    } else {
        addOutputLine({
            text: `Fetching package ${packageNameOrPath}...`,
            color: 'cyan'
        });
        try {
            const packageData = {
                name: packageNameOrPath,
                version: '1.0.0',
                description: `A sample remote package: ${packageNameOrPath}`,
                main: 'index.js',
                code: `
                    import { terminalAPI } from './terminalAPI.js';
                    
                    export function init() {
                        terminalAPI.writeLine('Hello from ${packageNameOrPath}!', { color: 'green' });
                        terminalAPI.writeLine('This is an automatically generated welcome message.', { color: 'cyan' });
                    }
                    
                    export default {
                        greet: () => terminalAPI.writeLine('Greetings from ${packageNameOrPath}!', { color: 'yellow' })
                    };
                `
            };

            createDirectory(`/packages/${packageNameOrPath}`);
            createFile(
                `/packages/${packageNameOrPath}/package.json`,
                JSON.stringify(
                    {
                        name: packageData.name,
                        version: packageData.version,
                        description: packageData.description,
                        main: packageData.main
                    },
                    null,
                    2
                )
            );
            createFile(
                `/packages/${packageNameOrPath}/${packageData.main}`,
                packageData.code
            );

            addOutputLine({
                text: `Package ${packageNameOrPath} installed successfully.`,
                color: 'green'
            });

            await runPackageInitialization(packageNameOrPath);
        } catch (error) {
            addOutputLine({
                text: `Error installing package: ${error.message}`,
                color: 'red'
            });
        }
    }

    saveFileSystem();
});

async function runPackageInitialization(packageName) {
    const packagePath = `/packages/${packageName}`;
    const packageJsonContent = getFileContents(`${packagePath}/package.json`);

    if (packageJsonContent) {
        const packageInfo = JSON.parse(packageJsonContent);
        const mainFile = packageInfo.main || 'index.js';
        const mainFilePath = `${packagePath}/${mainFile}`;
        const mainFileContent = getFileContents(mainFilePath);

        if (mainFileContent) {
            try {
                const executePkg = new Function(
                    'terminalAPI',
                    `
                    return async function() {
                        const module = { exports: {} };
                        const exports = module.exports;
                        ${mainFileContent}
                        if (typeof module.exports.init === 'function') {
                            await module.exports.init();
                        }
                        return module.exports;
                    }
                `
                );

                addOutputLine({
                    text: `Running initialization for ${packageName}...`,
                    color: 'cyan'
                });
                const packageExports = await executePkg(terminalAPI)();

                if (typeof packageExports.run === 'function') {
                    registerCommand(
                        packageName,
                        `Run ${packageName} package`,
                        packageExports.run
                    );
                    addOutputLine({
                        text: `Registered '${packageName}' as a new command.`,
                        color: 'green'
                    });
                }
            } catch (error) {
                addOutputLine({
                    text: `Error initializing package ${packageName}: ${error.message}`,
                    color: 'red'
                });
            }
        }
    }
}
