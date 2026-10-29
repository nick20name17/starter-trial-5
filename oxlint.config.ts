import { defineConfig, type DummyRuleMap } from 'oxlint'

const compilerMessage =
  'React Compiler memoizes automatically: write plain values, functions and components.'
const loaderDataMessage =
  'Loaders only fill the Query cache. Read the data with useSuspenseQuery and the same queryOptions, so the query keeps an observer and stays fresh.'
const mockMessage =
  'Mock only the system boundary: network with worker.use, time and randomness with vi.useFakeTimers or vi.spyOn.'

const restrictedPaths = [
  {
    name: '@testing-library/react',
    message: 'Tests run in Vitest Browser Mode: use render from vitest-browser-react.',
  },
  { name: 'react', importNames: ['useMemo', 'useCallback', 'memo'], message: compilerMessage },
  { name: '@tanstack/react-router', importNames: ['useLoaderData'], message: loaderDataMessage },
  {
    name: 'zod',
    message:
      "Import { z } from 'zod/mini': its functions tree-shake, the methods of full zod do not (about 15 KB gzip).",
  },
  {
    name: '@playwright/test',
    importNames: ['test'],
    message:
      'Import test from e2e/fixtures.ts: its auto fixtures check every e2e test for console errors, axe violations and layout shifts.',
  },
]

function importOf(folders: string) {
  return `^(@/|\\.\\.?/(\\.\\./)*)(${folders})(/|$)`
}

// Overrides replace a rule's options, so every zone goes through here to keep the paths
function restrictImports(...patterns: Array<{ regex: string; message: string }>): DummyRuleMap {
  return { 'no-restricted-imports': ['error', { paths: restrictedPaths, patterns }] }
}

const appImport = {
  regex: importOf('app'),
  message:
    'Only main.tsx and src/test/ wire the app. Render pages in tests with renderRoute from src/test/render.tsx.',
}

export default defineConfig({
  plugins: ['typescript', 'react', 'jsx-a11y', 'oxc', 'unicorn', 'import', 'vitest'],
  jsPlugins: [
    '@shadcn/lint',
    '@tanstack/eslint-plugin-query',
    '@tanstack/eslint-plugin-router',
    'eslint-plugin-no-comment-slop',
  ],
  options: {
    typeAware: true,
    reportUnusedDisableDirectives: 'error',
  },
  categories: {
    correctness: 'error',
    suspicious: 'warn',
    perf: 'warn',
  },
  rules: {
    eqeqeq: ['error', 'smart'],
    'func-style': ['error', 'declaration'],
    'array-callback-return': 'error',
    'default-case-last': 'error',
    'default-param-last': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-promise-executor-return': 'error',
    'no-self-compare': 'error',
    'no-var': 'error',
    // z._default from zod/mini
    'no-underscore-dangle': ['warn', { allow: ['_default'] }],
    'no-case-declarations': 'error',
    'no-empty': 'error',
    'no-fallthrough': 'error',
    'no-prototype-builtins': 'error',
    'no-regex-spaces': 'error',
    'no-useless-assignment': 'error',
    'prefer-rest-params': 'error',
    'prefer-spread': 'error',
    // Comments that narrate the chat or the edit. History belongs in the commit message
    'no-warning-comments': [
      'error',
      {
        terms: [
          'as requested',
          'as you requested',
          'the user asked',
          'the user wants',
          'now uses',
          'changed from',
          'previously',
          'originally',
          'no longer',
          'step 1',
          'phase 1',
        ],
        location: 'anywhere',
      },
    ],
    'no-comment-slop/max-comment-lines': 'error',
    'prefer-const': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',
    'typescript/ban-ts-comment': 'error',
    'typescript/consistent-type-assertions': ['error', { assertionStyle: 'never' }],
    'typescript/consistent-type-definitions': 'error',
    'typescript/consistent-type-imports': 'error',
    'typescript/no-deprecated': 'warn',
    'typescript/no-empty-object-type': 'error',
    'typescript/no-explicit-any': 'error',
    'typescript/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
    'typescript/no-non-null-assertion': 'error',
    'typescript/no-array-constructor': 'error',
    'typescript/no-namespace': 'error',
    'typescript/no-require-imports': 'error',
    'typescript/no-unsafe-function-type': 'error',
    'typescript/no-unsafe-argument': 'error',
    'typescript/no-unsafe-assignment': 'error',
    'typescript/no-unsafe-call': 'error',
    'typescript/no-unsafe-member-access': 'error',
    'typescript/no-unsafe-return': 'error',
    'typescript/only-throw-error': [
      'error',
      {
        allow: [
          {
            from: 'package',
            package: '@tanstack/router-core',
            name: ['NotFoundError', 'Redirect'],
          },
        ],
      },
    ],
    'typescript/prefer-nullish-coalescing': 'error',
    'typescript/prefer-promise-reject-errors': 'error',
    'typescript/restrict-plus-operands': 'error',
    'typescript/return-await': 'error',
    'typescript/switch-exhaustiveness-check': 'error',
    'typescript/use-unknown-in-catch-callback-variable': 'error',
    'typescript/no-unnecessary-condition': 'error',
    'typescript/no-unnecessary-type-assertion': 'error',
    'typescript/prefer-optional-chain': 'error',
    'typescript/require-await': 'error',
    'react/react-in-jsx-scope': 'off',
    'react/rules-of-hooks': 'error',
    'react/exhaustive-deps': 'warn',
    'react/button-has-type': 'error',
    'react/jsx-boolean-value': 'error',
    'react/jsx-curly-brace-presence': 'error',
    'react/jsx-no-target-blank': 'error',
    'react/jsx-no-useless-fragment': 'error',
    // React Doctor's dangerous-html-sink checks it, and more sinks than dangerouslySetInnerHTML
    'react/no-danger': 'off',
    'react/no-unknown-property': 'error',
    'react/only-export-components': ['warn', { allowConstantExport: true }],
    'react/self-closing-comp': 'error',
    'react/jsx-no-constructed-context-values': 'off',
    'unicorn/error-message': 'error',
    'unicorn/filename-case': 'error',
    'unicorn/no-abusive-eslint-disable': 'error',
    'unicorn/prefer-node-protocol': 'error',
    'unicorn/throw-new-error': 'error',
    'import/no-cycle': 'error',
    'import/no-duplicates': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-unassigned-import': ['warn', { allow: ['**/*.css'] }],
    ...restrictImports(appImport),
    'no-restricted-properties': [
      'error',
      ...['useMemo', 'useCallback', 'memo'].map((property) => ({
        object: 'React',
        property,
        message: compilerMessage,
      })),
      ...['beforeEach', 'afterEach', 'beforeAll', 'afterAll'].map((property) => ({
        object: 'test',
        property,
        message: 'Put shared e2e setup in a fixture in e2e/fixtures.ts, or inline it in the test.',
      })),
      {
        property: 'getByTestId',
        message:
          "Find elements by role, label or text: a test id passes even when users and screen readers can't find the element.",
      },
      { property: 'useLoaderData', message: loaderDataMessage },
      ...['page', 'context'].map((object) => ({
        object,
        property: 'route',
        message:
          'e2e runs against the real API. Mock the network in Vitest with worker.use from src/test/worker.ts.',
      })),
    ],
    'vitest/no-restricted-vi-methods': ['error', { mock: mockMessage, doMock: mockMessage }],
    'vitest/no-conditional-in-test': 'error',
    // For the console.error check in src/test/setup.ts; test files cannot use hooks (vitest/no-hooks)
    'vitest/no-standalone-expect': ['error', { additionalTestBlockFunctions: ['afterEach'] }],
    'oxc/no-barrel-file': ['error', { threshold: 0 }],
    'shadcn/no-restyle': ['error', { allow: ['layout'] }],
    'shadcn/no-raw-colors': 'error',
    'shadcn/no-arbitrary-values': 'error',
    'shadcn/no-inline-styles': 'error',
    'shadcn/no-unknown-classes': 'error',
    'shadcn/require-static-classes': 'error',
    '@tanstack/query/exhaustive-deps': 'error',
    '@tanstack/query/stable-query-client': 'error',
    '@tanstack/query/no-rest-destructuring': 'error',
    '@tanstack/query/no-unstable-deps': 'error',
    '@tanstack/query/infinite-query-property-order': 'error',
    '@tanstack/query/mutation-property-order': 'error',
    '@tanstack/query/prefer-query-options': 'error',
    '@tanstack/router/create-route-property-order': 'error',
    '@tanstack/router/route-param-names': 'error',
  },
  ignorePatterns: [
    'src/routeTree.gen.ts',
    '.claude/skills/**',
    // shadcn output: no lint, fix typecheck and React Doctor errors there by hand. Its tests are ours
    'src/components/ui/**',
    '!src/components/ui/*.test.tsx',
  ],
  overrides: [
    {
      files: ['e2e/fixtures.ts'],
      rules: { 'no-restricted-imports': 'off' },
    },
    {
      files: ['**/*.test.{ts,tsx}'],
      rules: {
        'vitest/max-nested-describe': ['error', { max: 1 }],
        'vitest/no-hooks': 'error',
      },
    },
    {
      files: ['**/*.test.{ts,tsx}', 'e2e/**'],
      // Test steps run in order by design. Without this, a list of assertions has no lint-clean
      // loop: Promise.all fails vitest/require-awaited-expect-poll
      rules: { 'no-await-in-loop': 'off' },
    },
    {
      files: ['src/routes/**'],
      rules: {
        'unicorn/filename-case': 'off',
        'react/only-export-components': 'off',
      },
    },
    {
      files: ['src/main.tsx', 'src/app/**', 'src/test/**'],
      rules: restrictImports(),
    },
    {
      files: ['src/components/**', 'src/hooks/**', 'src/lib/**'],
      rules: restrictImports({
        regex: importOf('app|features|routes'),
        message: 'Shared code must not depend on app, features or routes.',
      }),
    },
    {
      files: ['src/features/**'],
      rules: restrictImports(
        appImport,
        {
          regex: '^@/features(/|$)',
          message:
            'Import files of this feature with relative paths. Move code that two features share to components, hooks or lib.',
        },
        {
          regex: importOf('routes'),
          message:
            "Features must not import routes. Use getRouteApi('/path') for typed route hooks.",
        },
        {
          regex: '^\\.\\./',
          message:
            'A feature is a flat folder: import its own files with ./ and shared code with @/. A ../ import reaches another feature.',
        },
      ),
    },
  ],
})
