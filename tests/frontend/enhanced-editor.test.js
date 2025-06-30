import { EnhancedEditor } from '../../public/js/EnhancedEditor.js';

describe('EnhancedEditor', () => {
    let editor;
    let mockContainer;

    beforeEach(() => {
        // Setup DOM
        document.body.innerHTML = '<div id="terminal"></div>';
        mockContainer = document.getElementById('terminal');
        
        editor = new EnhancedEditor();
    });

    afterEach(() => {
        if (editor.isVisible) {
            editor.hide();
        }
        document.body.innerHTML = '';
    });

    describe('Editor Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(editor.container).toBeNull();
            expect(editor.editor).toBeNull();
            expect(editor.lineNumbers).toBeNull();
            expect(editor.content).toBe('');
            expect(editor.fileName).toBe('');
            expect(editor.saveCallback).toBeNull();
            expect(editor.isVisible).toBe(false);
        });

        test('should have correct ETX syntax patterns', () => {
            expect(editor.etxPatterns).toHaveLength(10);
            expect(editor.etxPatterns[0].className).toBe('comment');
            expect(editor.etxPatterns[1].className).toBe('keyword');
            expect(editor.etxPatterns[2].className).toBe('command');
        });
    });

    describe('File Icon Detection', () => {
        test('should return correct icons for different file types', () => {
            editor.fileName = 'test.etx';
            expect(editor.getFileIcon()).toBe('📜');

            editor.fileName = 'script.js';
            expect(editor.getFileIcon()).toBe('📄');

            editor.fileName = 'data.json';
            expect(editor.getFileIcon()).toBe('📋');

            editor.fileName = 'readme.md';
            expect(editor.getFileIcon()).toBe('📝');

            editor.fileName = 'notes.txt';
            expect(editor.getFileIcon()).toBe('📄');

            editor.fileName = 'unknown.xyz';
            expect(editor.getFileIcon()).toBe('📄');
        });
    });

    describe('Editor Display', () => {
        test('should show editor with correct structure', () => {
            const mockSaveCallback = jest.fn();
            editor.show('test.etx', 'test content', mockSaveCallback);

            expect(editor.isVisible).toBe(true);
            expect(editor.fileName).toBe('test.etx');
            expect(editor.content).toBe('test content');
            expect(editor.saveCallback).toBe(mockSaveCallback);

            // Check DOM structure
            const editorElement = document.getElementById('enhanced-editor');
            expect(editorElement).toBeTruthy();
            
            const header = editorElement.querySelector('.editor-header');
            expect(header).toBeTruthy();
            
            const body = editorElement.querySelector('.editor-body');
            expect(body).toBeTruthy();
            
            const footer = editorElement.querySelector('.editor-footer');
            expect(footer).toBeTruthy();
        });

        test('should hide editor correctly', () => {
            editor.show('test.etx', 'content', jest.fn());
            expect(editor.isVisible).toBe(true);

            editor.hide();
            expect(editor.isVisible).toBe(false);
            expect(editor.container).toBeNull();
        });
    });

    describe('Syntax Highlighting', () => {
        beforeEach(() => {
            editor.show('test.etx', '', jest.fn());
        });

        test('should highlight comments correctly', () => {
            const testContent = '# This is a comment\necho "hello"';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-comment">');
        });

        test('should highlight keywords correctly', () => {
            const testContent = 'if $var == 5\n    echo "five"\nendif';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-keyword">if</span>');
        });

        test('should highlight variables correctly', () => {
            const testContent = 'set myvar 10\necho $myvar';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-variable">$myvar</span>');
        });

        test('should highlight array variables correctly', () => {
            const testContent = 'set arr[0] "hello"\necho $arr[0]';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-variable">$arr[0]</span>');
        });

        test('should highlight strings correctly', () => {
            const testContent = 'echo "hello world"\necho \'single quotes\'';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-string">"hello world"</span>');
        });

        test('should highlight numbers correctly', () => {
            const testContent = 'set num 42\nset decimal 3.14';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-number">42</span>');
        });

        test('should highlight boolean values correctly', () => {
            const testContent = 'set flag true\nset other false\nset empty null';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-boolean">true</span>');
        });

        test('should highlight operators correctly', () => {
            const testContent = 'if $a >= $b && $c != $d';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('syntax-operator');
        });

        test('should highlight brackets correctly', () => {
            const testContent = 'set arr [1, 2, 3]\nif ($a > 0)';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('syntax-bracket');
        });

        test('should highlight function calls correctly', () => {
            const testContent = 'myFunction(arg1, arg2)\ncalculate()';
            editor.editor.value = testContent;
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toContain('<span class="syntax-function-call">myFunction</span>');
        });

        test('should not highlight non-ETX files', () => {
            editor.hide();
            editor.show('test.js', 'var x = 5;', jest.fn());
            editor.updateSyntaxHighlighting();

            const overlay = editor.syntaxOverlay;
            expect(overlay.innerHTML).toBe('');
        });
    });

    describe('Line Numbers', () => {
        beforeEach(() => {
            editor.show('test.etx', '', jest.fn());
        });

        test('should update line numbers correctly', () => {
            const testContent = 'line 1\nline 2\nline 3';
            editor.editor.value = testContent;
            editor.updateLineNumbers();

            const lineNumbers = editor.lineNumbers;
            const lineNumberDivs = lineNumbers.querySelectorAll('.line-number');
            expect(lineNumberDivs).toHaveLength(3);
            expect(lineNumberDivs[0].textContent).toBe('1');
            expect(lineNumberDivs[1].textContent).toBe('2');
            expect(lineNumberDivs[2].textContent).toBe('3');
        });

        test('should handle empty content', () => {
            editor.editor.value = '';
            editor.updateLineNumbers();

            const lineNumbers = editor.lineNumbers;
            const lineNumberDivs = lineNumbers.querySelectorAll('.line-number');
            expect(lineNumberDivs).toHaveLength(1);
            expect(lineNumberDivs[0].textContent).toBe('1');
        });
    });

    describe('Status Information', () => {
        beforeEach(() => {
            editor.show('test.etx', 'initial content', jest.fn());
        });

        test('should update status information correctly', () => {
            editor.editor.value = 'line 1\nline 2';
            editor.editor.selectionStart = 7; // Start of line 2
            editor.editor.selectionEnd = 7;
            
            editor.updateStatusInfo();

            expect(document.getElementById('current-line').textContent).toBe('2');
            expect(document.getElementById('current-column').textContent).toBe('1');
            expect(document.getElementById('content-length').textContent).toBe('13');
        });

        test('should show modified status when content changes', () => {
            editor.editor.value = 'modified content';
            editor.updateStatusInfo();

            const status = document.getElementById('file-status');
            expect(status.textContent).toBe('● Modified');
            expect(status.className).toBe('modified');
        });

        test('should show saved status when content matches original', () => {
            editor.editor.value = 'initial content';
            editor.updateStatusInfo();

            const status = document.getElementById('file-status');
            expect(status.textContent).toBe('✓ Saved');
            expect(status.className).toBe('saved');
        });
    });

    describe('Cursor Position', () => {
        beforeEach(() => {
            editor.show('test.etx', '', jest.fn());
        });

        test('should calculate cursor position correctly', () => {
            editor.editor.value = 'line 1\nline 2\nline 3';
            editor.editor.selectionStart = 7; // Start of line 2
            editor.editor.selectionEnd = 7;

            const pos = editor.getCursorPosition();
            expect(pos.line).toBe(2);
            expect(pos.column).toBe(1);
        });

        test('should handle cursor at end of line', () => {
            editor.editor.value = 'hello\nworld';
            editor.editor.selectionStart = 5; // End of first line
            editor.editor.selectionEnd = 5;

            const pos = editor.getCursorPosition();
            expect(pos.line).toBe(1);
            expect(pos.column).toBe(6);
        });
    });

    describe('HTML Escaping', () => {
        beforeEach(() => {
            editor.show('test.etx', '', jest.fn());
        });

        test('should escape HTML entities correctly', () => {
            const testText = '<script>alert("xss")</script>';
            const escaped = editor.escapeHtml(testText);
            expect(escaped).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;');
        });

        test('should handle ampersands correctly', () => {
            const testText = 'Tom & Jerry';
            const escaped = editor.escapeHtml(testText);
            expect(escaped).toBe('Tom &amp; Jerry');
        });
    });

    describe('Save Functionality', () => {
        test('should call save callback when saving', () => {
            const mockSaveCallback = jest.fn();
            editor.show('test.etx', 'original', mockSaveCallback);
            
            editor.editor.value = 'modified content';
            editor.save();

            expect(mockSaveCallback).toHaveBeenCalledWith('modified content');
            expect(editor.content).toBe('modified content');
        });

        test('should not call save callback if none provided', () => {
            editor.show('test.etx', 'content', null);
            
            // Should not throw error
            expect(() => editor.save()).not.toThrow();
        });
    });

    describe('Find Functionality', () => {
        beforeEach(() => {
            editor.show('test.etx', 'hello world\nhello universe', jest.fn());
            
            // Mock prompt and alert
            global.prompt = jest.fn();
            global.alert = jest.fn();
        });

        afterEach(() => {
            delete global.prompt;
            delete global.alert;
        });

        test('should find and select text', () => {
            global.prompt.mockReturnValue('world');
            
            editor.showFindDialog();

            expect(global.prompt).toHaveBeenCalledWith('Find:');
            expect(editor.editor.selectionStart).toBe(6);
            expect(editor.editor.selectionEnd).toBe(11);
        });

        test('should show not found message', () => {
            global.prompt.mockReturnValue('notfound');
            
            editor.showFindDialog();

            expect(global.alert).toHaveBeenCalledWith('Not found');
        });

        test('should handle cancelled find', () => {
            global.prompt.mockReturnValue(null);
            
            editor.showFindDialog();

            expect(global.alert).not.toHaveBeenCalled();
        });
    });
});