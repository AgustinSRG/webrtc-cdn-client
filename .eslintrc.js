module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: [
      '@typescript-eslint',
    ],
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/eslint-recommended',
      'plugin:@typescript-eslint/recommended',
    ],
    "rules": {
        "@typescript-eslint/explicit-module-boundary-types": 0,
        "no-console": 0,
        "no-async-promise-executor": 0,
        "only-arrow-functions": 0,
        "interface-name": 0,
        "no-empty": 0,
        "max-line-length": 0,
        "max-classes-per-file": 0,
        "eqeqeq": 2,
        "indent": ["error", 4],
        "no-var-requires": 0,
        "@typescript-eslint/explicit-function-return-type": 0,
        "@typescript-eslint/no-explicit-any": 0,
        "@typescript-eslint/no-empty-function": 0,
        "@typescript-eslint/camelcase": 0,
        "object-literal-sort-keys": 0,
        "no-useless-escape": 0,
        "@typescript-eslint/no-unused-vars": 0,
        "@typescript-eslint/no-use-before-define": 0,
    },
  };