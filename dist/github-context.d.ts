import { SmartDefaults } from './types';
/**
 * Generate smart defaults based on GitHub event context
 */
export declare function getSmartDefaults(eventType: 'release' | 'merge'): SmartDefaults;
/**
 * Infer source connection from current repository
 */
export declare function inferSourceConnection(): string;
//# sourceMappingURL=github-context.d.ts.map