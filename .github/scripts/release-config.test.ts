/*
 * Copyright (c) 2026. valo.media GmbH
 * Licensed under the Apache License, Version 2.0.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

type PluginOptions = Record<string, unknown>;
type Plugin = string | [string, PluginOptions];
type ReleaseType = "major" | "minor" | "patch" | null;

const cwd = fileURLToPath(new URL("../../", import.meta.url));
const config: { plugins: Plugin[] } = JSON.parse(
  readFileSync(new URL("../../.releaserc.json", import.meta.url), "utf8"),
);

function plugin(name: string): { name: string; options: PluginOptions } {
  const entry = config.plugins.find(function (entry) {
    return (typeof entry === "string" ? entry : entry[0]) === name;
  });
  assert.ok(entry, `Missing configured plugin: ${name}`);
  return typeof entry === "string" ? { name: entry, options: {} } : { name: entry[0], options: entry[1] };
}

function context(messages: string[]) {
  return {
    cwd,
    commits: messages.map(function (message, index) {
      return { message, hash: (index + 1).toString(16).padStart(40, "0") };
    }),
    logger: { log() {} },
    options: { repositoryUrl: "https://github.com/example/jetnews.git" },
    lastRelease: { version: "1.0.0", gitTag: "v1.0.0" },
    nextRelease: { version: "2.0.0", gitTag: "v2.0.0" },
  };
}

const analyzer = plugin("@semantic-release/commit-analyzer");
const generator = plugin("@semantic-release/release-notes-generator");
const analyzeCommits: (options: PluginOptions, releaseContext: ReturnType<typeof context>) => Promise<ReleaseType> =
  (await import(analyzer.name)).analyzeCommits;
const generateNotes: (options: PluginOptions, releaseContext: ReturnType<typeof context>) => Promise<string> =
  (await import(generator.name)).generateNotes;

const breakingCases = [
  { message: "feat!: remove legacy endpoint", note: "remove legacy endpoint" },
  { message: "feat(api)!: remove legacy endpoint", note: "**api:** remove legacy endpoint" },
  { message: "chore!: require a newer runtime", note: "require a newer runtime" },
  { message: "feat: replace endpoint\n\nBREAKING CHANGE: migrate to API v2", note: "migrate to API v2" },
  { message: "fix(api): replace endpoint\n\nBREAKING-CHANGE: migrate to API v2", note: "**api:** migrate to API v2" },
  { message: "feat(api)!: replace endpoint\n\nBREAKING CHANGE: migrate to API v2", note: "**api:** migrate to API v2" },
];

for (const { message, note } of breakingCases) {
  test(`releases major and documents breaking change: ${message.split("\n")[0]}`, async function () {
    const releaseContext = context([message]);
    assert.equal(await analyzeCommits(analyzer.options, releaseContext), "major");
    const notes = await generateNotes(generator.options, releaseContext);
    const breakingSection = notes.match(/### [^\n]*BREAKING CHANGES\n([\s\S]*?)(?=\n### |$)/)?.[1];
    assert.ok(breakingSection?.includes(`* ${note}\n`), notes);
  });
}

const ordinaryCases: { message: string; type: ReleaseType; section?: string }[] = [
  { message: "fix: correct refresh", type: "patch", section: "Bug Fixes" },
  { message: "perf: speed up refresh", type: "patch", section: "Performance Improvements" },
  { message: "feat: add offline reading", type: "minor", section: "Features" },
  { message: "chore: bump version and build number", type: null },
  { message: "docs: explain release setup", type: null },
];

for (const { message, type, section } of ordinaryCases) {
  test(`preserves release behavior: ${message}`, async function () {
    const releaseContext = context([message]);
    assert.equal(await analyzeCommits(analyzer.options, releaseContext), type);
    const notes = await generateNotes(generator.options, releaseContext);
    assert.doesNotMatch(notes, /BREAKING CHANGES/);
    const subject = message.slice(message.indexOf(": ") + 2);
    if (section) {
      assert.ok(notes.includes(`### ${section}`), notes);
      assert.ok(notes.includes(subject), notes);
    } else {
      assert.ok(!notes.includes(subject), notes);
    }
  });
}

test("breaking headers take precedence over fixes and features in a release", async function () {
  for (const ordinary of ["fix: correct refresh", "feat: add offline reading"]) {
    const messages = [ordinary, "chore: bump version and build number", "feat!: remove legacy endpoint"];
    const releaseContext = context(messages);
    assert.equal(await analyzeCommits(analyzer.options, releaseContext), "major");
    const notes = await generateNotes(generator.options, releaseContext);
    assert.match(notes, /BREAKING CHANGES/);
    assert.match(notes, /remove legacy endpoint/);
    assert.ok(notes.includes(ordinary.slice(ordinary.indexOf(": ") + 2)), notes);
    assert.doesNotMatch(notes, /bump version and build number/);
  }
});
