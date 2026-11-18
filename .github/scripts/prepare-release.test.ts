/*
 * Copyright (c) 2026. valo.media GmbH
 * Licensed under the Apache License, Version 2.0.
 */

import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test, type TestContext } from "node:test";
import { prepare, screenshotNames, updateVersion } from "./prepare-release.ts";

const source = 'android {\n    versionCode = 1\n    versionName = "1.0"\n}\n';
const version = "1.2.3";
const signingVariables = [
  "ANDROID_SIGNING_KEYSTORE_PATH",
  "ANDROID_SIGNING_KEYSTORE_PASSWORD",
  "ANDROID_SIGNING_KEY_ALIAS",
  "ANDROID_SIGNING_KEY_PASSWORD",
];
let fixtures: string;

before(function () {
  fixtures = mkdtempSync(join(tmpdir(), "jetnews-signing-fixture-"));
  writeFileSync(join(fixtures, "payload"), "Test bundle, not an Android application.");
  execFileSync("jar", ["cf", join(fixtures, "unsigned.aab"), "-C", fixtures, "payload"]);
  execFileSync("keytool", [
    "-genkeypair", "-keystore", join(fixtures, "test.keystore"), "-storepass", "fixture-only",
    "-keypass", "fixture-only", "-alias", "fixture", "-keyalg", "RSA", "-validity", "1",
    "-dname", "CN=Release Test", "-noprompt",
  ], { stdio: "pipe" });
  copyFileSync(join(fixtures, "unsigned.aab"), join(fixtures, "signed.aab"));
  execFileSync("jarsigner", [
    "-keystore", join(fixtures, "test.keystore"), "-storepass", "fixture-only",
    join(fixtures, "signed.aab"), "fixture",
  ], { stdio: "pipe" });
});

after(function () {
  if (fixtures) rmSync(fixtures, { recursive: true, force: true });
});

function workspace(t: TestContext, signed = true): string {
  for (const name of signingVariables) {
    const previous = process.env[name];
    t.after(function () {
      if (previous === undefined) delete process.env[name];
      else process.env[name] = previous;
    });
  }
  process.env.ANDROID_SIGNING_KEYSTORE_PATH = join(fixtures, "test.keystore");
  process.env.ANDROID_SIGNING_KEYSTORE_PASSWORD = "fixture-only";
  process.env.ANDROID_SIGNING_KEY_ALIAS = "fixture";
  process.env.ANDROID_SIGNING_KEY_PASSWORD = "fixture-only";

  const cwd = mkdtempSync(join(tmpdir(), "jetnews-release-test-"));
  t.after(function () { rmSync(cwd, { recursive: true, force: true }); });
  mkdirSync(join(cwd, "app"));
  writeFileSync(join(cwd, "app/build.gradle.kts"), source);
  const screenshots = join(cwd, "build/instrumented-test-screenshots");
  mkdirSync(screenshots, { recursive: true });
  for (const name of screenshotNames) writeFileSync(join(screenshots, name), `image ${name}`);
  copyFileSync(join(fixtures, signed ? "signed.aab" : "unsigned.aab"), join(cwd, "fixture.aab"));
  writeFileSync(join(cwd, "gradlew"), `#!/usr/bin/env bash
set -euo pipefail
printf '%s\\n' "$@" > gradle-arguments.txt
cp app/build.gradle.kts built-version.txt
mkdir -p app/build/outputs/bundle/release app/build/outputs/apk/debug
cp fixture.aab app/build/outputs/bundle/release/app-release.aab
printf 'debug APK fixture' > app/build/outputs/apk/debug/app-debug.apk
`, { mode: 0o755 });
  return cwd;
}

function files(directory: string, prefix = ""): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap(function (entry) {
    const relative = join(prefix, entry.name);
    return entry.isDirectory() ? files(join(directory, entry.name), relative) : [relative];
  }).sort();
}

test("updates only version metadata and increments the existing build number", function () {
  assert.equal(updateVersion(source, version), source.replace("= 1\n", "= 2\n").replace('"1.0"', '"1.2.3"'));
  assert.match(updateVersion(source.replace("= 1\n", "= 99\n"), "2.0.0"), /versionCode = 100/);
});

test("rejects invalid or ambiguous version metadata", function () {
  for (const invalid of ["1.2", "1.2.3-beta.1", "1.2.3; echo unsafe"]) {
    assert.throws(function () { updateVersion(source, invalid); }, /stable semantic version/);
  }
  for (const invalidSource of ["", `${source}${source}`, source.replace("= 1\n", "= 2100000000\n")]) {
    assert.throws(function () { updateVersion(invalidSource, version); }, /Expected exactly one|supported range/);
  }
});

test("builds the bumped version and packages identical signed AAB, APK and screenshot payloads", function (t) {
  const cwd = workspace(t);
  const release = join(cwd, "build/release");
  mkdirSync(release);
  writeFileSync(join(release, "JetNews-stale.zip"), "stale");
  prepare({}, { cwd, nextRelease: { version } });

  const updated = updateVersion(source, version);
  assert.equal(readFileSync(join(cwd, "app/build.gradle.kts"), "utf8"), updated);
  assert.equal(readFileSync(join(cwd, "built-version.txt"), "utf8"), updated);
  assert.equal(readFileSync(join(cwd, "gradle-arguments.txt"), "utf8"),
    ":app:bundleRelease\n:app:assembleDebug\n-PrequireReleaseSigning=true\n--no-daemon\n--stacktrace\n");
  assert.deepEqual(readdirSync(release).sort(), [`JetNews-${version}.tar.gz`, `JetNews-${version}.zip`, "payload"]);

  const zip = join(cwd, "zip");
  const tar = join(cwd, "tar");
  mkdirSync(zip);
  mkdirSync(tar);
  execFileSync("jar", ["xf", join(release, `JetNews-${version}.zip`)], { cwd: zip });
  execFileSync("tar", ["xzf", join(release, `JetNews-${version}.tar.gz`), "-C", tar]);
  const expected = ["app-release.aab", "app-debug.apk", ...screenshotNames.map(function (name) {
    return `screenshots/${name}`;
  })].sort();
  assert.deepEqual(files(zip), expected);
  assert.deepEqual(files(tar), expected);
  for (const file of expected) {
    assert.deepEqual(readFileSync(join(zip, file)), readFileSync(join(tar, file)));
  }
  assert.deepEqual(readFileSync(join(zip, "app-release.aab")), readFileSync(join(fixtures, "signed.aab")));
});

for (const name of signingVariables) {
  test(`rejects missing or whitespace-only ${name} before preparing a release`, function (t) {
    const cwd = workspace(t);
    for (const value of [undefined, "", "   ", "\t\r\n", "\u00a0\u2003"]) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
      assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, {
        message: `${name} must be configured and nonblank for publishing.`,
      });
      assert.equal(readFileSync(join(cwd, "app/build.gradle.kts"), "utf8"), source);
      assert.throws(function () { readFileSync(join(cwd, "gradle-arguments.txt")); }, /ENOENT/);
      assert.throws(function () { readdirSync(join(cwd, "build/release")); }, /ENOENT/);
    }
  });
}

test("rejects missing, empty and directory-valued release keystores before building", function (t) {
  const cwd = workspace(t);
  const empty = join(cwd, "empty.keystore");
  writeFileSync(empty, "");
  for (const path of [join(cwd, "missing.keystore"), empty, cwd]) {
    process.env.ANDROID_SIGNING_KEYSTORE_PATH = path;
    assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /ENOENT|nonempty file/);
    assert.equal(readFileSync(join(cwd, "app/build.gradle.kts"), "utf8"), source);
    assert.throws(function () { readFileSync(join(cwd, "gradle-arguments.txt")); }, /ENOENT/);
  }
});

test("preserves surrounding whitespace in nonblank signing credentials", function (t) {
  const cwd = workspace(t);
  process.env.ANDROID_SIGNING_KEYSTORE_PASSWORD = " fixture-only ";
  process.env.ANDROID_SIGNING_KEY_ALIAS = " fixture ";
  process.env.ANDROID_SIGNING_KEY_PASSWORD = " fixture-only ";
  const wrapper = join(cwd, "gradlew");
  writeFileSync(wrapper, `${readFileSync(wrapper, "utf8")}
[[ "$ANDROID_SIGNING_KEYSTORE_PASSWORD" == ' fixture-only ' ]]
[[ "$ANDROID_SIGNING_KEY_ALIAS" == ' fixture ' ]]
[[ "$ANDROID_SIGNING_KEY_PASSWORD" == ' fixture-only ' ]]
`);
  prepare({}, { cwd, nextRelease: { version } });
});

test("rejects missing and empty screenshots before changing version metadata", function (t) {
  const cwd = workspace(t);
  const screenshot = join(cwd, "build/instrumented-test-screenshots", screenshotNames[0]);
  writeFileSync(screenshot, "");
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /nonempty file/);
  rmSync(screenshot);
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /ENOENT/);
  assert.equal(readFileSync(join(cwd, "app/build.gradle.kts"), "utf8"), source);
});

test("propagates failed builds before making archives", function (t) {
  const cwd = workspace(t);
  writeFileSync(join(cwd, "gradlew"), "#!/usr/bin/env bash\nexit 23\n");
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /Command failed/);
  assert.throws(function () { readdirSync(join(cwd, "build/release")); }, /ENOENT/);
});

test("rejects unsigned bundles before making archives", function (t) {
  const cwd = workspace(t, false);
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /signature verification/);
  assert.throws(function () { readdirSync(join(cwd, "build/release")); }, /ENOENT/);
});

test("rejects bundles with unsigned entries", function (t) {
  const cwd = workspace(t);
  writeFileSync(join(cwd, "extra"), "unsigned entry");
  execFileSync("jar", ["uf", join(cwd, "fixture.aab"), "-C", cwd, "extra"]);
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /signature verification/);
});

test("rejects bundles with tampered signed entries", function (t) {
  const cwd = workspace(t);
  writeFileSync(join(cwd, "payload"), "tampered entry");
  execFileSync("jar", ["uf", join(cwd, "fixture.aab"), "-C", cwd, "payload"]);
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /Command failed/);
});

test("rejects a missing debug APK", function (t) {
  const cwd = workspace(t);
  const wrapper = join(cwd, "gradlew");
  writeFileSync(wrapper, `${readFileSync(wrapper, "utf8")}rm app/build/outputs/apk/debug/app-debug.apk\n`);
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /exactly one .apk/);
});

test("rejects ambiguous build artifacts", function (t) {
  const cwd = workspace(t);
  const bundles = join(cwd, "app/build/outputs/bundle/release");
  mkdirSync(bundles, { recursive: true });
  writeFileSync(join(bundles, "extra.aab"), "extra");
  assert.throws(function () { prepare({}, { cwd, nextRelease: { version } }); }, /exactly one .aab/);
});

test("semantic-release prepares artifacts before committing and publishes only GitHub archives", function () {
  const config = JSON.parse(readFileSync(new URL("../../.releaserc.json", import.meta.url), "utf8"));
  assert.deepEqual(config.branches, ["main"]);
  assert.equal(config.tagFormat, "v${version}");
  assert.deepEqual(config.plugins, [
    ["@semantic-release/commit-analyzer", { preset: "conventionalcommits" }],
    ["@semantic-release/release-notes-generator", { preset: "conventionalcommits" }],
    "./.github/scripts/prepare-release.ts",
    ["@semantic-release/git", {
      assets: ["app/build.gradle.kts"],
      message: "chore: bump version and build number",
    }],
    ["@semantic-release/github", {
      assets: ["build/release/JetNews-*.zip", "build/release/JetNews-*.tar.gz"],
      successCommentCondition: false,
      failCommentCondition: false,
      releasedLabels: false,
    }],
  ]);
});
