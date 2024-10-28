import eslintJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import eslintTs from "typescript-eslint";
import html from "eslint-plugin-html";

const recommendedTypeScriptConfigs = [
  ...eslintTs.configs.recommended.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  ...eslintTs.configs.stylistic.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
];

export default [
  { ignores: ["dist/*"] }, // global ignores
  eslintJs.configs.recommended,
  eslintPluginPrettierRecommended,
  ...recommendedTypeScriptConfigs,
  {
    files: ["src/**/*.ts"],
    plugins: {
      import: importPlugin,
      "import/parsers": tsParser,
    },
    languageOptions: {
      parser: tsParser,
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2024,
      sourceType: "module",
    },
    settings: {
      "import/parsers": {
        "@typescript-eslint/parser": [".ts"],
      },
    },
    rules: {
      ...importPlugin.configs.typescript.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          caughtErrors: "none",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["src/templates/**/*"],
    languageOptions: {
      ecmaVersion: 3,
      sourceType: "script",
      globals: {
        ...globals.browser,
        ...globals.builtin,
        __cmpapi: true,
        __hbb_tracking_tgt: true,
      },
    },
    rules: {
      "no-empty": "off",
      "no-unused-vars": "off",
      "no-constant-condition": "off",
      "no-constant-binary-expression": "off",
      "prettier/prettier": [
        "error",
        {
          singleQuote: true,
          trailingComma: "none",
        },
      ],
    },
    plugins: { html },
  },
  {
    files: ["eslint.config.mjs", "gulpfile.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    files: ["express.js", "spec/**/*.js", "load_test/**/*.js"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.browser,
        __ENV: true,
      },
    },
  },
];
