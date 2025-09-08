import eslintConfig from '@antfu/eslint-config'

export default eslintConfig({
  ignores: ['tmp'],
}, {
  rules: {
    'node/prefer-global/process': 'off',
  },
})
