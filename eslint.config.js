import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import importPlugin from 'eslint-plugin-import'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      'dist',
      'coverage',
      'playwright-report',
      'test-results',
      'storybook-static',
      'public/mockServiceWorker.js',
    ],
  },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      jsxA11y.flatConfigs.recommended,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      import: importPlugin,
    },
    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true },
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'import/order': [
        'warn',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          'newlines-between': 'always',
          alphabetize: { order: 'asc' },
        },
      ],
      'import/no-cycle': 'error',
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/lib',
              from: [
                './src/app',
                './src/api',
                './src/mocks',
                './src/shared',
                './src/features',
                './src/theme',
                './src/config',
              ],
              message: 'lib/ is pure and imports nothing from the app.',
            },
            {
              target: './src/shared/ui',
              from: ['./src/features', './src/api', './src/mocks', './src/app'],
              message: 'shared/ui knows nothing about features.',
            },
            {
              target: './src/features/dashboard',
              from: ['./src/features/send-money'],
              message: "Features don't import from each other — share via shared/.",
            },
            {
              target: './src/features/send-money',
              from: ['./src/features/dashboard'],
              message: "Features don't import from each other — share via shared/.",
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message: 'Never use dangerouslySetInnerHTML — untrusted text must render as text only.',
        },
      ],
    },
  },
  {
    files: ['src/lib/money*.{ts,tsx}', 'src/features/send-money/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'parseFloat',
          message: 'Never use parseFloat on money values — use parseNairaToKobo instead.',
        },
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Number',
          property: 'parseFloat',
          message: 'Never use Number.parseFloat on money values — use parseNairaToKobo instead.',
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/api/client.ts'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message:
            'Components/hooks must not call fetch directly — go through api/endpoints via a hook.',
        },
      ],
    },
  },
  {
    files: ['**/*.config.{ts,js}', '**/*.setup.{ts,js}', 'tests/**/*.ts'],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
)
