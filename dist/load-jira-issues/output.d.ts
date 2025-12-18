import type { ChangesetInput, OutputArtifact, ChangesetMetadata } from './types';
/**
 * Determine changeset type and metadata from input
 */
export declare function buildChangesetMetadata(changeset: ChangesetInput): ChangesetMetadata;
/**
 * Build output artifact from issue map
 */
export declare function buildOutputArtifact(issueMap: Map<string, string[]>, jiraBaseUrl: string, repository: string, changeset: ChangesetInput, totalCommits: number): OutputArtifact;
/**
 * Write artifact to JSON file
 */
export declare function writeArtifact(artifact: OutputArtifact, outputPath: string): void;
/**
 * Build comma-separated issue links string
 */
export declare function buildIssueLinksString(artifact: OutputArtifact): string;
/**
 * Build comma-separated issue keys string
 */
export declare function buildIssueKeysString(artifact: OutputArtifact): string;
//# sourceMappingURL=output.d.ts.map