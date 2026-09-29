/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import nextJest from 'next/jest.js';

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

/** @type {import('jest').Config} */
const config = {
  clearMocks: true,
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/setupTests.js"],
  // d3-hierarchy ships ESM only; its UMD build runs under Jest untransformed.
  moduleNameMapper: {
    "^d3-hierarchy$": "<rootDir>/node_modules/d3-hierarchy/dist/d3-hierarchy.js",
  },

};

export default createJestConfig(config);
