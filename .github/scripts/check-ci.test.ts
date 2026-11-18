/*
 * Copyright (c) 2026. valo.media GmbH
 * Licensed under the Apache License, Version 2.0.
 */

import assert from "node:assert/strict";
import { test } from "node:test";
import { checkCI } from "./check-ci.ts";

const repository = "valomedia/JetNews";
const sha = "a".repeat(40);
const successfulRun = {
  head_sha: sha,
  head_branch: "main",
  head_repository: { full_name: repository },
  event: "push",
  status: "completed",
  conclusion: "success",
};

function checkRuns(runs: unknown[]): void {
  checkCI(repository, sha, "refs/heads/main", function (_command, args) {
    if (args.includes(".object.sha")) return sha;
    return JSON.stringify([{ workflow_runs: runs }]);
  });
}

test("accepts successful CI for this exact main commit, including later API pages", function () {
  checkCI(repository, sha, "refs/heads/main", function (command, args) {
    assert.equal(command, "gh");
    if (args.includes(".object.sha")) return `${sha}\n`;
    assert.ok(args.includes(`repos/${repository}/actions/workflows/ci.yml/runs`));
    assert.ok(args.includes(`head_sha=${sha}`));
    assert.ok(args.includes("--paginate"));
    assert.ok(args.includes("--slurp"));
    return JSON.stringify([{ workflow_runs: [] }, { workflow_runs: [successfulRun] }]);
  });
});

test("rejects absent CI", function () {
  assert.throws(function () { checkRuns([]); }, /No successful/);
});

for (const [name, change] of Object.entries({
  "wrong SHA": { head_sha: "b".repeat(40) },
  "wrong branch": { head_branch: "feature" },
  "fork": { head_repository: { full_name: "someone/JetNews" } },
  "PR run": { event: "pull_request" },
  "pending": { status: "in_progress" },
  "failure": { conclusion: "failure" },
  "cancelled": { conclusion: "cancelled" },
  "skipped": { conclusion: "skipped" },
})) {
  test(`rejects CI with ${name}`, function () {
    assert.throws(function () { checkRuns([{ ...successfulRun, ...change }]); }, /No successful/);
  });
}

test("rejects non-main dispatch before accessing the API", function () {
  assert.throws(function () {
    checkCI(repository, sha, "refs/heads/feature", function () {
      assert.fail("API must not be called");
    });
  }, /dispatched on main/);
});

test("rejects stale dispatch", function () {
  assert.throws(function () {
    checkCI(repository, sha, "refs/heads/main", function () { return "new-commit"; });
  }, /main has advanced/);
});

test("fails closed on API errors and malformed responses", function () {
  assert.throws(function () {
    checkCI(repository, sha, "refs/heads/main", function () { throw new Error("HTTP 403"); });
  }, /HTTP 403/);
  assert.throws(function () {
    checkCI(repository, sha, "refs/heads/main", function (_command, args) {
      return args.includes(".object.sha") ? sha : "not JSON";
    });
  }, SyntaxError);
});
