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
exports.run = run;
// src/index.ts
const core = __importStar(require("@actions/core"));
const inputs_1 = require("./inputs");
const changes_1 = require("./changes");
const api_1 = require("./api");
async function run() {
    try {
        core.info('Starting doc.holiday GitHub Action...');
        const inputs = (0, inputs_1.parseInputs)();
        core.info('Inputs parsed successfully');
        const request = {
            body: inputs.body,
        };
        if (inputs.publication) {
            request.publication = inputs.publication;
        }
        if (inputs.stage !== undefined) {
            request.stage = inputs.stage;
        }
        if (inputs.labels) {
            request.labels = inputs.labels;
        }
        if (inputs.relevantLinks) {
            request.relevantLinks = inputs.relevantLinks;
        }
        if (inputs.changeset) {
            const changes = (0, changes_1.buildChanges)(inputs.changeset);
            if (changes.length > 0) {
                request.changes = changes;
                core.info('Changeset specification added to request');
            }
        }
        core.info('Creating work state...');
        const response = await (0, api_1.createWorkState)(inputs.apiToken, request);
        // Set all outputs
        core.setOutput('id', response.id);
        core.setOutput('job-id', response.jobId);
        core.setOutput('out-id', response.outId);
        core.setOutput('org-id', response.orgId);
        core.setOutput('status', response.status);
        core.setOutput('publication-id', response.publicationId);
        core.setOutput('connection-id', response.connectionId);
        core.setOutput('publication-name', response.publicationName);
        core.setOutput('trigger-type', response.triggerType);
        core.setOutput('operation-type', response.operationType);
        core.setOutput('created-at', response.createdAt);
        core.setOutput('updated-at', response.updatedAt);
        core.setOutput('branch', response.branch);
        core.setOutput('title', response.title);
        core.setOutput('summary', response.summary);
        core.setOutput('output-url', response.outputUrl);
        core.setOutput('staged', String(response.staged));
        core.setOutput('excluded-files', JSON.stringify(response.excludedFiles));
        core.setOutput('entries', JSON.stringify(response.entries));
        core.info('Action completed successfully!');
        core.info(`Work State ID: ${response.id}`);
        core.info(`Status: ${response.status}`);
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unknown error occurred');
        }
    }
}
if (process.env.NODE_ENV !== 'test') {
    run();
}
//# sourceMappingURL=index.js.map