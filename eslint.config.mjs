import html from "eslint-plugin-html";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";

export default [
  eslintPluginPrettierRecommended,
  {
    files: ["src/**/*.js", "src/**/*.html", "test/**/*.html"],
    languageOptions: {
      ecmaVersion: 3,
      sourceType: "script",
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
    files: ["eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
  },
  {
    files: ["gulpfile.mjs"],
    languageOptions: {
      sourceType: "module",
    },
  },
];
