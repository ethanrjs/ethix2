export class AliasManager {
    constructor() {
        this.aliases = {};
    }

    setAlias(alias, command) {
        this.aliases[alias] = command;
    }

    getAlias(alias) {
        return this.aliases[alias];
    }

    removeAlias(alias) {
        delete this.aliases[alias];
    }

    expandCommand(input) {
        const [cmd, ...args] = input.split(' ');
        const expandedCmd = this.getAlias(cmd) || cmd;
        return `${expandedCmd} ${args.join(' ')}`.trim();
    }
}
