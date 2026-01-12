module.exports = {
  root: true,
  extends: ['next/core-web-vitals', 'eslint:recommended'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    'react/react-in-jsx-scope': 'off',
    '@next/next/no-img-element': 'off',
    'react/no-unescaped-entities': 'off',
  },
};
