"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSmartDefaults = getSmartDefaults;
exports.inferSourceConnection = inferSourceConnection;
// src/github-context.ts
const github = __importStar(require("@actions/github"));
/**
 * Generate smart defaults based on GitHub event context
 */
function getSmartDefaults(eventType) {
    const context = github.context;
    if (eventType === 'release') {
        return getReleaseDefaults(context);
    }
    else if (eventType === 'merge') {
        return getMergeDefaults(context);
    }
    throw new Error(`Unsupported event type: ${eventType}`);
}
/**
 * Extract defaults from release event
 */
function getReleaseDefaults(context) {
    const release = context.payload.release;
    if (!release) {
        throw new Error('No release data found in event payload. Is this a release event?');
    }
    const tagName = release.tag_name;
    const body = release.body || '';
    return {
        title: `Release notes for ${tagName}`,
        body,
        eventType: 'release',
    };
}
/**
 * Extract defaults from PR merge event
 */
function getMergeDefaults(context) {
    const pr = context.payload.pull_request;
    if (!pr) {
        throw new Error('No pull request data found in event payload. Is this a PR event?');
    }
    if (!pr.merged) {
        throw new Error('Pull request is not merged. Use event-type: merge only for merged PRs.');
    }
    const prNumber = pr.number;
    const prTitle = pr.title;
    const body = pr.body || '';
    return {
        title: `Documentation for PR #${prNumber}: ${prTitle}`,
        body,
        eventType: 'merge',
    };
}
/**
 * Infer source connection from current repository
 */
function inferSourceConnection() {
    const context = github.context;
    return `${context.repo.owner}/${context.repo.repo}`;
}
//# sourceMappingURL=github-context.js.map