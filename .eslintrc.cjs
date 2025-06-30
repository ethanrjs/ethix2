module.exports = {
    env: {
        node: true,
        es2022: true,
        bun: true
    },
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'prettier'
    ],
    plugins: ['node'],
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    rules: {
        // Code quality rules
        'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        'no-console': 'off', // Allow console in this project
        'prefer-const': 'error',
        'no-var': 'error',
        
        // Node.js specific rules
        'node/no-missing-import': 'off', // Bun handles imports differently
        'node/no-unsupported-features/es-syntax': 'off',
        'node/no-unpublished-import': 'off',
        
        // Best practices
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'no-throw-literal': 'error',
        'prefer-promise-reject-errors': 'error',
        
        // Style rules (handled by prettier mostly)
        'indent': 'off',
        'quotes': 'off',
        'semi': 'off'
    },
    overrides: [
        {
            files: ['tests/**/*.js'],
            env: {
                jest: true,
                bun: true
            },
            rules: {
                'no-unused-expressions': 'off'
            }
        }
    ]
};