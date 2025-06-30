import { registerCommand, addOutputLine, getCurrentDirectory } from '../terminal.js';
import { saveFile } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

const sampleEtxContent = `# Enhanced ETX Script - Demonstrates all parser features
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

registerCommand('create-sample', 'Create a sample ETX script to demonstrate syntax highlighting', args => {
    const fileName = args.length > 0 ? args[0] : 'sample.etx';
    const currentDir = getCurrentDirectory();
    const filePath = `${currentDir}/${fileName}`.replace(/\/+/g, '/');
    
    // Ensure the filename has .etx extension
    const finalFileName = fileName.endsWith('.etx') ? fileName : `${fileName}.etx`;
    const finalFilePath = `${currentDir}/${finalFileName}`.replace(/\/+/g, '/');
    
    saveFile(finalFilePath, sampleEtxContent);
    
    addOutputLine([
        { text: `Sample ETX script created: `, color: 'green' },
        { text: finalFileName, color: 'cyan' }
    ]);
    addOutputLine([
        { text: `Use `, color: 'white' },
        { text: `edit ${finalFileName}`, color: 'yellow' },
        { text: ` to open it with syntax highlighting!`, color: 'white' }
    ]);
});

registerCommandDescription('create-sample', 'Create a sample ETX script to demonstrate syntax highlighting');