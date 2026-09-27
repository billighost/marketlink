import js from '@eslint/js';
import globals from 'globals';
import reactPlugin from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.{js,jsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooks,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      // Catch undefined variables — the class of bug that caused the Cart crash
      'no-undef': 'error',
      // React rules
      'react/jsx-no-undef': 'error',
      'react/jsx-uses-react': 'off',   // not needed with React 17+ JSX transform
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'error',  // marks JSX-referenced vars as "used"
      // Hooks rules
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // Quality
      'no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    // Ignore build output and configs
    ignores: ['dist/**', 'node_modules/**', '*.config.js'],
  },
];
