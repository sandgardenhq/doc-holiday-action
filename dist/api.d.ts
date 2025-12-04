import { DocHolidayRequest, DocHolidayResponse } from './types';
/**
 * Create a doc.holiday job
 */
export declare function createJob(apiToken: string, request: DocHolidayRequest): Promise<DocHolidayResponse>;
/**
 * Construct job URL for doc.holiday UI
 */
export declare function constructJobUrl(jobId: string): string;
//# sourceMappingURL=api.d.ts.map