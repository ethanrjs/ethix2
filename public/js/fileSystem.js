// fileSystem.js
let fileSystem = JSON.parse(localStorage.getItem('fileSystem')) || {
    '/': {
        type: 'directory',
        contents: {
            home: { type: 'directory', contents: {} },
            packages: { type: 'directory', contents: {} }
        }
    }
};

function saveFileSystem() {
    localStorage.setItem('fileSystem', JSON.stringify(fileSystem));
}

function getDirectoryContents(path) {
    const parts = path.split('/').filter(Boolean);
    let current = fileSystem['/'];
    for (const part of parts) {
        if (current.type !== 'directory' || !current.contents[part]) {
            return null;
        }
        current = current.contents[part];
    }
    return current.type === 'directory' ? current.contents : null;
}

function createDirectory(path) {
    const parts = path.split('/').filter(Boolean);
    let current = fileSystem['/'];
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (i === parts.length - 1) {
            if (current.contents[part]) {
                return false; // Directory already exists
            }
            current.contents[part] = { type: 'directory', contents: {} };
            return true;
        }
        if (
            !current.contents[part] ||
            current.contents[part].type !== 'directory'
        ) {
            return false; // Parent directory doesn't exist
        }
        current = current.contents[part];
    }
    return false;
}

function createFile(path, content) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();
    let current = fileSystem['/'];
    for (const part of parts) {
        if (
            !current.contents[part] ||
            current.contents[part].type !== 'directory'
        ) {
            return false; // Parent directory doesn't exist
        }
        current = current.contents[part];
    }
    current.contents[fileName] = {
        type: 'file',
        content,
        size: new TextEncoder().encode(content).length // Calculate size in bytes
    };
    saveFileSystem();
    return true;
}

export function getFileContents(path) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();
    let current = fileSystem['/'];
    for (const part of parts) {
        if (
            !current.contents[part] ||
            current.contents[part].type !== 'directory'
        ) {
            return null;
        }
        current = current.contents[part];
    }
    if (
        current.contents[fileName] &&
        current.contents[fileName].type === 'file'
    ) {
        return current.contents[fileName].content;
    }
    return null;
}

export function saveFile(path, content) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();
    let current = fileSystem['/'];
    for (const part of parts) {
        if (
            !current.contents[part] ||
            current.contents[part].type !== 'directory'
        ) {
            return false;
        }
        current = current.contents[part];
    }
    if (
        current.contents[fileName] &&
        current.contents[fileName].type === 'file'
    ) {
        current.contents[fileName].content = content;
        current.contents[fileName].size = new TextEncoder().encode(
            content
        ).length;
        saveFileSystem();
        return true;
    }
    return false;
}

function deleteItem(path) {
    const parts = path.split('/').filter(Boolean);
    const itemName = parts.pop();
    let current = fileSystem['/'];
    for (const part of parts) {
        if (
            !current.contents[part] ||
            current.contents[part].type !== 'directory'
        ) {
            return false; // Parent directory doesn't exist
        }
        current = current.contents[part];
    }
    if (current.contents[itemName]) {
        delete current.contents[itemName];
        saveFileSystem();
        return true;
    }
    return false;
}

function getFileSize(path) {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();
    let current = fileSystem['/'];
    for (const part of parts) {
        if (
            !current.contents[part] ||
            current.contents[part].type !== 'directory'
        ) {
            return null;
        }
        current = current.contents[part];
    }
    if (
        current.contents[fileName] &&
        current.contents[fileName].type === 'file'
    ) {
        return current.contents[fileName].size;
    }
    return null;
}

export {
    fileSystem,
    saveFileSystem,
    getDirectoryContents,
    createDirectory,
    createFile,
    deleteItem,
    getFileSize
};
