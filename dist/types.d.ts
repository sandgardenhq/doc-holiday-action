export interface ActionInputs {
    apiToken: string;
    body: string;
    publication?: string;
    stage?: boolean;
    labels?: string[];
    relevantLinks?: string[];
    changeset?: ChangesetInput;
}
export interface ChangesetInput {
    releasesCount?: number;
    timeRangeStart?: string;
    timeRangeEnd?: string;
    commitsCount?: number;
    commitsSinceSha?: string;
    commitsShas?: string[];
    commitsStartSha?: string;
    commitsEndSha?: string;
    commitsIncludeStart?: boolean;
    tagsStart?: string;
    tagsEnd?: string;
}
export interface WorkStateRequest {
    body: string;
    publication?: string;
    stage?: boolean;
    labels?: string[];
    relevantLinks?: string[];
    changes?: any[];
}
export interface WorkStateEntry {
    id: string;
    createdAt: string;
    status: string;
    message: string;
}
export interface WorkStateResponse {
    id: string;
    jobId: string;
    outId: string;
    orgId: string;
    status: string;
    publicationId: string;
    connectionId: string;
    publicationName: string;
    triggerType: string;
    operationType: string;
    createdAt: string;
    updatedAt: string;
    branch: string;
    title: string;
    summary: string;
    outputUrl: string;
    staged: boolean;
    excludedFiles: string[];
    entries: WorkStateEntry[];
}
//# sourceMappingURL=types.d.ts.map