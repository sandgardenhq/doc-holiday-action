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
const github_context_1 = require("./github-context");
const changes_1 = require("./changes");
const api_1 = require("./api");
async function run() {
    try {
        core.info('Starting doc.holiday GitHub Action...');
        // Step 1: Parse inputs
        const inputs = (0, inputs_1.parseInputs)();
        core.info('Inputs parsed and validated successfully');
        // Step 2: Determine title, body, eventType, and changes from smart defaults
        let title = inputs.title;
        let body = inputs.body;
        let eventType = inputs.eventType;
        let smartChanges;
        if (inputs.eventType === 'release' || inputs.eventType === 'merge') {
            core.info(`Smart mode: ${inputs.eventType}`);
            const smartDefaults = (0, github_context_1.getSmartDefaults)(inputs.eventType);
            title = smartDefaults.title;
            body = smartDefaults.body;
            eventType = smartDefaults.eventType;
            smartChanges = smartDefaults.changes;
        }
        if (!title || !body) {
            throw new Error('Title and body are required');
        }
        // Step 3: Infer source connection if not provided
        const sourceConnection = inputs.sourceConnection || (0, github_context_1.inferSourceConnection)();
        core.info(`Source connection: ${sourceConnection}`);
        // Step 4: Build changes array - prioritize manual inputs, then smart defaults
        let changes;
        if (inputs.changeset) {
            const builtChanges = (0, changes_1.buildChanges)(inputs.changeset);
            if (builtChanges.length > 0) {
                changes = builtChanges;
                core.info('Changeset specification added to request');
                core.warning('Changeset inputs override any commits specified in body');
            }
        }
        else if (smartChanges && smartChanges.length > 0) {
            // Use changes from smart defaults if no manual changeset provided
            changes = smartChanges;
            core.info('Using smart default changeset specification');
        }
        // Step 5: Build API request
        const request = {
            docRequest: {
                title,
                body,
                sourceConnection,
            },
        };
        // Add optional fields
        if (inputs.publications) {
            request.docRequest.publications = inputs.publications;
        }
        if (inputs.labels) {
            request.docRequest.labels = inputs.labels;
        }
        if (inputs.comments) {
            request.docRequest.comments = inputs.comments;
        }
        if (inputs.relevantLinks) {
            request.docRequest.relevantLinks = inputs.relevantLinks;
        }
        if (eventType && eventType !== 'custom') {
            request.docRequest.eventType = eventType;
        }
        if (changes) {
            request.docRequest.changes = changes;
        }
        core.info('API request constructed');
        // Step 6: Create job
        const response = await (0, api_1.createJob)(inputs.apiToken, request);
        // Step 7: Set outputs
        const jobUrl = (0, api_1.constructJobUrl)(response.id);
        core.setOutput('job-id', response.id);
        core.setOutput('job-state', response.state);
        core.setOutput('job-url', jobUrl);
        core.info('✓ Action completed successfully!');
        core.info(`Job ID: ${response.id}`);
        core.info(`Job State: ${response.state}`);
        core.info(`View job: ${jobUrl}`);
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
// Only run if not in test environment
if (process.env.NODE_ENV !== 'test') {
    run();
}
//# sourceMappingURL=index.js.map