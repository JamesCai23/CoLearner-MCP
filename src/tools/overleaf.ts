/**
 * Copyright (c) James Yimo Cai
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */



import fs from 'node:fs';
import path from 'node:path';
import { late, z } from 'zod';
import { defineTool } from './tool.js';
import { PageSnapshot } from '../pageSnapshot.js';

// Utilities for logging
const log = (message: string) => console.log(`[THU Overleaf] ${message}`);
const error = (message: string, detail?: string) => console.error(`[THU Overleaf] ${message}${detail ? ': ' + detail : ''}`);

const CONFIG = {
    OVERLEAF_URL: 'https://overleaf.tsinghua.edu.cn',
};

interface DownloadTask {
    element: string;
    ref: string;
    filename: string;
}

// Create New Overleaf Project
async function createnew(context:any, projectName: string){
    log('Starting Creat New Project');
    try{
        const tab = await context.ensureTab();
        await tab.page.click('a.btn.btn-primary.sidebar-new-proj-btn.dropdown-toggle');
        await tab.page.click('a[ng-click="openCreateProjectModal()"]:has-text("Blank Project")');
        await tab.page.waitForSelector('input[ng-model="inputs.projectName"]');
        await tab.page.fill('input[ng-model="inputs.projectName"]', projectName);
        await tab.page.click('button.btn.btn-primary[ng-click="create()"]');
        await tab.page.waitForSelector('textarea.ace_text-input', { timeout: 30000 });

        if(tab.hasSnapshot()){
            log('Project created successfully');
            return "Successfully created new project";
        } else {
            throw new Error('Failed to capture final snapshot');
        }

    } catch (err:any){
        error('Create Project Failed', err.message);
        throw err;
    }
}

// Go to Overleaf Homepage
async function homepage(context: any) {
    log('Starting go to homepage');

    try {
        const tab = await context.ensureTab();
        await tab.page.goto(CONFIG.OVERLEAF_URL);
        await tab.captureSnapshot();

        if (tab.hasSnapshot()) {
            log('Page snapshot captured successfully');
            // Make sure we have reached Homepage.
            return true;
        } else {
            throw new Error("Can't go to homepage correctly.");
        }
    } catch (err: any) {
        error('Homepage Failed', err.message);
        throw err;
    }
}


// Go to Specific project
async function goproject(context: any, projectName: string) {
    log('Starting to navigate to specific project');

    try {
        const tab = await context.ensureTab();
        await tab.page.waitForSelector('table.project-list-table'); // Wait for the project list table to load
        const projectSelector = `a.project-list-table-name-link:has-text("${projectName}")`; // Select the project by name
        await tab.page.click(projectSelector); // Click on the project link
        await tab.page.waitForSelector('textarea.ace_text-input', { timeout: 30000 }); // Wait for the project editor to load

        log(`Navigated to project: ${projectName}`);
        return `Successfully navigated to project: ${projectName}`;
    } catch (err: any) {
        error('Failed to navigate to project', err.message);
        throw err;
    }
}


const overleafhomeTool = defineTool({
    capability: 'core', 
    schema: {
        name: 'browser_overleaf_homepage',
        title: 'Tsinghua Overleaf Homepage.',
        description: 'Go to overleaf homepage of THU. User must log into the overleaf in before you action.',
        inputSchema: z.object({
            
        }),
        type: 'destructive',
    },
    handle: async (context, params) => {
        try {
            const homepage_result = await homepage(context);
            
            return {
                code: [`// ${homepage_result}`],
                captureSnapshot: true,
                waitForNetwork: true,
            };
        } catch (err: any) {
            return {
                code: [`// Logging in failed: ${err.message}`],
                captureSnapshot: true,
                waitForNetwork: true,
            };
        }
    },
});

const overleafcreateTool = defineTool({
    capability: 'core', 
    schema: {
        name: 'browser_overleaf_create_project',
        title: 'Tsinghua Overleaf for new project like homeworks.',
        description: 'Create New Overleaf project for homeworks, etc. You must use Overleaf Homepage Tool before creating a new project.',
        inputSchema: z.object({
            projectName: z.string().describe('Name for new project'),
        }),
        type: 'destructive',
    },
    handle: async (context, params) => {
        try {
                const result = await createnew(context, params.projectName);
                return {
                    code: [`// ${result}`],
                    captureSnapshot: true,
                    waitForNetwork: true,
                };
        } catch (err: any) {
            return {
                code: [`// Creation failed: ${err.message}`],
                captureSnapshot: true,
                waitForNetwork: true,
            };
        }
    },
});


const overleafnaviTool = defineTool({
    capability: 'core', 
    schema: {
        name: 'browser_overleaf_navigate',
        title: 'Navigate in Tsinghua Overleaf for existing projects like homeworks.',
        description: 'Navigate to existing Overleaf project for homeworks, etc.',
        inputSchema: z.object({
            projectName: z.string().describe('Name for the project'),
        }),
        type: 'destructive',
    },
    handle: async (context, params) => {
        try {
                const result = await goproject(context, params.projectName);
                return {
                    code: [`// ${result}`],
                    captureSnapshot: true,
                    waitForNetwork: true,
                };
        } catch (err: any) {
            return {
                code: [`// Navigation failed: ${err.message}`],
                captureSnapshot: true,
                waitForNetwork: true,
            };
        }
    },
});

export default [
    overleafhomeTool,
    overleafcreateTool,
    overleafnaviTool,
];