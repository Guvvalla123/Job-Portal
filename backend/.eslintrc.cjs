/* eslint-env node */
module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ["eslint:recommended", "prettier"],
  parserOptions: { ecmaVersion: 2022, sourceType: "script" },
  ignorePatterns: ["node_modules/", "coverage/"],
  rules: {
    "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "no-console": "off",
  },
};
