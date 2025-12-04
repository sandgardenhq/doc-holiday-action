/**
 * Parsed and validated action inputs
 */
export interface ActionInputs {
    apiToken: string;
    eventType?: 'release' | 'merge' | 'custom';
    title?: string;
    body?: string;
    publications?: string[];
    sourceConnection?: string;
    labels?: string[];
    comments?: string[];
    relevantLinks?: string[];
    changeset?: ChangesetInput;
}
/**
 * Changeset specification from action inputs
 */
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
/**
 * Smart defaults generated from GitHub event context
 */
export interface SmartDefaults {
    title: string;
    body: string;
    eventType?: 'release' | 'merge';
    changes?: any[];
}
/**
 * Doc.holiday API request body
 */
export interface DocHolidayRequest {
    docRequest: {
        title: string;
        body: string;
        sourceConnection: string;
        publications?: string[];
        labels?: string[];
        comments?: string[];
        relevantLinks?: string[];
        eventType?: 'release' | 'merge';
        changes?: any[];
    };
}
/**
 * Doc.holiday API response
 */
export interface DocHolidayResponse {
    id: string;
    orgId: string;
    type: string;
    state: 'requested' | 'running' | 'done' | 'errored';
}
/**
 * Action outputs
 */
export interface ActionOutputs {
    jobId: string;
    jobState: string;
    jobUrl: string;
}
//# sourceMappingURL=types.d.ts.map