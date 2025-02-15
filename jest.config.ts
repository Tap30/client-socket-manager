import { createJsWithTsEsmPreset, type JestConfigWithTsJest } from "ts-jest";

const jestConfig: JestConfigWithTsJest = {
  ...createJsWithTsEsmPreset(),
  verbose: true,
  setupFilesAfterEnv: ["./jest.setup.ts"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "__tests__/utils"],
  testMatch: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"],
  injectGlobals: false,
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.[jt]sx?$": "$1",
  },
};

export default jestConfig;
