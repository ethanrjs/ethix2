// scriptParser.js
import { addOutputLine, processCommand } from './terminal.js';

class ETXScriptParser {
    constructor() {
        this.variables = {};
    }

    async executeScript(scriptContent) {
        const lines = scriptContent.split('\n');
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#')) {
                i = await this.executeLine(line, i, lines);
            }
        }
    }

    async executeLine(line, index, lines) {
        if (line.startsWith('if ')) {
            return await this.executeIfBlock(index, lines);
        } else if (line.startsWith('for ')) {
            return await this.executeForLoop(index, lines);
        } else if (line.startsWith('set ')) {
            this.executeSet(line);
        } else {
            await this.executeCommand(line);
        }
        return index;
    }

    async executeIfBlock(startIndex, lines) {
        const condition = this.evaluateExpression(lines[startIndex].slice(3));
        let endIndex = startIndex;
        let elseIndex = -1;

        while (endIndex < lines.length) {
            if (lines[endIndex].trim() === 'endif') break;
            if (lines[endIndex].trim() === 'else') elseIndex = endIndex;
            endIndex++;
        }

        if (condition) {
            for (
                let i = startIndex + 1;
                i < (elseIndex !== -1 ? elseIndex : endIndex);
                i++
            ) {
                i = await this.executeLine(lines[i].trim(), i, lines);
            }
        } else if (elseIndex !== -1) {
            for (let i = elseIndex + 1; i < endIndex; i++) {
                i = await this.executeLine(lines[i].trim(), i, lines);
            }
        }

        return endIndex;
    }

    async executeForLoop(startIndex, lines) {
        const forLine = lines[startIndex].slice(4);
        const [variable, start, end] = forLine.split(' ');
        let endIndex = startIndex;

        while (endIndex < lines.length) {
            if (lines[endIndex].trim() === 'endfor') break;
            endIndex++;
        }

        for (let i = parseInt(start); i <= parseInt(end); i++) {
            this.variables[variable] = i;
            for (let j = startIndex + 1; j < endIndex; j++) {
                j = await this.executeLine(lines[j].trim(), j, lines);
            }
        }

        return endIndex;
    }

    executeSet(line) {
        const [_, variable, value] = line.match(/set (\w+) (.+)/);
        this.variables[variable] = this.evaluateExpression(value);
    }

    async executeCommand(command) {
        command = this.replaceVariables(command);
        await processCommand(command, true);
    }

    evaluateExpression(expression) {
        expression = this.replaceVariables(expression);
        try {
            return eval(expression);
        } catch (error) {
            addOutputLine({
                text: `Error evaluating expression: ${expression}`,
                color: 'red'
            });
            return null;
        }
    }

    replaceVariables(str) {
        return str.replace(/\$(\w+)/g, (_, variable) => {
            return this.variables.hasOwnProperty(variable)
                ? this.variables[variable]
                : `$${variable}`;
        });
    }
}

export const scriptParser = new ETXScriptParser();
