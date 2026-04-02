// functions/eslint.config.js
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    // This tells ESLint: "I am the root for this folder, stop looking upstairs"
    files: ["**/*.ts", "**/*.js"],
    languageOptions: {
      parser: tsParser,
      sourceType: "module",

      globals: {
        ...globals.node, // This tells ESLint that 'console', 'process', etc. exist
        ...globals.es2015,
      },
      parserOptions: {
        project: "./tsconfig.json",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      quotes: ["error", "double"],
      indent: ["error", 2],
      "no-undef": "off",
      "no-unused-expressions": "off",
      "@typescript-eslint/no-unused-expressions": "error",
    },
  },
  {
    ignores: ["lib/**/*", "generated/**/*", "eslint.config.js"],
  },
];
