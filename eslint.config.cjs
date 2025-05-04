// ESLint config for Next.js + TypeScript (CommonJS for ESLint v9 compatibility)
const js = require('@eslint/js');
const next = require('eslint-config-next');

module.exports = [
  js.config({
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
  }),
  ...next,
];
