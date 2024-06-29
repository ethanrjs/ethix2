import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import {
    createDirectory,
    createFile,
    saveFileSystem,
    getDirectoryContents,
    getFileContents,
    deleteItem
} from '../fileSystem.js';
import { terminalAPI } from '../terminalAPI.js';
import { registerCommandDescription } from './help.js';

async function installPackage(packageNameOrPath) {
    const packagesDir = getDirectoryContents('/packages');
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

        const packageJsonContent = getFileContents(
            `${localPackagePath}/package.json`
        );
        if (!packageJsonContent) {
            addOutputLine({
                text: 'Error: package.json not found in the package directory.',
                color: 'red'
            });
            return;
        }

        const packageInfo = JSON.parse(packageJsonContent);
        const packageName = packageInfo.name;

        if (packagesDir[packageName]) {
            addOutputLine({
                text: `Package ${packageName} is already installed.`,
                color: 'yellow'
            });
            return;
        }

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
    } else {
        addOutputLine({
            text: `Fetching package ${packageNameOrPath}...`,
            color: 'cyan'
        });

        try {
            const response = await fetch(`/api/packages/${packageNameOrPath}`);
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch package information for ${packageNameOrPath}`
                );
            }
            const packageInfo = await response.json();

            if (packagesDir[packageInfo.name]) {
                addOutputLine({
                    text: `Package ${packageInfo.name} is already installed.`,
                    color: 'yellow'
                });
                return;
            }

            createDirectory(`/packages/${packageInfo.name}`);
            createFile(
                `/packages/${packageInfo.name}/package.json`,
                JSON.stringify(packageInfo, null, 2)
            );
            createFile(
                `/packages/${packageInfo.name}/index.js`,
                packageInfo.code
            );

            addOutputLine({
                text: `Package ${packageInfo.name} installed successfully.`,
                color: 'green'
            });
        } catch (error) {
            addOutputLine({
                text: `Error installing package: ${error.message}`,
                color: 'red'
            });
            return;
        }
    }

    saveFileSystem();
    await runPackageInitialization(packageNameOrPath);
}

async function uninstallPackage(packageName) {
    const packagesDir = getDirectoryContents('/packages');
    if (packagesDir[packageName]) {
        if (deleteItem(`/packages/${packageName}`)) {
            addOutputLine({
                text: `Successfully uninstalled ${packageName}`,
                color: 'green'
            });
            saveFileSystem();
        } else {
            addOutputLine({
                text: `Error uninstalling package: ${packageName}`,
                color: 'red'
            });
        }
    } else {
        addOutputLine({
            text: `Package not found: ${packageName}`,
            color: 'yellow'
        });
    }
}

function listPackages() {
    const packages = Object.keys(getDirectoryContents('/packages'));
    if (packages.length === 0) {
        addOutputLine({ text: 'No packages installed.', color: 'yellow' });
    } else {
        addOutputLine({ text: 'Installed packages:', color: 'cyan' });
        packages.forEach(pkg => addOutputLine(`  ${pkg}`));
    }
}

function createPackage(packageName) {
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
    addOutputLine({ text: `epm install ${packageDir}`, color: 'yellow' });
}

async function publishPackage(packageName) {
    const currentDir = getCurrentDirectory();
    const packagePath = `${currentDir}/${packageName}`.replace(/\/+/g, '/');

    const packageContents = getDirectoryContents(packagePath);

    if (!packageContents) {
        addOutputLine({
            text: `Package directory "${packageName}" not found.`,
            color: 'red'
        });
        return;
    }

    addOutputLine({
        text: `Publishing package ${packageName}...`,
        color: 'cyan'
    });

    try {
        const packageJsonContent = getFileContents(
            `${packagePath}/package.json`
        );
        if (!packageJsonContent) {
            throw new Error('package.json not found in the package directory.');
        }

        const packageInfo = JSON.parse(packageJsonContent);
        const indexJsContent = getFileContents(`${packagePath}/index.js`);
        if (!indexJsContent) {
            throw new Error('index.js not found in the package directory.');
        }

        packageInfo.code = indexJsContent;

        const response = await fetch('/api/packages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(packageInfo)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to publish package');
        }

        const result = await response.json();
        addOutputLine({
            text: `Package ${packageName} published successfully.`,
            color: 'green'
        });
        addOutputLine({ text: `Version: ${result.version}`, color: 'yellow' });
    } catch (error) {
        addOutputLine({
            text: `Error publishing package: ${error.message}`,
            color: 'red'
        });
    }
}

async function updatePackage(packageName) {
    try {
        const response = await fetch(`/api/packages/${packageName}`);
        if (!response.ok) {
            throw new Error(
                `Package ${packageName} does not exist or repository is down`
            );
        }
        const packageInfo = await response.json();

        const packagesDir = getDirectoryContents('/packages');
        if (!packagesDir[packageName]) {
            throw new Error(`Package ${packageName} is not installed`);
        }

        const installedVersion = JSON.parse(
            getFileContents(`/packages/${packageName}/package.json`)
        ).version;
        if (installedVersion === packageInfo.version) {
            addOutputLine({
                text: `Package ${packageName} is already up to date (version ${installedVersion})`,
                color: 'green'
            });
            return false;
        }

        addOutputLine({
            text: `Updating ${packageName} from version ${installedVersion} to ${packageInfo.version}...`,
            color: 'cyan'
        });

        deleteItem(`/packages/${packageName}`);

        createDirectory(`/packages/${packageName}`);
        createFile(
            `/packages/${packageName}/package.json`,
            JSON.stringify(packageInfo, null, 2)
        );
        createFile(`/packages/${packageName}/index.js`, packageInfo.code);

        addOutputLine({
            text: `Package ${packageName} updated successfully to version ${packageInfo.version}`,
            color: 'green'
        });
        saveFileSystem();

        await runPackageInitialization(packageName);
        return true;
    } catch (error) {
        addOutputLine({
            text: `Error updating package ${packageName}: ${error.message}`,
            color: 'red'
        });
        return false;
    }
}

async function updateAllPackages() {
    const packagesDir = getDirectoryContents('/packages');
    const packageNames = Object.keys(packagesDir);

    if (packageNames.length === 0) {
        addOutputLine({ text: 'No packages installed.', color: 'yellow' });
        return;
    }

    addOutputLine({ text: 'Checking for updates...', color: 'cyan' });

    let updatedCount = 0;
    let upToDateCount = 0;
    let errorCount = 0;

    for (const packageName of packageNames) {
        addOutputLine({ text: `Checking ${packageName}...`, color: 'cyan' });
        const updateResult = await updatePackage(packageName);
        if (updateResult === true) {
            updatedCount++;
        } else if (updateResult === false) {
            upToDateCount++;
        } else {
            errorCount++;
        }
    }

    addOutputLine({ text: '\nUpdate summary:', color: 'cyan' });
    addOutputLine({
        text: `  ${updatedCount} package(s) updated`,
        color: 'green'
    });
    addOutputLine({
        text: `  ${upToDateCount} package(s) already up to date`,
        color: 'yellow'
    });
    if (errorCount > 0) {
        addOutputLine({
            text: `  ${errorCount} package(s) failed to update`,
            color: 'red'
        });
    }
}

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

registerCommand('epm', 'ETHIX Package Manager', async args => {
    if (args.length === 0) {
        addOutputLine({
            text: 'Usage: epm (command) [options]',
            color: 'yellow'
        });
        addOutputLine({ text: 'Commands:', color: 'cyan' });
        addOutputLine('  install <package>  - Install a package');
        addOutputLine('  uninstall <package>  - Uninstall a package');
        addOutputLine('  list  - List installed packages');
        addOutputLine('  create <package>  - Create a new package');
        addOutputLine('  publish <package>  - Publish a package');
        addOutputLine('  update <package>  - Update a package');
        return;
    }

    const [command, ...options] = args;

    switch (command) {
        case 'install':
            if (options.length === 0) {
                addOutputLine({
                    text: 'Usage: epm install <package>',
                    color: 'red'
                });
            } else {
                await installPackage(options[0]);
            }
            break;
        case 'uninstall':
            if (options.length === 0) {
                addOutputLine({
                    text: 'Usage: epm uninstall <package>',
                    color: 'red'
                });
            } else {
                uninstallPackage(options[0]);
            }
            break;
        case 'list':
            listPackages();
            break;
        case 'create':
            if (options.length === 0) {
                addOutputLine({
                    text: 'Usage: epm create <package>',
                    color: 'red'
                });
            } else {
                createPackage(options[0]);
            }
            break;
        case 'publish':
            if (options.length === 0) {
                addOutputLine({
                    text: 'Usage: epm publish <package>',
                    color: 'red'
                });
            } else {
                await publishPackage(options[0]);
            }
            break;
        case 'update':
            if (options.length === 0) {
                await updateAllPackages();
            } else {
                await updatePackage(options[0]);
            }
            break;
        default:
            addOutputLine({
                text: `Unknown command: ${command}`,
                color: 'red'
            });
            addOutputLine({
                text: 'Use "epm" without arguments to see available commands.',
                color: 'yellow'
            });
    }
});

registerCommandDescription(
    'epm',
    'ETHIX Package Manager - Manage packages (install, uninstall, list, create, publish, update)'
);
