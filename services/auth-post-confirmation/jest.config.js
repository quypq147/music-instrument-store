/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  setupFiles: ["<rootDir>/tests/env.setup.ts"],
  // This directory has a committed esbuild bundle (index.js) sitting next to
  // index.ts (repo convention for all services/* Lambdas, built by the root
  // `build:lambdas` script). Jest's default moduleFileExtensions resolves
  // ".js" before ".ts", so `import ... from "../index"` would silently load
  // the stale compiled bundle instead of the TypeScript source, defeating the
  // whole point of these tests. Prioritize ts so tests always exercise index.ts.
  moduleFileExtensions: ["ts", "js", "json", "node"],
};
