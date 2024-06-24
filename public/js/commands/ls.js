// ls.js
import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory,
    fileSystem
} from '../terminal.js';
import { getDirectoryContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

const MONTH_NAMES = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
];

function formatDate(timestamp) {
    const date = new Date(timestamp);
    const month = MONTH_NAMES[date.getMonth()];
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${month} ${day} ${hours}:${minutes}`;
}

function formatSize(size) {
    const units = ['B', 'K', 'M', 'G', 'T'];
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    if (unitIndex === 0) {
        // For bytes, return without decimal places
        return `${Math.round(size)}${units[unitIndex]}`;
    } else {
        // For KB and above, keep one decimal place
        return `${size.toFixed(1)}${units[unitIndex]}`;
    }
}

function padRight(str, length) {
    return str.padEnd(length, ' ');
}

registerCommand('ls', 'List directory contents', args => {
    const path = args.length > 0 ? resolvePath(args[0]) : getCurrentDirectory();
    const contents = getDirectoryContents(path);
    if (contents) {
        addOutputLine(`Contents of ${path}:`, {
            color: 'yellow',
            style: 'bold'
        });

        const items = Object.entries(contents).map(([name, item]) => {
            const itemType = item.type === 'directory' ? 'd' : '-';
            const permissions = 'rwxrwxrwx'; // Simulated permissions i cba to add permissions to this tbh
            const size = formatSize(item.size || 0);
            const modifiedDate = formatDate(item.modifiedDate || Date.now());
            return {
                name,
                itemType,
                permissions,
                size,
                modifiedDate,
                isDirectory: item.type === 'directory'
            };
        });

        const headers = ['Type', 'Permissions', 'Size', 'Modified', 'Name'];

        // Calculate maximum lengths for alignment
        const maxLengths = headers.reduce((acc, header) => {
            acc[header.toLowerCase()] = Math.max(
                header.length,
                ...items.map(item => {
                    switch (header.toLowerCase()) {
                        case 'type':
                            return item.itemType.length;
                        case 'permissions':
                            return item.permissions.length;
                        case 'size':
                            return item.size.length;
                        case 'modified':
                            return item.modifiedDate.length + 1;
                        case 'name':
                            return item.name.length;
                        default:
                            return 0;
                    }
                })
            );
            return acc;
        }, {});

        // Header
        const headerLine = headers
            .map(header =>
                padRight(header, maxLengths[header.toLowerCase()] - 1)
            ) // god only knows why the -1 is needed to fix the name column
            .join(' ');
        addOutputLine(headerLine, { color: 'gray' });

        // Content
        items.forEach(item => {
            const line = [
                padRight(item.itemType, maxLengths.type),
                padRight(item.permissions, maxLengths.permissions),
                padRight(item.size, maxLengths.size),
                padRight(item.modifiedDate, maxLengths.modified),
                item.name
            ].join(' ');

            addOutputLine([
                {
                    text: padRight(item.itemType, maxLengths.type + 1),
                    color: item.isDirectory ? 'cyan' : 'white'
                },
                {
                    text: padRight(
                        item.permissions,
                        maxLengths.permissions + 1
                    ),
                    color: 'gray'
                },
                {
                    text: padRight(item.size, maxLengths.size + 1),
                    color: 'green'
                },
                {
                    text: padRight(item.modifiedDate, maxLengths.modified),
                    color: 'yellow'
                },
                { text: item.name, color: item.isDirectory ? 'cyan' : 'white' }
            ]);
        });
    } else {
        addOutputLine(
            `ls: cannot access '${path}': No such file or directory`,
            { color: 'red' }
        );
    }
});

registerCommandDescription('ls', 'List directory contents');

function resolvePath(path) {
    const currentDir = getCurrentDirectory();

    const absolutePath = path.startsWith('/') ? path : `${currentDir}/${path}`;
    const segments = absolutePath.split('/').filter(segment => segment !== '');

    const resolvedSegments = [];

    for (const segment of segments) {
        if (segment === '.') {
            continue;
        } else if (segment === '..') {
            if (resolvedSegments.length > 0) {
                resolvedSegments.pop();
            }
        } else {
            resolvedSegments.push(segment);
        }
    }

    let resolvedPath = '/' + resolvedSegments.join('/');
    if (resolvedPath === '') {
        resolvedPath = '/';
    }

    return resolvedPath;
}
