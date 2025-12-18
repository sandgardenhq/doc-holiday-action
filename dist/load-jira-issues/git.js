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
exports.parseGitLogOutput = parseGitLogOutput;
exports.buildGitLogArgs = buildGitLogArgs;
exports.fetchCommits = fetchCommits;
const exec = __importStar(require("@actions/exec"));
const GIT_LOG_FORMAT = '%H%x00%s%x00'; // SHA, null byte, subject, null byte
/**
 * Parse git log output into Commit objects
 */
function parseGitLogOutput(output) {
    if (!output.trim()) {
        return [];
    }
    const parts = output.split('\x00').filter(Boolean);
    const commits = [];
    for (let i = 0; i < parts.length; i += 2) {
        if (parts[i] && parts[i + 1] !== undefined) {
            commits.push({
                sha: parts[i],
                message: parts[i + 1],
            });
        }
        else if (parts[i]) {
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
function buildGitLogArgs(changeset) {
    const args = ['log', `--format=${GIT_LOG_FORMAT}`];
    if (changeset.commitsCount !== undefined) {
        args.push('-n', changeset.commitsCount.toString());
    }
    else if (changeset.tagsStart) {
        const range = changeset.tagsEnd
            ? `${changeset.tagsStart}..${changeset.tagsEnd}`
            : `${changeset.tagsStart}..HEAD`;
        args.push(range);
    }
    else if (changeset.commitsStartSha && changeset.commitsEndSha) {
        const startRef = changeset.commitsIncludeStart
            ? `${changeset.commitsStartSha}^`
            : changeset.commitsStartSha;
        args.push(`${startRef}..${changeset.commitsEndSha}`);
    }
    else if (changeset.commitsSinceSha) {
        args.push(`${changeset.commitsSinceSha}..HEAD`);
    }
    else if (changeset.commitsShas && changeset.commitsShas.length > 0) {
        // For specific commits, we need to use --no-walk
        args.push('--no-walk');
        args.push(...changeset.commitsShas);
    }
    else if (changeset.releasesCount !== undefined) {
        // For releases, we need to find the last N release tags
        // This is a simplification - may need git describe or tag listing
        args.push('-n', '100'); // Fetch enough to cover releases
    }
    else if (changeset.timeRangeStart && changeset.timeRangeEnd) {
        args.push(`--since=${changeset.timeRangeStart}`);
        args.push(`--until=${changeset.timeRangeEnd}`);
    }
    return args;
}
/**
 * Fetch commits from git based on changeset specification
 */
async function fetchCommits(changeset) {
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
//# sourceMappingURL=git.js.map