import next from 'eslint-config-next'

/** @type {import('eslint').Linter.FlatConfig[]} */
const config = [
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'out/**',
      'android/**',
      'ios/**',
    ],
  },
  ...next,
  {
    rules: {
      'react/no-unescaped-entities': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
]

export default config