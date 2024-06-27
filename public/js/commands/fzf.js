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
    contentMatch: '#ffa500'
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

        if (item.type === 'file') {
            const nameScore = fuzzyMatch(name, searchTerm);
            let contentScore = 0;
            let contentMatch = null;

            if (searchContent) {
                const fileContent = getFileContents(fullPath);
                contentScore = fuzzyMatch(fileContent, searchTerm);
                if (contentScore > 0) {
                    const lines = fileContent.split('\n');
                    for (let i = 0; i < lines.length; i++) {
                        if (fuzzyMatch(lines[i], searchTerm) > 0) {
                            contentMatch = { line: i + 1, content: lines[i] };
                            break;
                        }
                    }
                }
            }

            const totalScore = nameScore + contentScore;

            if (totalScore > 0) {
                results.push({
                    name,
                    path: fullPath,
                    type: 'file',
                    score: totalScore,
                    contentMatch
                });
            }
        } else if (item.type === 'directory') {
            results.push(
                ...searchFiles(searchTerm, searchContent, `${fullPath}/`)
            );
        }
    }

    return results;
}

function renderResults(results, searchTerm, limit = 10) {
    const header = colorize('=== Results ===', COLORS.header);
    addOutputLine(header);

    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, limit);

    topResults.forEach(result => {
        let line = '';
        line +=
            colorize(
                highlightMatches(result.name, searchTerm),
                COLORS.fileName
            ) + ' ';
        line += colorize(result.path, COLORS.filePath);
        addOutputLine(line);

        if (result.contentMatch) {
            const { line: lineNumber, content } = result.contentMatch;
            const contentLine = `  Line ${lineNumber}: ${highlightMatches(
                content.trim(),
                searchTerm
            )}`;
            addOutputLine(colorize(contentLine, COLORS.contentMatch));
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
        text: `\nTotal results: ${results.length}`,
        color: 'cyan'
    });
}

registerCommand('fzf', 'Fuzzy find files and content', fzf);
registerCommandDescription(
    'fzf',
    'Fuzzy find files and content. Use -c to search file contents.'
);
