# ETHIX v2

## Table of Contents

1. [Introduction](#introduction)
2. [Features](#features)
3. [Setup](#setup)
4. [Usage](#usage)
5. [Commands](#commands)
6. [Package Management](#package-management)
7. [File System](#file-system)
8. [API Endpoints](#api-endpoints)
9. [Contributing](#contributing)
10. [License](#license)

## Introduction

This project is a browser-based terminal with an integrated package management system. It provides a Unix-like command-line interface in the browser, allowing users to navigate a virtual file system, create and edit files, and manage packages. It's just a fun toy project for me to work on.

## Features

-   Browser-based terminal interface
-   Virtual file system with basic operations (ls, cd, mkdir, etc.)
-   Text editor for creating and modifying files
-   Package management system (create, publish, install, uninstall)
-   Persistent storage using browser's localStorage
-   Customizable command modules
-   Syntax highlighting and formatting for command output

## Setup

1. Clone the repository:

    ```
    git clone https://github.com/yourusername/browser-terminal.git
    cd browser-terminal
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Start the server:

    ```
    node app.js
    ```

4. Open a web browser and navigate to `http://localhost:3000`

## Usage

Once you've opened the terminal in your browser, you can start using it like a regular command-line interface. Type `help` to see a list of available commands.

## Commands

Here's a list of available commands:

-   `help`: Display a list of available commands
-   `cd`: Change directory
-   `ls`: List directory contents
-   `mkdir`: Create a new directory
-   `create`: Create a new file
-   `edit`: Edit an existing file
-   `echo`: Print text to the terminal
-   `clear`: Clear the terminal screen
-   `install`: Install a package
-   `uninstall`: Uninstall a package
-   `list`: List installed packages
-   `create-package`: Create a new package
-   `publish`: Publish a package to the repository

For detailed usage of each command, type `<command> --help` in the terminal.

## Package Management

### Creating a Package

To create a new package:

1. Use the `create-package` command:
    ```
    create-package my-package
    ```
2. Navigate to the package directory:
    ```
    cd my-package
    ```
3. Edit the `package.json` file:
    ```
    edit package.json
    ```
4. Edit the main package file:
    ```
    edit index.js
    ```

### Publishing a Package

To publish a package to the repository:

1. Navigate to the package directory
2. Use the `publish` command:
    ```
    publish my-package
    ```

### Installing a Package

To install a package:

```
install package-name
```

This works for both local and remote packages.

### Uninstalling a Package

To uninstall a package:

```
uninstall package-name
```

# Browser-Based Terminal with Package Management

[Previous sections remain unchanged]

## File System

### Overview

The project implements a virtual file system that simulates a Unix-like directory structure within the browser environment. This file system is persisted using the browser's localStorage, allowing for data retention between sessions.

### Structure

The file system is organized as a tree structure, with each node representing either a file or a directory. The root of this tree is the '/' directory. Each directory can contain files and other directories.

### File System Operations

The file system supports the following operations:

-   Creating files and directories
-   Reading file contents
-   Updating file contents
-   Deleting files and directories
-   Navigating the directory structure
-   Listing directory contents

### Implementation

The file system is implemented in JavaScript and stored as a JSON object in localStorage. Here's a simplified representation of the file system structure:

```javascript
{
  '/': {
    type: 'directory',
    contents: {
      'home': {
        type: 'directory',
        contents: {
          // home directory contents
        }
      },
      'packages': {
        type: 'directory',
        contents: {
          // installed packages
        }
      }
      // other root-level directories and files
    }
  }
}
```

### Interaction with the Backend

While the file system primarily operates client-side, it interacts with the backend in several ways:

1. **Package Installation**:

    - When a package is installed, the backend fetches the package data from the repository.
    - The client-side file system then creates the necessary directories and files to represent the installed package.

2. **Package Publishing**:

    - When publishing a package, the client reads the package files from its file system.
    - It then sends this data to the backend, which stores it in the package repository.

3. **Command Modules**:

    - The list of available command modules is fetched from the backend when the terminal initializes.
    - These modules are then loaded and executed client-side, interacting with the file system as needed.

4. **Persistence**:
    - While the file system data is stored in localStorage, critical data like the package repository is maintained on the backend.
    - This allows for data integrity and sharing between different clients.

### File System API

The file system provides several key functions that are used by various commands:

-   `getDirectoryContents(path)`: Returns the contents of a directory.
-   `createDirectory(path)`: Creates a new directory.
-   `createFile(path, content)`: Creates a new file with the given content.
-   `getFileContents(path)`: Retrieves the contents of a file.
-   `saveFile(path, content)`: Updates the contents of an existing file.
-   `deleteItem(path)`: Deletes a file or directory.

### Limitations

-   The file system is entirely in-memory and has no actual disk storage.
-   There's no concept of file permissions or multiple users.
-   The total storage is limited by the browser's localStorage limits.

# ETX Script Language and Parser Documentation

## Overview

ETX Script is a simple scripting language designed for basic automation tasks. It supports variable assignment, arithmetic operations, conditional statements, loops, and execution of shell commands.

## Language Features

### Comments

Lines starting with `#` are treated as comments and ignored during execution.

```
# This is a comment
```

### Variable Assignment

Variables are assigned using the `set` keyword.

```
set variableName value
```

Example:

```
set x 10
set y x + 5
```

### Arithmetic Operations

Basic arithmetic operations are supported in variable assignments and conditions.

Supported operations: `+`, `-`, `*`, `/`, `%` (modulo)

### Conditional Statements

If-else statements are supported for conditional execution.

```
if condition
    # code block
else
    # code block
endif
```

Example:

```
if x > y
    echo x is greater than y
else
    echo y is greater than or equal to x
endif
```

### Loops

For loops are supported for iterative execution.

```
for variable start end
    # code block
endfor
```

Example:

```
for i 1 5
    echo Loop iteration: $i
endfor
```

### Echo Command

The `echo` command is used to print text to the console. Variables can be referenced using the `$` symbol.

```
echo This is a message
echo The value of x is $x
```

### Shell Commands

Any line that is not recognized as an ETX Script command is treated as a shell command and executed.

Example:

```
pwd
ls -l
```

## Parser Implementation

The `ETXScriptParser` class implements the following methods:

-   `executeScript(scriptContent)`: Executes the entire script.
-   `executeLine(line, index, lines)`: Executes a single line of the script.
-   `executeIfBlock(startIndex, lines)`: Handles the execution of if-else blocks.
-   `executeForLoop(startIndex, lines)`: Handles the execution of for loops.
-   `executeSet(line)`: Handles variable assignment.
-   `executeCommand(command)`: Executes shell commands.
-   `evaluateExpression(expression)`: Evaluates arithmetic and boolean expressions.
-   `replaceVariables(str)`: Replaces variable references with their values.

## Limitations and Future Improvements

-   The current implementation uses JavaScript's `eval()` for expression evaluation, which can be a security risk if not properly sanitized.
-   Error handling could be improved to provide more detailed error messages.
-   The parser doesn't support user-defined functions or more complex data structures.
-   Nested loops and conditionals are supported, but care should be taken to ensure proper nesting.

## Usage

To use the ETX Script Parser:

1. Create a script file with a `.etx` extension (e.g., `script.etx`).
2. Write your script using the language features described above.
3. Execute the script using the command: `./script.etx` or `etx script.etx` (depending on your setup).

Remember to handle the script execution carefully, as it can execute arbitrary shell commands.

## API Endpoints

The backend provides the following API endpoints:

-   `GET /api/command-modules`: Get a list of available command modules
-   `GET /api/packages/:packageName`: Get information about a specific package
-   `GET /api/packages`: Get a list of all packages
-   `POST /api/packages`: Create or update a package
-   `DELETE /api/packages/:packageName`: Delete a package

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.
