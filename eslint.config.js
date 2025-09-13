const js = require('@eslint/js');
const globals = require('globals');

const prettier = require('eslint-plugin-prettier');
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended');

const jest = require('eslint-plugin-jest');

module.exports = [
  js.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      prettier
    },
    rules: {
      'prettier/prettier': ['error'],
      'no-var': ['error'],
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_'
        }
      ]
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      }
    }
  },
  {
    // Ignores must be in a separate block to apply globally:
    // https://eslint.org/docs/latest/use/configure/configuration-files#globally-ignoring-files-with-ignores
    ignores: [
      'eslint.config.js',
      '.repo/**/*',
      '.github/**/*',
      '.vscode/*',
      '**/node_modules/**/*',
      '**/dist/**/*',
      '**/*.skip'
    ]
  }
];
