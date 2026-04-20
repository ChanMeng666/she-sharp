/**
 * Shared Octokit instance + repo coordinates.
 */

import { Octokit } from "@octokit/rest";

import { GitHubError } from "./errors";

let octokit: Octokit | null = null;

export function getOctokit(): Octokit {
  if (octokit) return octokit;
  const token = process.env.GITHUB_BOT_TOKEN;
  if (!token) throw new GitHubError("GITHUB_BOT_TOKEN is not set");
  octokit = new Octokit({ auth: token });
  return octokit;
}

export function getRepoCoords(): { owner: string; repo: string; defaultBranch: string } {
  const full = process.env.GITHUB_REPO ?? "";
  const defaultBranch = process.env.GITHUB_REPO_DEFAULT_BRANCH ?? "main";
  const [owner, repo] = full.split("/");
  if (!owner || !repo) {
    throw new GitHubError(`GITHUB_REPO must be set as "owner/repo" (got "${full}")`);
  }
  return { owner, repo, defaultBranch };
}
