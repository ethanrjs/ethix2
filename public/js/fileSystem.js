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
        
        // Ensure sample ETX script exists
        this.ensureSampleScript();
    }

    ensureSampleScript() {
        const samplePath = '/sample.etx';
        // Check if file exists without using getCurrentDirectory to avoid circular dependency
        const file = this.traversePath(samplePath);
        if (!file || file.type !== 'file') {
            const sampleContent = `# Enhanced ETX Script - Demonstrates all parser features
# This comprehensive example shows the improved ETX parser capabilities

# ===== VARIABLES AND ARRAYS =====
set name "ETX Parser"
set version 2.0
set enabled true
set items ["apple", "banana", "cherry", "date"]
set numbers [10, 20, 30, 40, 50]

echo "Welcome to $name v$version"
echo "Parser enabled: $enabled"

# Array operations
set items[4] "elderberry"
echo "First item: $items[0]"
echo "Last item: $items[4]"

# ===== MATHEMATICAL EXPRESSIONS =====
set a 15
set b 7
set sum $a + $b
set product $a * $b
set remainder $a % $b

echo "Math results: $a + $b = $sum, $a * $b = $product, $a % $b = $remainder"

# ===== ENHANCED CONDITIONALS =====
if $sum > 20
    echo "Sum is greater than 20"
elif $sum == 20
    echo "Sum equals exactly 20"
else
    echo "Sum is less than 20"
endif

# Complex conditions
if $enabled && $version >= 2.0
    echo "Advanced features are available"
endif

# ===== LOOPS =====
echo "Traditional for loop:"
for i 1 3
    echo "  Iteration $i"
endfor

echo "For-in loop with array:"
for fruit in $items
    echo "  Fruit: $fruit"
endfor

echo "While loop example:"
set counter 1
while $counter <= 3
    echo "  While counter: $counter"
    set counter $counter + 1
endwhile

# Loop control
echo "Loop with break:"
for i 1 10
    if $i == 4
        echo "  Breaking at $i"
        break
    endif
    echo "  Number: $i"
endfor

echo "Loop with continue:"
for i 1 5
    if $i == 3
        continue
    endif
    echo "  Processing: $i"
endfor

# ===== FUNCTIONS =====
function greet(name, title)
    echo "Hello $title $name, welcome to ETX!"
endfunction

function calculate(x, y, operation)
    if $operation == "add"
        return $x + $y
    elif $operation == "multiply" 
        return $x * $y
    else
        return 0
    endif
endfunction

function fibonacci(n)
    if $n <= 1
        return $n
    endif
    
    set prev 0
    set curr 1
    for i 2 $n
        set temp $curr
        set curr $prev + $curr
        set prev $temp
    endfor
    return $curr
endfunction

# Function calls
greet("User", "Mr.")
set result calculate(8, 4, "add")
echo "8 + 4 = $result"

set result calculate(6, 7, "multiply")
echo "6 * 7 = $result"

set fib_result fibonacci(8)
echo "8th Fibonacci number: $fib_result"

# ===== ERROR HANDLING =====
echo "Testing error handling:"
try
    set invalid_result 10 / 0
    echo "This shouldn't print"
catch
    echo "Caught error: $error"
endtry

# ===== ADVANCED FEATURES =====
set config_data ["debug", "verbose", "logging"]
set debug_mode false

# Nested conditions and loops
for option in $config_data
    if $option == "debug"
        set debug_mode true
        echo "Debug mode enabled"
    elif $option == "verbose"
        echo "Verbose output enabled"
    elif $option == "logging"
        echo "Logging enabled"
    endif
endfor

# Complex expressions
set complex_result ($a + $b) * 2 - ($a % $b)
echo "Complex calculation: ($a + $b) * 2 - ($a % $b) = $complex_result"

# Boolean operations
set flag1 true
set flag2 false
if $flag1 && !$flag2
    echo "Boolean logic works correctly"
endif

# ===== FINAL OPERATIONS =====
echo "Creating demonstration files..."
touch demo_file.txt
echo "This is a demo file created by ETX script" > demo_file.txt

echo "File listing:"
ls

echo "File content:"
cat demo_file.txt

# Cleanup
rm demo_file.txt
echo "Demo completed successfully!"
echo "ETX Parser v$version demonstration finished."

# Unset variables for cleanup
unset name
unset version
unset items
unset numbers`;

            this.createFile(samplePath, sampleContent);
        }
    }

    save() {
        localStorage.setItem('fileSystem', JSON.stringify(this.fs));
    }

    resolvePath(path) {
        // Avoid circular dependency by using '/' as default if getCurrentDirectory is not available
        let currentDir;
        try {
            currentDir = getCurrentDirectory();
        } catch (error) {
            currentDir = '/';
        }
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

        if (!parent || parent.type !== 'directory' || !parent.contents[itemName]) return false;

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
export const getDirectoryContents = fileSystem.getDirectoryContents.bind(fileSystem);
export const createDirectory = fileSystem.createDirectory.bind(fileSystem);
export const createFile = fileSystem.createFile.bind(fileSystem);
export const getFileContents = fileSystem.getFileContents.bind(fileSystem);
export const saveFile = fileSystem.saveFile.bind(fileSystem);
export const deleteItem = fileSystem.deleteItem.bind(fileSystem);
export const getFileSize = fileSystem.getFileSize.bind(fileSystem);
export const resolvePath = fileSystem.resolvePath.bind(fileSystem);

export { fileSystem };
