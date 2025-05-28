import eslintJs from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import html from "eslint-plugin-html";
import importPlugin from "eslint-plugin-import";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import eslintTs from "typescript-eslint";

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
        __cmpapi: false,
        __hbb_tracking_tgt: false,
        __ejs: false,
      },
    },
    rules: {
      "no-empty": "off",
      "no-unused-vars": "off",
      "no-constant-condition": "off",
      eqeqeq: ["error", "always"],
      semi: 2,
      "no-multi-spaces": [
        "error",
        {
          exceptions: {
            VariableDeclarator: true,
            ImportDeclaration: true,
            Property: true,
            AssignmentExpression: true,
            CallExpression: true,
            SequenceExpression: true,
          },
        },
      ],
      "block-scoped-var": "error",
      curly: ["error", "multi-line"],
      "default-case": "error",
      "guard-for-in": "error",
      "no-alert": "error",
      "no-extra-label": "error",
      "no-floating-decimal": "error",
      "no-global-assign": "error",
      "no-implied-eval": "error",
      "no-iterator": "error",
      "no-labels": "error",
      "no-lone-blocks": "error",
      "no-new-func": "error",
      "no-new": "error",
      "no-param-reassign": "error",
      "no-proto": "error",
      "no-prototype-builtins": "error",
      "no-self-compare": "error",
      "no-sequences": "error",
      "no-throw-literal": "error",
      "no-unmodified-loop-condition": "error",
      "no-unused-expressions": ["error", { allowShortCircuit: true }],
      "no-useless-call": "error",
      "no-useless-concat": "error",
      "no-useless-escape": "error",
      "no-void": "error",
      "no-warning-comments": "error",
      "no-with": "error",
      radix: ["error", "as-needed"],
      yoda: ["error", "never", { exceptRange: true }],
      "semi-spacing": "error",
      "space-before-blocks": "error",
      "space-in-parens": ["error", "never"],
      "space-infix-ops": ["error", { int32Hint: false }],
      "space-unary-ops": "error",
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
      globals: {
        ...globals.node,
      },
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
