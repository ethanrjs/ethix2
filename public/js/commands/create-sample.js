import { registerCommand, addOutputLine, getCurrentDirectory } from '../terminal.js';
import { saveFile } from '../fileSystem.js';
import { registerCommandDescription } from './help.js';

const sampleEtxContent = `# Sample ETX Script - Demonstrates syntax highlighting
# This is a comment showing various ETX script features

# Set variables
set counter 1
set max_count 5
set message "Hello from ETX!"

# Display the message
echo $message

# Conditional statement
if $counter <= $max_count
    echo "Counter is within range: $counter"
else
    echo "Counter exceeded maximum"
endif

# Loop example
echo "Counting from 1 to $max_count:"
for i 1 $max_count
    echo "Count: $i"
endfor

# File operations
echo "Creating a test file..."
touch test_file.txt
echo "Test content" > test_file.txt

# List files
echo "Files in current directory:"
ls

# Check if file exists and display content
if test_file.txt
    echo "File contents:"
    cat test_file.txt
endif

# Cleanup
rm test_file.txt
echo "Script completed successfully!"`;

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