"use strict";

/**
 * Tests for examples/typescript/fullstack/next-advanced/package.json
 *
 * This example app has no existing test infrastructure (no vitest/jest),
 * so these tests use Node's built-in test runner (`node:test`), which
 * requires no additional dependencies. Run with:
 *
 *   node --test package.test.js
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PACKAGE_JSON_PATH = path.join(__dirname, "package.json");

/**
 * Loads and parses package.json fresh for each test so mutations in one
 * test (there are none, but this keeps tests isolated) can't leak.
 */
function loadPackageJson() {
  const raw = fs.readFileSync(PACKAGE_JSON_PATH, "utf8");
  return { raw, json: JSON.parse(raw) };
}

test("package.json is valid, parseable JSON", () => {
  const { json } = loadPackageJson();
  assert.equal(typeof json, "object");
  assert.notEqual(json, null);
});

test("package.json has the expected top-level metadata", () => {
  const { json } = loadPackageJson();
  assert.equal(json.name, "next-advanced");
  assert.equal(json.version, "0.1.0");
  assert.equal(json.private, true);
});

test("package.json defines the expected npm scripts", () => {
  const { json } = loadPackageJson();
  assert.deepEqual(json.scripts, {
    dev: "next dev",
    build: "next build",
    start: "next start",
    lint: "next lint",
  });
});

test("dependencies section contains exactly the expected packages", () => {
  const { json } = loadPackageJson();
  const expectedKeys = [
    "@coinbase/onchainkit",
    "next",
    "react",
    "react-dom",
    "@tanstack/react-query",
    "viem",
    "wagmi",
    "x402",
  ];
  assert.deepEqual(Object.keys(json.dependencies).sort(), expectedKeys.sort());
});

test("@coinbase/onchainkit is pinned to an exact version (regression: previously 'latest')", () => {
  const { json } = loadPackageJson();
  const version = json.dependencies["@coinbase/onchainkit"];
  assert.equal(
    version,
    "1.0.0",
    "@coinbase/onchainkit must be pinned to an exact version",
  );
  assert.notEqual(
    version,
    "latest",
    "@coinbase/onchainkit must not use the unpinned 'latest' tag",
  );
  // An exact pin has no range operator (^, ~, >=, etc.) and no dist-tag text.
  assert.match(version, /^\d+\.\d+\.\d+$/);
});

test("next is upgraded to the ^16.x line", () => {
  const { json } = loadPackageJson();
  assert.equal(json.dependencies.next, "^16.1.5");
  assert.match(json.dependencies.next, /^\^16\./);
});

test("viem is upgraded to ^2.50.3", () => {
  const { json } = loadPackageJson();
  assert.equal(json.dependencies.viem, "^2.50.3");
});

test("wagmi is upgraded to the ^3.x major line", () => {
  const { json } = loadPackageJson();
  assert.equal(json.dependencies.wagmi, "^3.0.0");
  assert.match(json.dependencies.wagmi, /^\^3\./);
});

test("react and react-dom versions are unchanged by this PR", () => {
  const { json } = loadPackageJson();
  assert.equal(json.dependencies.react, "^19.0.0");
  assert.equal(json.dependencies["react-dom"], "^19.0.0");
});

test("@tanstack/react-query version is unchanged by this PR", () => {
  const { json } = loadPackageJson();
  assert.equal(json.dependencies["@tanstack/react-query"], "^5");
});

test("x402 remains a workspace dependency", () => {
  const { json } = loadPackageJson();
  assert.equal(json.dependencies.x402, "workspace:*");
});

test("devDependencies section contains exactly the expected packages", () => {
  const { json } = loadPackageJson();
  const expectedKeys = [
    "@types/node",
    "@types/react",
    "@types/react-dom",
    "eslint-config-next",
    "postcss",
    "tailwindcss",
    "typescript",
    "eslint",
  ];
  assert.deepEqual(
    Object.keys(json.devDependencies).sort(),
    expectedKeys.sort(),
  );
});

test("postcss is upgraded to ^8.5.10", () => {
  const { json } = loadPackageJson();
  assert.equal(json.devDependencies.postcss, "^8.5.10");
  assert.match(json.devDependencies.postcss, /^\^8\./);
});

test("eslint is upgraded to the ^9.x major line", () => {
  const { json } = loadPackageJson();
  assert.equal(json.devDependencies.eslint, "^9.0.0");
  assert.match(json.devDependencies.eslint, /^\^9\./);
});

test("eslint-config-next version is unchanged by this PR", () => {
  const { json } = loadPackageJson();
  assert.equal(json.devDependencies["eslint-config-next"], "^15.5.19");
});

test("unrelated devDependency versions are unchanged by this PR", () => {
  const { json } = loadPackageJson();
  assert.equal(json.devDependencies["@types/node"], "^20");
  assert.equal(json.devDependencies["@types/react"], "^19");
  assert.equal(json.devDependencies["@types/react-dom"], "^19");
  assert.equal(json.devDependencies.tailwindcss, "^3.4.1");
  assert.equal(json.devDependencies.typescript, "^5");
});

test("no dependency or devDependency uses the unpinned 'latest' tag", () => {
  const { json } = loadPackageJson();
  const allDeps = {
    ...json.dependencies,
    ...json.devDependencies,
  };
  for (const [name, version] of Object.entries(allDeps)) {
    assert.notEqual(
      version,
      "latest",
      `dependency "${name}" must not use the unpinned 'latest' tag`,
    );
  }
});

test("every dependency and devDependency version string is non-empty and well-formed", () => {
  const { json } = loadPackageJson();
  const allDeps = {
    ...json.dependencies,
    ...json.devDependencies,
  };
  // Accepts: workspace:*, exact semver (1.2.3), or ranges starting with
  // ^, ~, or a bare major version like "^5" / "20".
  const validVersionPattern = /^(workspace:\*|[\^~]?\d+(\.\d+)?(\.\d+)?)$/;
  for (const [name, version] of Object.entries(allDeps)) {
    assert.equal(typeof version, "string");
    assert.notEqual(version.trim(), "");
    assert.match(
      version,
      validVersionPattern,
      `dependency "${name}" has an unexpected version format: "${version}"`,
    );
  }
});