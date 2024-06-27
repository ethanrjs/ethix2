import {
    registerCommand,
    addOutputLine,
    getCurrentDirectory
} from '../terminal.js';
import {
    fileSystem,
    getDirectoryContents,
    getFileContents
} from '../fileSystem.js';
import { terminalAPI } from '../terminalAPI.js';
import { registerCommandDescription } from './help.js';

const COLORS = {
    fileName: '#00ff00',
    filePath: '#87cefa',
    matchedText: '#ff1493',
    header: '#ff4500',
    contentMatch: '#ffa500',
    directoryName: '#4169E1'
};

function colorize(text, color) {
    return `<span style="color: ${color};">${text}</span>`;
}

function fuzzyMatch(text, pattern) {
    let score = 0;
    let lastIndex = -1;
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i].toLowerCase();
        const index = text.toLowerCase().indexOf(c, lastIndex + 1);
        if (index === -1) return 0;
        score += 1 / (index - lastIndex);
        lastIndex = index;
    }
    return score;
}

function highlightMatches(text, pattern) {
    let result = '';
    let lastIndex = 0;
    for (let i = 0; i < pattern.length; i++) {
        const c = pattern[i].toLowerCase();
        const index = text.toLowerCase().indexOf(c, lastIndex);
        if (index === -1) break;
        result += text.substring(lastIndex, index);
        result += colorize(text[index], COLORS.matchedText);
        lastIndex = index + 1;
    }
    result += text.substring(lastIndex);
    return result;
}

function searchFiles(searchTerm, searchContent = false, currentPath = '/') {
    const results = [];
    const contents = getDirectoryContents(currentPath);

    for (const [name, item] of Object.entries(contents)) {
        const fullPath = `${currentPath}${name}`;
        const nameScore = fuzzyMatch(name, searchTerm);

        if (item.type === 'directory') {
            if (nameScore > 0) {
                results.push({
                    name,
                    path: fullPath,
                    type: 'directory',
                    score: nameScore,
                    nameScore,
                    contentMatches: []
                });
            }
            // Continue searching inside the directory
            results.push(
                ...searchFiles(searchTerm, searchContent, `${fullPath}/`)
            );
        } else if (item.type === 'file') {
            let contentMatches = [];

            if (searchContent) {
                const fileContent = getFileContents(fullPath);
                const lines = fileContent.split('\n');
                for (let i = 0; i < lines.length; i++) {
                    const lineScore = fuzzyMatch(lines[i], searchTerm);
                    if (lineScore > 0) {
                        contentMatches.push({
                            line: i + 1,
                            content: lines[i],
                            score: lineScore
                        });
                    }
                }
            }

            const totalScore = nameScore + (contentMatches.length > 0 ? 1 : 0);

            if (totalScore > 0 || contentMatches.length > 0) {
                results.push({
                    name,
                    path: fullPath,
                    type: 'file',
                    score: totalScore,
                    nameScore,
                    contentMatches
                });
            }
        }
    }

    return results;
}

function renderResults(results, searchTerm, limit = 10) {
    const header = colorize('=== Results ===', COLORS.header);
    addOutputLine(header);

    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.contentMatches.length - a.contentMatches.length;
    });

    const topResults = results.slice(0, limit);

    topResults.forEach(result => {
        let line = '';
        line +=
            colorize(
                highlightMatches(result.name, searchTerm),
                result.type === 'directory'
                    ? COLORS.directoryName
                    : COLORS.fileName
            ) + ' ';
        line += colorize(result.path, COLORS.filePath);
        addOutputLine(line);

        if (result.type === 'file') {
            result.contentMatches.forEach(
                ({ line: lineNumber, content, score }) => {
                    const contentLine = `  ${lineNumber}]: ${highlightMatches(
                        content.trim(),
                        searchTerm
                    )}`;
                    addOutputLine(colorize(contentLine, COLORS.contentMatch));
                }
            );
        }
    });

    if (results.length > limit) {
        addOutputLine(`... and ${results.length - limit} more results`);
    }
}

function fzf(args) {
    const searchContent = args[0] === '-c';
    const searchTerm = searchContent ? args.slice(1).join(' ') : args.join(' ');

    if (!searchTerm) {
        addOutputLine({ text: 'Usage: fzf [-c] <search term>', color: 'red' });
        return;
    }

    const results = searchFiles(searchTerm, searchContent);
    renderResults(results, searchTerm);

    addOutputLine({
        text: `\nTotal files with matches: ${results.length}`,
        color: 'cyan'
    });

    const totalMatches = results.reduce(
        (sum, result) => sum + result.contentMatches.length,
        0
    );
    addOutputLine({
        text: `Total matching lines: ${totalMatches}`,
        color: 'cyan'
    });
}
registerCommand('fzf', 'Fuzzy find files and content', fzf);
registerCommandDescription(
    'fzf',
    'Fuzzy find files and content. Use -c to search file contents.'
);
