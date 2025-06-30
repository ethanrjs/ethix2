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
            { pattern: /\b(if|else|endif|for|endfor|set)\b/g, className: 'keyword' },
            { pattern: /\b(echo|ls|cd|cat|mkdir|rm|cp|mv|touch|grep|find)\b/g, className: 'command' },
            { pattern: /\$\w+/g, className: 'variable' },
            { pattern: /\b\d+\b/g, className: 'number' },
            { pattern: /(['"])((?:\\.|(?!\1)[^\\])*?)\1/g, className: 'string' },
            { pattern: /[<>=!]=?|[+\-*/]|\b(and|or|not)\b/g, className: 'operator' },
            { pattern: /[{}()\[\]]/g, className: 'bracket' }
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

        let highlightedContent = this.escapeHtml(this.editor.value);
        
        // Apply syntax highlighting patterns in order
        this.etxPatterns.forEach(({ pattern, className }) => {
            highlightedContent = highlightedContent.replace(pattern, (match) => 
                `<span class="syntax-${className}">${match}</span>`
            );
        });

        // Add a space at the end to ensure proper cursor positioning
        if (!highlightedContent.endsWith(' ')) {
            highlightedContent += ' ';
        }
        
        this.syntaxOverlay.innerHTML = highlightedContent;
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
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
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