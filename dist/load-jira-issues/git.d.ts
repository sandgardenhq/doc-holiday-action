import type { Commit, ChangesetInput } from './types';
/**
 * Parse git log output into Commit objects
 */
export declare function parseGitLogOutput(output: string): Commit[];
/**
 * Build git log arguments based on changeset specification
 */
export declare function buildGitLogArgs(changeset: ChangesetInput): string[];
/**
 * Fetch commits from git based on changeset specification
 */
export declare function fetchCommits(changeset: ChangesetInput): Promise<Commit[]>;
//# sourceMappingURL=git.d.ts.map