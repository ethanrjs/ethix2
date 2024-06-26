// publish.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import { getDirectoryContents, getFileContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

async function publishPackage(packagePath) {
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

        return await response.json();
    } catch (error) {
        throw error;
    }
}

registerCommand(
    'publish',
    'Publish a package to the repository',
    async args => {
        if (args.length < 1) {
            addOutputLine({
                text: 'Usage: publish <package-name>',
                color: 'red'
            });
            return;
        }

        const packageName = args[0];
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
            const result = await publishPackage(packagePath);
            addOutputLine({
                text: `Package ${packageName} published successfully.`,
                color: 'green'
            });
            addOutputLine({
                text: `Version: ${result.version}`,
                color: 'yellow'
            });
        } catch (error) {
            addOutputLine({
                text: `Error publishing package: ${error.message}`,
                color: 'red'
            });
        }
    }
);

registerCommandDescription('publish', 'Publish a package to the repository');
