const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');
const reactCompiler = require('eslint-plugin-react-compiler');

module.exports = [
  ...expoConfig,
  prettierConfig,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-compiler': reactCompiler },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'off',
      'react-compiler/react-compiler': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  {
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    ignores: ['node_modules/', '.expo/', 'dist/', 'android/', 'ios/'],
  },
];
