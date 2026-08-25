import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const tsconfigRootDir = dirname(fileURLToPath(import.meta.url));

export default [
  { ignores: ['package/**', 'eslint.config.mjs', 'esbuild.config.mjs', 'vitest.config.mts'] },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir,
      },
      globals: {
        ...globals.browser,
        chrome: 'readonly',
      },
    },
  },
  prettier,
];
