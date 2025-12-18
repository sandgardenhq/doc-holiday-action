import * as exec from '@actions/exec';
import type { Commit, ChangesetInput } from './types';

const GIT_LOG_FORMAT = '%H%x00%s%x00'; // SHA, null byte, subject, null byte

/**
 * Parse git log output into Commit objects
 */
export function parseGitLogOutput(output: string): Commit[] {
  if (!output.trim()) {
    return [];
  }

  const parts = output.split('\x00').filter(Boolean);
  const commits: Commit[] = [];

  for (let i = 0; i < parts.length; i += 2) {
    if (parts[i] && parts[i + 1] !== undefined) {
      commits.push({
        sha: parts[i],
        message: parts[i + 1],
      });
    } else if (parts[i]) {
      // Handle last commit if no trailing null byte
      commits.push({
        sha: parts[i],
        message: parts[i + 1] || '',
      });
    }
  }

  return commits;
}

/**
 * Build git log arguments based on changeset specification
 */
export function buildGitLogArgs(changeset: ChangesetInput): string[] {
  const args = ['log', `--format=${GIT_LOG_FORMAT}`];

  if (changeset.commitsCount !== undefined) {
    args.push('-n', changeset.commitsCount.toString());
  } else if (changeset.tagsStart) {
    const range = changeset.tagsEnd
      ? `${changeset.tagsStart}..${changeset.tagsEnd}`
      : `${changeset.tagsStart}..HEAD`;
    args.push(range);
  } else if (changeset.commitsStartSha && changeset.commitsEndSha) {
    const startRef = changeset.commitsIncludeStart
      ? `${changeset.commitsStartSha}^`
      : changeset.commitsStartSha;
    args.push(`${startRef}..${changeset.commitsEndSha}`);
  } else if (changeset.commitsSinceSha) {
    args.push(`${changeset.commitsSinceSha}..HEAD`);
  } else if (changeset.commitsShas && changeset.commitsShas.length > 0) {
    // For specific commits, we need to use --no-walk
    args.push('--no-walk');
    args.push(...changeset.commitsShas);
  } else if (changeset.releasesCount !== undefined) {
    // For releases, we need to find the last N release tags
    // This is a simplification - may need git describe or tag listing
    args.push('-n', '100'); // Fetch enough to cover releases
  } else if (changeset.timeRangeStart && changeset.timeRangeEnd) {
    args.push(`--since=${changeset.timeRangeStart}`);
    args.push(`--until=${changeset.timeRangeEnd}`);
  }

  return args;
}

/**
 * Fetch commits from git based on changeset specification
 */
export async function fetchCommits(changeset: ChangesetInput): Promise<Commit[]> {
  const args = buildGitLogArgs(changeset);

  const result = await exec.getExecOutput('git', args, {
    ignoreReturnCode: true,
    silent: true,
  });

  if (result.exitCode !== 0) {
    throw new Error(`Git command failed: ${result.stderr}`);
  }

  return parseGitLogOutput(result.stdout);
}
