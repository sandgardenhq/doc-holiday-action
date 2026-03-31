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
exports.createWorkState = createWorkState;
// src/api.ts
const core = __importStar(require("@actions/core"));
const API_BASE_URL = 'https://api.doc.holiday';
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
async function createWorkState(apiToken, request) {
    const url = `${API_BASE_URL}/api/v1/work_states/`;
    let lastError = null;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            core.info(`Attempting to create work state (attempt ${attempt}/${MAX_RETRIES})...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });
            if (response.status === 401) {
                throw new Error('Authentication failed. Please check your api-token. Ensure it is stored in GitHub secrets and passed correctly.');
            }
            if (response.status === 429) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                core.warning(`Rate limited (429). Retrying in ${delay}ms...`);
                await sleep(delay);
                continue;
            }
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Doc.holiday API error (${response.status}): ${errorText}`);
            }
            const data = await response.json();
            core.info(`Work state created successfully: ${data.id}`);
            return data;
        }
        catch (error) {
            lastError = error;
            if (lastError.message.includes('Authentication failed')) {
                throw lastError;
            }
            if (attempt < MAX_RETRIES) {
                const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt - 1);
                core.warning(`Request failed: ${lastError.message}. Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
    throw new Error(`Failed to create work state after ${MAX_RETRIES} attempts: ${lastError?.message}`);
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
//# sourceMappingURL=api.js.map