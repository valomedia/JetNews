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
import { pathToFileURL } from "node:url";

type ReadCommand = (command: string, args: string[]) => string;

type WorkflowRun = {
  head_sha: string;
  head_branch: string;
  head_repository: { full_name: string };
  event: string;
  status: string;
  conclusion: string | null;
};

function readCommand(command: string, args: string[]): string {
  return execFileSync(command, args, { encoding: "utf8" });
}

export function checkCI(
  repository: string,
  sha: string,
  ref: string,
  read: ReadCommand = readCommand,
): void {
  if (ref !== "refs/heads/main" || !repository || !sha) {
    throw new Error("CD must be dispatched on main with a repository and commit SHA.");
  }

  const currentSha = read("gh", [
    "api", `repos/${repository}/git/ref/heads/main`, "--jq", ".object.sha",
  ]).trim();
  if (currentSha !== sha) {
    throw new Error("main has advanced. Dispatch CD again for its current commit.");
  }

  const pages: { workflow_runs: WorkflowRun[] }[] = JSON.parse(read("gh", [
    "api", "--method", "GET", `repos/${repository}/actions/workflows/ci.yml/runs`,
    "-f", `head_sha=${sha}`, "-f", "branch=main", "-f", "event=push",
    "-f", "status=success", "-f", "per_page=100", "--paginate", "--slurp",
  ]));
  const successfulRun = pages.flatMap(function (page) {
    return page.workflow_runs;
  }).some(function (run) {
    return run.head_sha === sha
      && run.head_branch === "main"
      && run.head_repository?.full_name === repository
      && run.event === "push"
      && run.status === "completed"
      && run.conclusion === "success";
  });

  if (!successfulRun) {
    throw new Error(`No successful main-push CI run exists for ${sha}.`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  checkCI(
    process.env.GITHUB_REPOSITORY ?? "",
    process.env.GITHUB_SHA ?? "",
    process.env.GITHUB_REF ?? "",
  );
}
