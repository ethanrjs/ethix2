import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import { getDirectoryContents } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

const COLORS = {
    directory: 'blue',
    file: 'green',
    symlink: 'magenta',
    pipe: 'white',
    count: 'yellow'
};

const STYLES = {
    bold: 'bold',
    italic: 'italic'
};

function getTree(
    path,
    prefix = '',
    isLast = true,
    maxDepth = Infinity,
    currentDepth = 0
) {
    if (currentDepth > maxDepth) {
        return { output: [], dirCount: 0, fileCount: 0 };
    }

    const contents = getDirectoryContents(path);
    const entries = Object.entries(contents);
    let output = [];
    let dirCount = 0;
    let fileCount = 0;

    entries.forEach(([name, item], index) => {
        const isLastItem = index === entries.length - 1;
        const newPrefix = prefix + (isLast ? '    ' : '│   ');
        const linePrefix = prefix + (isLastItem ? '└── ' : '├── ');

        if (item.type === 'directory') {
            output.push({
                text: `${linePrefix}${name}/`,
                color: COLORS.directory,
                style: STYLES.bold
            });
            const subTree = getTree(
                `${path}${name}/`,
                newPrefix,
                isLastItem,
                maxDepth,
                currentDepth + 1
            );
            output = output.concat(subTree.output);
            dirCount += subTree.dirCount + 1;
            fileCount += subTree.fileCount;
        } else if (item.type === 'file') {
            output.push({ text: `${linePrefix}${name}`, color: COLORS.file });
            fileCount++;
        } else if (item.type === 'symlink') {
            output.push({
                text: `${linePrefix}${name} -> ${item.target}`,
                color: COLORS.symlink,
                style: STYLES.italic
            });
            fileCount++;
        }
    });

    return { output, dirCount, fileCount };
}

function tree(args) {
    let path = getCurrentDirectory();
    let maxDepth = Infinity;

    args.forEach((arg, index) => {
        if (arg === '-L' && args[index + 1]) {
            maxDepth = parseInt(args[index + 1], 10);
            if (isNaN(maxDepth)) {
                addOutputLine({
                    text: `Invalid depth value: ${args[index + 1]}`,
                    color: 'red'
                });
                return;
            }
        } else if (!arg.startsWith('-') && index === args.length - 1) {
            path = arg;
        }
    });

    path = path.startsWith('/') ? path : `/${path}`;
    path = path.endsWith('/') ? path : `${path}/`;

    const contents = getDirectoryContents(path);
    if (!contents) {
        addOutputLine({
            text: `tree: '${path}' is not a valid directory`,
            color: 'red'
        });
        return;
    }

    addOutputLine({ text: path, color: COLORS.directory, style: STYLES.bold });

    const { output, dirCount, fileCount } = getTree(path, '', true, maxDepth);

    output.forEach(line => addOutputLine(line));

    addOutputLine({ text: '', color: 'white' });
    addOutputLine({
        text: `${dirCount} director${
            dirCount === 1 ? 'y' : 'ies'
        }, ${fileCount} file${fileCount === 1 ? '' : 's'}`,
        color: COLORS.count,
        style: STYLES.bold
    });
}

registerCommand('tree', 'Display directory structure as a tree', tree);
registerCommandDescription(
    'tree',
    'Display directory structure as a tree. Usage: tree [-L levels] [directory]'
);
