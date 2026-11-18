/*
 * Copyright (c) 2026. valo.media GmbH
 * All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

export const screenshotNames = [
  "main-activity-home-feed.png",
  "main-activity-navigation-destinations.png",
  "main-activity-article.png",
];

export function updateVersion(source: string, version: string): string {
  if (!/^\d+\.\d+\.\d+$/.test(version)) {
    throw new Error(`Expected a stable semantic version, got ${version}.`);
  }

  const codePattern = /^([ \t]*versionCode[ \t]*=[ \t]*)(\d+)([ \t]*)$/gm;
  const namePattern = /^([ \t]*versionName[ \t]*=[ \t]*)"[^"]*"([ \t]*)$/gm;
  const codes = [...source.matchAll(codePattern)];
  if (codes.length !== 1 || [...source.matchAll(namePattern)].length !== 1) {
    throw new Error("Expected exactly one literal versionCode and versionName in app/build.gradle.kts.");
  }

  const nextCode = Number(codes[0][2]) + 1;
  if (!Number.isSafeInteger(nextCode) || nextCode < 2 || nextCode > 2100000000) {
    throw new Error("Incremented versionCode is outside Android's supported range.");
  }

  return source
    .replace(codePattern, function (_match, prefix: string, _code: string, suffix: string) {
      return `${prefix}${nextCode}${suffix}`;
    })
    .replace(namePattern, `$1"${version}"$2`);
}

function requireFile(path: string): void {
  const file = statSync(path);
  if (!file.isFile() || file.size === 0) {
    throw new Error(`Expected a nonempty file: ${path}`);
  }
}

function findArtifact(directory: string, extension: string): string {
  const files = readdirSync(directory).filter(function (name) {
    return name.endsWith(extension);
  });
  if (files.length !== 1) {
    throw new Error(`Expected exactly one ${extension} in ${directory}, found ${files.length}.`);
  }
  const path = join(directory, files[0]);
  requireFile(path);
  return path;
}

// Runs before @semantic-release/git, so a failed build or missing asset cannot be committed or tagged.
export function prepare(
  _pluginConfig: unknown,
  { cwd, nextRelease }: { cwd: string; nextRelease: { version: string } },
): void {
  for (const name of [
    "ANDROID_SIGNING_KEYSTORE_PATH",
    "ANDROID_SIGNING_KEYSTORE_PASSWORD",
    "ANDROID_SIGNING_KEY_ALIAS",
    "ANDROID_SIGNING_KEY_PASSWORD",
  ]) {
    if (!process.env[name]?.trim()) {
      throw new Error(`${name} must be configured and nonblank for publishing.`);
    }
  }
  requireFile(resolve(cwd, process.env.ANDROID_SIGNING_KEYSTORE_PATH!));

  const { version } = nextRelease;
  const gradleFile = join(cwd, "app/build.gradle.kts");
  const source = readFileSync(gradleFile, "utf8");
  const versionedSource = updateVersion(source, version);
  const screenshots = join(cwd, "build/instrumented-test-screenshots");
  for (const name of screenshotNames) {
    requireFile(join(screenshots, name));
  }

  writeFileSync(gradleFile, versionedSource);
  execFileSync("./gradlew", [
    ":app:bundleRelease", ":app:assembleDebug", "-PrequireReleaseSigning=true", "--no-daemon", "--stacktrace",
  ], { cwd, stdio: "inherit" });

  const bundle = findArtifact(join(cwd, "app/build/outputs/bundle/release"), ".aab");
  const apk = findArtifact(join(cwd, "app/build/outputs/apk/debug"), ".apk");
  const signature = execFileSync("jarsigner", [
    "-J-Duser.language=en", "-verify", bundle,
  ], { cwd, encoding: "utf8" });
  if (!signature.includes("jar verified.") || /unsigned/i.test(signature)) {
    throw new Error("Release AAB signature verification did not succeed.");
  }

  const releaseDirectory = join(cwd, "build/release");
  const payload = join(releaseDirectory, "payload");
  rmSync(releaseDirectory, { recursive: true, force: true });
  mkdirSync(join(payload, "screenshots"), { recursive: true });
  copyFileSync(bundle, join(payload, basename(bundle)));
  copyFileSync(apk, join(payload, basename(apk)));
  for (const name of screenshotNames) {
    copyFileSync(join(screenshots, name), join(payload, "screenshots", name));
  }

  // JDK jar writes a standard ZIP; omit its manifest so both archives contain the same payload.
  execFileSync("jar", [
    "--create", "--file", join(releaseDirectory, `JetNews-${version}.zip`),
    "--no-manifest", "-C", payload, ".",
  ], { cwd, stdio: "inherit" });
  execFileSync("tar", [
    "-czf", join(releaseDirectory, `JetNews-${version}.tar.gz`), "-C", payload, ".",
  ], { cwd, stdio: "inherit" });
}
