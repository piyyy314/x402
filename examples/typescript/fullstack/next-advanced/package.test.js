"use strict";

/**
 * Tests for examples/typescript/fullstack/next-advanced/package.json
 *
 * This suite validates the dependency/devDependency changes introduced in
 * this PR:
 *  - dependencies: "@coinbase/onchainkit" pinned to an exact version (no
 *    longer "latest"), "next" bumped to ^16.1.5, "viem" bumped to ^2.50.3,
 *    "wagmi" bumped to ^3.0.0
 *  - devDependencies: "postcss" bumped to a fully-specified ^8.5.10,
 *    "eslint" bumped to ^9.0.0
 *
 * Uses Node's built-in test runner (node:test) so no additional test
 * dependencies are required to execute this file:
 *   node --test package.test.js
 */

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const PACKAGE_JSON_PATH = path.join(__dirname, "package.json");

/**
 * Parses a semver-ish range string such as "^16.1.5", "1.0.0", "^8" or
 * "^5" into its numeric components. Missing components default to 0.
 */
function parseVersion(range) {
  const match = /^[~^]?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(range);
  if (!match) {
    throw new Error(`Unable to parse version range: "${range}"`);
  }
  return {
    major: Number(match[1]),
    minor: match[2] !== undefined ? Number(match[2]) : 0,
    patch: match[3] !== undefined ? Number(match[3]) : 0,
  };
}

function readPackageJson() {
  const raw = fs.readFileSync(PACKAGE_JSON_PATH, "utf8");
  return { raw, json: JSON.parse(raw) };
}

test("package.json is valid, parseable JSON", () => {
  const { json } = readPackageJson();
  assert.equal(typeof json, "object");
  assert.notEqual(json, null);
});

test("package.json contains the expected top-level dependency sections", () => {
  const { json } = readPackageJson();
  assert.ok(json.dependencies, "dependencies field should exist");
  assert.ok(json.devDependencies, "devDependencies field should exist");
});

test("no dependency or devDependency uses an unpinned 'latest' tag", () => {
  const { json } = readPackageJson();
  const allDeps = {
    ...json.dependencies,
    ...json.devDependencies,
  };

  for (const [name, version] of Object.entries(allDeps)) {
    assert.notEqual(
      version,
      "latest",
      `dependency "${name}" must not use the unpinned "latest" tag`,
    );
  }
});

test('"@coinbase/onchainkit" is pinned to an exact version (regression: previously "latest")', () => {
  const { json } = readPackageJson();
  const version = json.dependencies["@coinbase/onchainkit"];

  assert.equal(version, "1.0.0");
  // An exact pin must not contain range operators.
  assert.doesNotMatch(version, /^[\^~]/);
});

test('"next" is upgraded to ^16.1.5 and is newer than the previous 15.5.19', () => {
  const { json } = readPackageJson();
  const version = json.dependencies["next"];

  assert.equal(version, "^16.1.5");

  const parsed = parseVersion(version);
  assert.equal(parsed.major, 16);
  assert.equal(parsed.minor, 1);
  assert.equal(parsed.patch, 5);

  const previous = parseVersion("^15.5.19");
  assert.ok(
    parsed.major > previous.major ||
      (parsed.major === previous.major && parsed.minor > previous.minor) ||
      (parsed.major === previous.major &&
        parsed.minor === previous.minor &&
        parsed.patch > previous.patch),
    "next version must not be a downgrade from the previous 15.5.19",
  );
});

test('"viem" is upgraded to ^2.50.3', () => {
  const { json } = readPackageJson();
  const version = json.dependencies["viem"];

  assert.equal(version, "^2.50.3");

  const parsed = parseVersion(version);
  assert.equal(parsed.major, 2);
  assert.equal(parsed.minor, 50);
  assert.equal(parsed.patch, 3);
});

test('"wagmi" is upgraded to the new major version ^3.0.0', () => {
  const { json } = readPackageJson();
  const version = json.dependencies["wagmi"];

  assert.equal(version, "^3.0.0");

  const parsed = parseVersion(version);
  assert.equal(parsed.major, 3, "wagmi should be on major version 3");

  const previous = parseVersion("^2.15.6");
  assert.ok(
    parsed.major > previous.major,
    "wagmi major version must be greater than the previous major version 2",
  );
});

test('"postcss" devDependency is fully pinned to ^8.5.10 (previously just "^8")', () => {
  const { json } = readPackageJson();
  const version = json.devDependencies["postcss"];

  assert.equal(version, "^8.5.10");

  const parsed = parseVersion(version);
  assert.equal(parsed.major, 8);
  assert.equal(parsed.minor, 5);
  assert.equal(parsed.patch, 10);
});

test('"eslint" devDependency is upgraded to the new major version ^9.0.0', () => {
  const { json } = readPackageJson();
  const version = json.devDependencies["eslint"];

  assert.equal(version, "^9.0.0");

  const parsed = parseVersion(version);
  assert.equal(parsed.major, 9, "eslint should be on major version 9");

  const previous = parseVersion("^8");
  assert.ok(
    parsed.major > previous.major,
    "eslint major version must be greater than the previous major version 8",
  );
});

test("all dependency and devDependency version strings are well-formed semver ranges", () => {
  const { json } = readPackageJson();
  const allDeps = {
    ...json.dependencies,
    ...json.devDependencies,
  };
  const validRangePattern = /^([\^~]?\d+(\.\d+)?(\.\d+)?|workspace:\*)$/;

  for (const [name, version] of Object.entries(allDeps)) {
    assert.match(
      version,
      validRangePattern,
      `dependency "${name}" has an unexpected version format: "${version}"`,
    );
  }
});

test("changed dependencies retain their expected caret range operator", () => {
  const { json } = readPackageJson();

  for (const name of ["next", "viem", "wagmi"]) {
    assert.match(
      json.dependencies[name],
      /^\^/,
      `dependency "${name}" is expected to use a caret range`,
    );
  }

  assert.match(
    json.devDependencies["postcss"],
    /^\^/,
    'devDependency "postcss" is expected to use a caret range',
  );
  assert.match(
    json.devDependencies["eslint"],
    /^\^/,
    'devDependency "eslint" is expected to use a caret range',
  );
});

test("unrelated dependencies untouched by this PR remain unchanged", () => {
  const { json } = readPackageJson();

  // x402 continues to resolve from the local workspace.
  assert.equal(json.dependencies["x402"], "workspace:*");
  // eslint-config-next was not part of this PR's version bumps.
  assert.equal(json.devDependencies["eslint-config-next"], "^15.5.19");
});