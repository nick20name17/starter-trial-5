import { execFileSync } from 'node:child_process'

import { defineConfig } from 'react-doctor/api'
import { z } from 'zod/mini'

// React Doctor runs its own copies of oxlint's React and a11y rules and reads only its own
// disable comments, while oxlint fails on a disable comment for a rule it does not run. A rule
// both run could never be disabled with a reason, so each one belongs to one linter: oxlint
const oxlintRules = z
  .object({ rules: z.record(z.string(), z.unknown()) })
  .parse(JSON.parse(execFileSync('oxlint', ['--print-config'], { encoding: 'utf8' }))).rules
const rulesOxlintRuns = Object.entries(oxlintRules)
  .filter(([key, severity]) => /^(react|jsx_a11y)\//.test(key) && severity !== 'allow')
  .map(([key]) => `react-doctor/${key.split('/')[1]}`)

export default defineConfig({
  noScore: true,
  adoptExistingLintConfig: false,
  rules: {
    ...Object.fromEntries(rulesOxlintRuns.map((rule) => [rule, 'off'])),
    // Same check as oxlint's react/no-array-index-key, under another name
    'react-doctor/no-array-index-as-key': 'off',
    'react-doctor/unused-export': 'error',
    'react-doctor/unused-type': 'error',
    'react-doctor/unused-dependency': 'error',
  },
  ignore: {
    files: ['src/routeTree.gen.ts'],
    overrides: [
      { files: ['src/components/ui/**'], rules: ['react-doctor/only-export-components'] },
    ],
  },
})
