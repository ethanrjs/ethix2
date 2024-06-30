import { getCurrentDirectory } from './terminal.js';

class FileSystem {
    constructor() {
        this.fs = JSON.parse(localStorage.getItem('fileSystem')) || {
            '/': {
                type: 'directory',
                contents: {
                    home: { type: 'directory', contents: {} },
                    packages: { type: 'directory', contents: {} }
                }
            }
        };
    }

    save() {
        localStorage.setItem('fileSystem', JSON.stringify(this.fs));
    }

    resolvePath(path) {
        const currentDir = getCurrentDirectory();
        const segments = (path.startsWith('/') ? path : `${currentDir}/${path}`)
            .split('/')
            .filter(Boolean);

        const resolvedSegments = [];
        for (const segment of segments) {
            if (segment === '.') continue;
            if (segment === '..') {
                if (resolvedSegments.length) resolvedSegments.pop();
                continue;
            }
            resolvedSegments.push(segment);
        }

        return '/' + resolvedSegments.join('/') || '/';
    }

    traversePath(path, createMode = false) {
        const parts = this.resolvePath(path).split('/').filter(Boolean);
        let current = this.fs['/'];

        for (const part of parts) {
            if (current.type !== 'directory') return null;
            if (!current.contents[part]) {
                if (createMode) {
                    current.contents[part] = {
                        type: 'directory',
                        contents: {}
                    };
                } else {
                    return null;
                }
            }
            current = current.contents[part];
        }

        return current;
    }

    getDirectoryContents(path) {
        const dir = this.traversePath(path);
        return dir && dir.type === 'directory' ? dir.contents : null;
    }

    createDirectory(path) {
        const parts = this.resolvePath(path).split('/').filter(Boolean);
        const dirName = parts.pop();
        const parent = this.traversePath(parts.join('/'), true);

        if (!parent || parent.type !== 'directory') return false;
        if (parent.contents[dirName]) return false;

        parent.contents[dirName] = { type: 'directory', contents: {} };
        this.save();
        return true;
    }

    createFile(path, content) {
        const parts = this.resolvePath(path).split('/').filter(Boolean);
        const fileName = parts.pop();
        const parent = this.traversePath(parts.join('/'), true);

        if (!parent || parent.type !== 'directory') return false;

        parent.contents[fileName] = {
            type: 'file',
            content,
            size: new TextEncoder().encode(content).length
        };
        this.save();
        return true;
    }

    getFileContents(path) {
        const file = this.traversePath(path);
        return file && file.type === 'file' ? file.content : null;
    }

    saveFile(path, content) {
        const file = this.traversePath(path);
        if (!file || file.type !== 'file') return false;

        file.content = content;
        file.size = new TextEncoder().encode(content).length;
        this.save();
        return true;
    }

    deleteItem(path) {
        const parts = this.resolvePath(path).split('/').filter(Boolean);
        const itemName = parts.pop();
        const parent = this.traversePath(parts.join('/'));

        if (
            !parent ||
            parent.type !== 'directory' ||
            !parent.contents[itemName]
        )
            return false;

        delete parent.contents[itemName];
        this.save();
        return true;
    }

    getFileSize(path) {
        const file = this.traversePath(path);
        return file && file.type === 'file' ? file.size : null;
    }
}

const fileSystem = new FileSystem();

export const saveFileSystem = fileSystem.save.bind(fileSystem);
export const getDirectoryContents =
    fileSystem.getDirectoryContents.bind(fileSystem);
export const createDirectory = fileSystem.createDirectory.bind(fileSystem);
export const createFile = fileSystem.createFile.bind(fileSystem);
export const getFileContents = fileSystem.getFileContents.bind(fileSystem);
export const saveFile = fileSystem.saveFile.bind(fileSystem);
export const deleteItem = fileSystem.deleteItem.bind(fileSystem);
export const getFileSize = fileSystem.getFileSize.bind(fileSystem);
export const resolvePath = fileSystem.resolvePath.bind(fileSystem);

export { fileSystem };
