/**
 * Draft branch mechanism for the Slack bot.
 *
 * Flow:
 *   1. createDraftBranch: create slack-bot-drafts/<id> with the patched JSON
 *      as a single commit. Called when the ephemeral preview is shown.
 *   2. promoteDraftToPR: open a PR from the draft branch to main. Called
 *      when the admin clicks Confirm.
 *   3. deleteDraftBranch: cleanup. Called when the admin clicks Cancel.
 *
 * State lives entirely in Git — no external KV/Redis needed. The
 * Confirm/Cancel button payload carries only the draftId plus an HMAC
 * signature.
 */

import { GitHubError } from "./errors";
import { getOctokit, getRepoCoords } from "./github-client";

const EVENTS_JSON_PATH = "lib/data/json/events-custom.json";
const DRAFT_BRANCH_PREFIX = "slack-bot-drafts/";

export async function createDraftBranch(params: {
  draftId: string;
  updatedJsonText: string;
  commitSummary: string;
  adminUserId: string;
}): Promise<{ branch: string }> {
  const { owner, repo, defaultBranch } = getRepoCoords();
  const octokit = getOctokit();
  const branch = `${DRAFT_BRANCH_PREFIX}${params.draftId}`;

  try {
    const baseRef = await octokit.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${defaultBranch}`,
    });
    const baseSha = baseRef.data.object.sha;

    await octokit.rest.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branch}`,
      sha: baseSha,
    });

    // Get current file sha on main
    let fileSha: string | undefined;
    try {
      const cur = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: EVENTS_JSON_PATH,
        ref: defaultBranch,
      });
      if (!Array.isArray(cur.data) && "sha" in cur.data) fileSha = cur.data.sha;
    } catch (e: unknown) {
      // fall through; if the file doesn't exist we'll create it
    }

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: EVENTS_JSON_PATH,
      branch,
      message: `chore(events): [DRAFT] ${params.commitSummary}\n\nProposed by Slack admin ${params.adminUserId} via /event command.`,
      content: Buffer.from(params.updatedJsonText, "utf8").toString("base64"),
      sha: fileSha,
    });

    return { branch };
  } catch (e) {
    throw new GitHubError(e instanceof Error ? e.message : String(e));
  }
}

export async function promoteDraftToPR(params: {
  draftId: string;
  title: string;
  body: string;
}): Promise<{ url: string; number: number }> {
  const { owner, repo, defaultBranch } = getRepoCoords();
  const octokit = getOctokit();
  const branch = `${DRAFT_BRANCH_PREFIX}${params.draftId}`;

  try {
    const pr = await octokit.rest.pulls.create({
      owner,
      repo,
      head: branch,
      base: defaultBranch,
      title: params.title,
      body: params.body,
    });
    return { url: pr.data.html_url, number: pr.data.number };
  } catch (e) {
    throw new GitHubError(e instanceof Error ? e.message : String(e));
  }
}

export async function deleteDraftBranch(draftId: string): Promise<void> {
  const { owner, repo } = getRepoCoords();
  const octokit = getOctokit();
  const branch = `${DRAFT_BRANCH_PREFIX}${draftId}`;

  try {
    await octokit.rest.git.deleteRef({ owner, repo, ref: `heads/${branch}` });
  } catch (e) {
    // Swallow errors on cleanup — branch may not exist or have been deleted already
  }
}
