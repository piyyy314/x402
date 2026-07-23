// Tests for package.json of the auth_based_pricing example.
//
// This example project has no test infrastructure (no jest/vitest configured),
// so these tests use Node's built-in test runner (`node --test`) and read the
// manifest directly from disk. They validate the dependency version bumps
// introduced in this PR and guard against accidental regressions or
// inconsistent versioning across the x402 package family.

import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageJsonPath = path.join(__dirname, "package.json");

/**
 * Parses a caret semver range string (e.g. "^1.2.3") into its numeric parts.
 */
function parseCaretVersion(range) {
  const match = /^\^(\d+)\.(\d+)\.(\d+)$/.exec(range);
  assert.ok(match, `Expected a caret semver range, got "${range}"`);
  const [, major, minor, patch] = match;
  return { major: Number(major), minor: Number(minor), patch: Number(patch) };
}

describe("auth_based_pricing package.json", () => {
  let pkg;
  let rawContents;

  test("is valid, parseable JSON", () => {
    rawContents = readFileSync(packageJsonPath, "utf-8");
    assert.doesNotThrow(() => {
      pkg = JSON.parse(rawContents);
    });
    assert.ok(pkg && typeof pkg === "object");
  });

  test("retains required top-level metadata fields", () => {
    pkg = JSON.parse(rawContents);
    assert.equal(pkg.name, "auth-based-pricing");
    assert.equal(pkg.type, "module");
    assert.equal(pkg.main, "dist/backend.js");
    assert.equal(pkg.license, "MIT");
  });

  test("retains all expected scripts", () => {
    pkg = JSON.parse(rawContents);
    assert.deepEqual(pkg.scripts, {
      build: "tsc",
      "start:server": "node dist/backend.js",
      "dev:server": "tsx watch backend.ts",
      "start:client": "node dist/client.js",
      "dev:client": "tsx client.ts",
      dev: "npm run dev:server",
    });
  });

  describe("dependencies", () => {
    test("contains exactly the expected dependency set", () => {
      pkg = JSON.parse(rawContents);
      const expectedDeps = [
        "@coinbase/x402",
        "@hono/node-server",
        "dotenv",
        "hono",
        "node-fetch",
        "siwe",
        "viem",
        "x402",
        "x402-fetch",
        "x402-hono",
      ];
      assert.deepEqual(Object.keys(pkg.dependencies).sort(), [...expectedDeps].sort());
    });

    test("bumps @coinbase/x402 to ^0.5.0", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["@coinbase/x402"], "^0.5.0");
    });

    test("bumps @hono/node-server to ^1.19.10", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["@hono/node-server"], "^1.19.10");
    });

    test("bumps hono to ^4.9.6", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["hono"], "^4.9.6");
    });

    test("bumps viem to ^2.50.3", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["viem"], "^2.50.3");
    });

    test("bumps x402 to ^0.5.2", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["x402"], "^0.5.2");
    });

    test("bumps x402-fetch to ^0.5.0", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["x402-fetch"], "^0.5.0");
    });

    test("bumps x402-hono to ^0.5.0", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["x402-hono"], "^0.5.0");
    });

    test("leaves unrelated dependencies (dotenv, node-fetch, siwe) untouched", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.dependencies["dotenv"], "^16.4.5");
      assert.equal(pkg.dependencies["node-fetch"], "^3.3.2");
      assert.equal(pkg.dependencies["siwe"], "^2.3.2");
    });

    test("all dependency ranges are well-formed caret semver ranges", () => {
      pkg = JSON.parse(rawContents);
      for (const [name, range] of Object.entries(pkg.dependencies)) {
        assert.match(
          range,
          /^\^\d+\.\d+\.\d+$/,
          `Dependency "${name}" has malformed version range "${range}"`,
        );
      }
    });

    test("keeps the entire x402 package family on the same 0.5.x minor version", () => {
      // Regression guard: @coinbase/x402, x402, x402-fetch, and x402-hono are
      // designed to interoperate and should be bumped together in lockstep to
      // avoid protocol-version mismatches between the facilitator/client/server
      // packages.
      pkg = JSON.parse(rawContents);
      const x402Family = ["@coinbase/x402", "x402", "x402-fetch", "x402-hono"];
      const versions = x402Family.map((name) => parseCaretVersion(pkg.dependencies[name]));

      const [first, ...rest] = versions;
      for (const version of rest) {
        assert.equal(version.major, first.major, "x402 family major versions must match");
        assert.equal(version.minor, first.minor, "x402 family minor versions must match");
      }
    });
  });

  describe("devDependencies", () => {
    test("contains exactly the expected devDependency set", () => {
      pkg = JSON.parse(rawContents);
      assert.deepEqual(Object.keys(pkg.devDependencies).sort(), [
        "@types/node",
        "@types/node-fetch",
        "tsx",
        "typescript",
      ]);
    });

    test("bumps tsx to ^4.22.0", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.devDependencies["tsx"], "^4.22.0");
    });

    test("leaves @types/node, @types/node-fetch, and typescript untouched", () => {
      pkg = JSON.parse(rawContents);
      assert.equal(pkg.devDependencies["@types/node"], "^20.14.2");
      assert.equal(pkg.devDependencies["@types/node-fetch"], "^2.6.11");
      assert.equal(pkg.devDependencies["typescript"], "^5.4.5");
    });

    test("all devDependency ranges are well-formed caret semver ranges", () => {
      pkg = JSON.parse(rawContents);
      for (const [name, range] of Object.entries(pkg.devDependencies)) {
        assert.match(
          range,
          /^\^\d+\.\d+\.\d+$/,
          `DevDependency "${name}" has malformed version range "${range}"`,
        );
      }
    });
  });

  test("does not declare the same package in both dependencies and devDependencies", () => {
    pkg = JSON.parse(rawContents);
    const depNames = new Set(Object.keys(pkg.dependencies));
    const devDepNames = new Set(Object.keys(pkg.devDependencies));
    const overlap = [...depNames].filter((name) => devDepNames.has(name));
    assert.deepEqual(overlap, []);
  });
});