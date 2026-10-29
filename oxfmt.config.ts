import { defineConfig } from 'oxfmt'

export default defineConfig({
  singleQuote: true,
  jsxSingleQuote: true,
  semi: false,
  sortImports: true,
  sortTailwindcss: {
    stylesheet: 'src/index.css',
    functions: ['cn', 'cva'],
  },
  ignorePatterns: ['src/routeTree.gen.ts', '.claude/skills/**'],
})
