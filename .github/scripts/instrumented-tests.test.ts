/*
 * Copyright (c) 2026. valo.media GmbH
 * Licensed under the Apache License, Version 2.0.
 */

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, type TestContext } from "node:test";
import { fileURLToPath } from "node:url";
import { screenshotNames } from "./prepare-release.ts";

function runTests(t: TestContext, testStatus = 0, pullStatus = 0, missingScreenshot = false): {
  status: number | null;
  commands: string;
} {
  const cwd = mkdtempSync(join(tmpdir(), "jetnews-instrumented-test-"));
  t.after(function () { rmSync(cwd, { recursive: true, force: true }); });
  mkdirSync(join(cwd, "bin"));
  mkdirSync(join(cwd, "device"));
  mkdirSync(join(cwd, "build/instrumented-test-screenshots"), { recursive: true });
  writeFileSync(join(cwd, "build/instrumented-test-screenshots/stale.png"), "stale");
  for (const name of screenshotNames.slice(missingScreenshot ? 1 : 0)) {
    writeFileSync(join(cwd, "device", name), "screenshot");
  }
  writeFileSync(join(cwd, "bin/adb"), `#!/usr/bin/env bash
set -euo pipefail
printf 'adb %s\\n' "$*" >> commands.txt
if [ "$1" = pull ]; then
  if [ "${pullStatus}" != 0 ]; then exit ${pullStatus}; fi
  cp device/*.png "$3"
fi
`, { mode: 0o755 });
  writeFileSync(join(cwd, "gradlew"), `#!/usr/bin/env bash
set -euo pipefail
printf 'gradlew %s\\n' "$*" >> commands.txt
test ! -e build/instrumented-test-screenshots/stale.png
exit ${testStatus}
`, { mode: 0o755 });
  const result = spawnSync("bash", [fileURLToPath(new URL("./instrumented-tests.sh", import.meta.url))], {
    cwd,
    env: { ...process.env, GITHUB_WORKSPACE: cwd, PATH: `${join(cwd, "bin")}:${process.env.PATH}` },
    encoding: "utf8",
  });
  return { status: result.status, commands: readFileSync(join(cwd, "commands.txt"), "utf8") };
}

test("clears stale screenshots, runs connectedCheck, then pulls fresh screenshots", function (t) {
  const result = runTests(t);
  assert.equal(result.status, 0);
  assert.match(result.commands, /^adb shell rm -rf .*\ngradlew connectedCheck --no-daemon --stacktrace\nadb pull /);
});

test("preserves an instrumented test failure and does not pull screenshots", function (t) {
  const result = runTests(t, 17);
  assert.equal(result.status, 17);
  assert.doesNotMatch(result.commands, /adb pull/);
});

test("fails when screenshot pull fails", function (t) {
  assert.equal(runTests(t, 0, 19).status, 19);
});

test("fails when an expected screenshot is absent", function (t) {
  assert.equal(runTests(t, 0, 0, true).status, 1);
});
