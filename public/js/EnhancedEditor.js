class EnhancedEditor {
    constructor() {
        this.container = null;
        this.editor = null;
        this.lineNumbers = null;
        this.content = '';
        this.fileName = '';
        this.saveCallback = null;
        this.isVisible = false;
        
        // ETX Script syntax highlighting patterns
        this.etxPatterns = [
            { pattern: /^#.*$/gm, className: 'comment' },
            { pattern: /\b(if|elif|else|endif|while|endwhile|for|endfor|function|endfunction|try|catch|endtry|return|break|continue|set|unset|import)\b/g, className: 'keyword' },
            { pattern: /\b(echo|ls|cd|cat|mkdir|rm|cp|mv|touch|grep|find|chmod|chown|ps|kill|curl|wget)\b/g, className: 'command' },
            { pattern: /\$\w+(?:\[[^\]]+\])?/g, className: 'variable' },
            { pattern: /\b\d+\.?\d*\b/g, className: 'number' },
            { pattern: /\b(true|false|null)\b/g, className: 'boolean' },
            { pattern: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g, className: 'string' },
            { pattern: /[<>=!]=?|[+\-*/%]|&&|\|\||!|\b(and|or|not)\b/g, className: 'operator' },
            { pattern: /[{}()\[\]]/g, className: 'bracket' },
            { pattern: /\w+\s*\(/g, className: 'function-call' }
        ];
    }

    show(fileName, initialContent, saveCallback) {
        this.fileName = fileName;
        this.content = initialContent;
        this.saveCallback = saveCallback;
        this.isVisible = true;
        
        this.createEditor();
        this.updateContent();
        this.setupEventListeners();
        this.focusEditor();
    }

    hide() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
        this.isVisible = false;
        this.container = null;
        this.editor = null;
        this.lineNumbers = null;
    }

    createEditor() {
        // Create main container
        this.container = document.createElement('div');
        this.container.id = 'enhanced-editor';
        this.container.innerHTML = `
            <div class="editor-header">
                <div class="editor-title">
                    <span class="file-icon">${this.getFileIcon()}</span>
                    <span class="file-name">${this.fileName}</span>
                    <span class="file-status" id="file-status"></span>
                </div>
                <div class="editor-controls">
                    <button class="editor-btn" id="save-btn" title="Save (Ctrl+S)">💾</button>
                    <button class="editor-btn" id="close-btn" title="Close (Ctrl+Q)">✕</button>
                </div>
            </div>
            <div class="editor-body">
                <div class="line-numbers" id="line-numbers"></div>
                <div class="editor-content">
                    <textarea id="editor-textarea" spellcheck="false" autocorrect="off" autocapitalize="off"></textarea>
                    <div class="syntax-overlay" id="syntax-overlay"></div>
                </div>
            </div>
            <div class="editor-footer">
                <span class="editor-info">
                    Line: <span id="current-line">1</span> | 
                    Column: <span id="current-column">1</span> | 
                    Length: <span id="content-length">0</span>
                </span>
                <span class="editor-shortcuts">
                    Ctrl+S: Save | Ctrl+Q: Close | Ctrl+F: Find
                </span>
            </div>
        `;

        // Get references to elements
        this.editor = this.container.querySelector('#editor-textarea');
        this.lineNumbers = this.container.querySelector('#line-numbers');
        this.syntaxOverlay = this.container.querySelector('#syntax-overlay');

        // Append to terminal
        const terminal = document.getElementById('terminal');
        terminal.innerHTML = '';
        terminal.appendChild(this.container);
    }

    getFileIcon() {
        const ext = this.fileName.split('.').pop().toLowerCase();
        switch (ext) {
            case 'etx': return '📜';
            case 'js': return '📄';
            case 'json': return '📋';
            case 'md': return '📝';
            case 'txt': return '📄';
            default: return '📄';
        }
    }

    updateContent() {
        this.editor.value = this.content;
        this.updateLineNumbers();
        this.updateSyntaxHighlighting();
        this.updateStatusInfo();
    }

    updateLineNumbers() {
        const lines = this.editor.value.split('\n');
        const lineCount = lines.length;
        const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) => 
            `<div class="line-number">${i + 1}</div>`
        ).join('');
        this.lineNumbers.innerHTML = lineNumbersHtml;
    }

    updateSyntaxHighlighting() {
        if (!this.fileName.endsWith('.etx')) {
            this.syntaxOverlay.innerHTML = '';
            return;
        }

        const content = this.editor.value;
        const lines = content.split('\n');
        const highlightedLines = lines.map(line => this.highlightLine(line));
        
        this.syntaxOverlay.innerHTML = highlightedLines.join('\n') + ' ';
    }

    highlightLine(line) {
        if (!line.trim()) return '';
        
        // Handle comments first (entire line)
        if (line.trim().startsWith('#')) {
            return `<span class="syntax-comment">${this.escapeHtml(line)}</span>`;
        }
        
        let result = '';
        let i = 0;
        
        while (i < line.length) {
            let matched = false;
            
            // Try to match patterns at current position
            const remaining = line.slice(i);
            
            // String literals
            const stringMatch = remaining.match(/^(['"])((?:\\.|(?!\1)[^\\])*?)\1/);
            if (stringMatch) {
                result += `<span class="syntax-string">${this.escapeHtml(stringMatch[0])}</span>`;
                i += stringMatch[0].length;
                matched = true;
            }
            
            // Variables
            else if (remaining.match(/^\$\w+(?:\[[^\]]*\])?/)) {
                const varMatch = remaining.match(/^\$\w+(?:\[[^\]]*\])?/)[0];
                result += `<span class="syntax-variable">${this.escapeHtml(varMatch)}</span>`;
                i += varMatch.length;
                matched = true;
            }
            
            // Numbers
            else if (remaining.match(/^\b\d+\.?\d*\b/)) {
                const numMatch = remaining.match(/^\b\d+\.?\d*\b/)[0];
                result += `<span class="syntax-number">${this.escapeHtml(numMatch)}</span>`;
                i += numMatch.length;
                matched = true;
            }
            
            // Keywords
            else if (remaining.match(/^\b(if|elif|else|endif|while|endwhile|for|endfor|function|endfunction|try|catch|endtry|return|break|continue|set|unset|import)\b/)) {
                const keywordMatch = remaining.match(/^\b(if|elif|else|endif|while|endwhile|for|endfor|function|endfunction|try|catch|endtry|return|break|continue|set|unset|import)\b/)[0];
                result += `<span class="syntax-keyword">${this.escapeHtml(keywordMatch)}</span>`;
                i += keywordMatch.length;
                matched = true;
            }
            
            // Commands
            else if (remaining.match(/^\b(echo|ls|cd|cat|mkdir|rm|cp|mv|touch|grep|find|chmod|chown|ps|kill|curl|wget)\b/)) {
                const cmdMatch = remaining.match(/^\b(echo|ls|cd|cat|mkdir|rm|cp|mv|touch|grep|find|chmod|chown|ps|kill|curl|wget)\b/)[0];
                result += `<span class="syntax-command">${this.escapeHtml(cmdMatch)}</span>`;
                i += cmdMatch.length;
                matched = true;
            }
            
            // Booleans
            else if (remaining.match(/^\b(true|false|null)\b/)) {
                const boolMatch = remaining.match(/^\b(true|false|null)\b/)[0];
                result += `<span class="syntax-boolean">${this.escapeHtml(boolMatch)}</span>`;
                i += boolMatch.length;
                matched = true;
            }
            
            // Function calls
            else if (remaining.match(/^\w+\s*(?=\()/)) {
                const funcMatch = remaining.match(/^\w+/)[0];
                result += `<span class="syntax-function-call">${this.escapeHtml(funcMatch)}</span>`;
                i += funcMatch.length;
                matched = true;
            }
            
            // Operators
            else if (remaining.match(/^(<=|>=|==|!=|&&|\|\||[<>=!+\-*/%])/)) {
                const opMatch = remaining.match(/^(<=|>=|==|!=|&&|\|\||[<>=!+\-*/%])/)[0];
                result += `<span class="syntax-operator">${this.escapeHtml(opMatch)}</span>`;
                i += opMatch.length;
                matched = true;
            }
            
            // Brackets
            else if (remaining.match(/^[{}()\[\]]/)) {
                const bracketMatch = remaining.match(/^[{}()\[\]]/)[0];
                result += `<span class="syntax-bracket">${this.escapeHtml(bracketMatch)}</span>`;
                i += bracketMatch.length;
                matched = true;
            }
            
            // Default: add character as-is
            if (!matched) {
                result += this.escapeHtml(line[i]);
                i++;
            }
        }
        
        return result;
    }

    updateStatusInfo() {
        const cursorPos = this.getCursorPosition();
        const lines = this.editor.value.split('\n');
        
        document.getElementById('current-line').textContent = cursorPos.line;
        document.getElementById('current-column').textContent = cursorPos.column;
        document.getElementById('content-length').textContent = this.editor.value.length;
        
        // Update file status
        const status = this.content !== this.editor.value ? '● Modified' : '✓ Saved';
        const statusElement = document.getElementById('file-status');
        statusElement.textContent = status;
        statusElement.className = this.content !== this.editor.value ? 'modified' : 'saved';
    }

    getCursorPosition() {
        const textarea = this.editor;
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        
        return {
            line: lines.length,
            column: lines[lines.length - 1].length + 1
        };
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    setupEventListeners() {
        // Keyboard shortcuts
        this.editor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.save();
            } else if (e.ctrlKey && e.key === 'q') {
                e.preventDefault();
                this.close();
            } else if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                this.showFindDialog();
            }
        });

        // Content change handlers
        this.editor.addEventListener('input', () => {
            this.updateLineNumbers();
            this.updateSyntaxHighlighting();
            this.updateStatusInfo();
        });

        this.editor.addEventListener('scroll', () => {
            this.lineNumbers.scrollTop = this.editor.scrollTop;
            this.syntaxOverlay.scrollTop = this.editor.scrollTop;
        });

        this.editor.addEventListener('keyup', () => {
            this.updateStatusInfo();
        });

        this.editor.addEventListener('click', () => {
            this.updateStatusInfo();
        });

        // Button handlers
        document.getElementById('save-btn').addEventListener('click', () => this.save());
        document.getElementById('close-btn').addEventListener('click', () => this.close());

        // Sync scrolling between textarea and syntax overlay
        this.editor.addEventListener('scroll', () => {
            this.syntaxOverlay.scrollLeft = this.editor.scrollLeft;
            this.syntaxOverlay.scrollTop = this.editor.scrollTop;
        });
    }

    save() {
        if (this.saveCallback) {
            this.content = this.editor.value;
            this.saveCallback(this.content);
            this.updateStatusInfo();
        }
    }

    close() {
        if (this.content !== this.editor.value) {
            const shouldSave = confirm('You have unsaved changes. Do you want to save before closing?');
            if (shouldSave) {
                this.save();
            }
        }
        this.hide();
        // Restore terminal
        this.restoreTerminal();
    }

    restoreTerminal() {
        const terminal = document.getElementById('terminal');
        const output = document.getElementById('output');
        const inputLine = document.getElementById('input-line');
        
        terminal.innerHTML = '';
        terminal.appendChild(output);
        terminal.appendChild(inputLine);
        
        // Focus back to input
        const inputElement = document.getElementById('input');
        if (inputElement) {
            inputElement.focus();
        }
    }

    focusEditor() {
        if (this.editor) {
            this.editor.focus();
            // Move cursor to end
            this.editor.setSelectionRange(this.editor.value.length, this.editor.value.length);
        }
    }

    showFindDialog() {
        // Simple find functionality
        const searchTerm = prompt('Find:');
        if (searchTerm) {
            const content = this.editor.value;
            const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
            if (index !== -1) {
                this.editor.focus();
                this.editor.setSelectionRange(index, index + searchTerm.length);
            } else {
                alert('Not found');
            }
        }
    }
}

export { EnhancedEditor };