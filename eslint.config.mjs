import js from "@eslint/js"
import globals from "globals"

export default [
  {
    ignores: ["node_modules/", "css/mtt.css", "dist/", "build/", "coverage/"]
  },
  js.configs.recommended,
  {
    files: ["**/*.mjs", "**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2024,
        CONFIG: "readonly",
        CONST: "readonly",
        ChatMessage: "readonly",
        Hooks: "readonly",
        Roll: "readonly",
        fromUuid: "readonly",
        foundry: "readonly",
        game: "readonly",
        getDocumentClass: "readonly",
        ui: "readonly"
      }
    },
    rules: {
      semi: ["error", "never"],
      quotes: ["error", "double", { avoidEscape: true }],
      "no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_"
        }
      ]
    }
  }
]
