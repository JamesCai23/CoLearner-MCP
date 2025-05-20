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
import { z } from 'zod';
import { defineTool } from './tool.js';
import { PageSnapshot } from '../pageSnapshot.js';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Utilities for logging
const log = (message: string) => console.log(`[WLXT] ${message}`);
const error = (message: string, detail?: string) => console.error(`[WLXT ERROR] ${message}${detail ? ': ' + detail : ''}`);

const CONFIG = {
    LOGIN_URL: process.env.LOGIN_URL || 'https://learn.tsinghua.edu.cn/f/login',
    COURSE_URL: process.env.COURSE_URL || 'https://learn.tsinghua.edu.cn/f/wlxt/kj/wlkc_kjxxb/student/beforePageList',
    LOGIN_USERNAME: process.env.LOGIN_USERNAME || '',
    LOGIN_PASSWORD: process.env.LOGIN_PASSWORD || '',
};

// Helper to extract error text from CallToolResponse
function getErrorTextFromResponse(response: any): string {
    if (response.isError && response.content && response.content.length > 0 && response.content[0].type === 'text') {
        return response.content[0].text;
    }
    return 'Unknown Error';
}

async function login(context: any) {
    log('Starting login process...');

    try {
        const tab = await context.ensureTab();
        await tab.page.goto(CONFIG.LOGIN_URL);
        await tab.captureSnapshot();

        if (tab.hasSnapshot()) {
            log('Page snapshot captured successfully');
            // 定位用户名和密码输入框并填充
            await tab.page.waitForSelector('input[name="i_user"]', { timeout: 10000 });
            await tab.page.fill('input[name="i_user"]', CONFIG.LOGIN_USERNAME);
            log('Filled username input');

            await tab.page.waitForSelector('input[name="i_pass"]', { timeout: 10000 });
            await tab.page.fill('input[name="i_pass"]', CONFIG.LOGIN_PASSWORD);
            log('Filled password input');

            // 查找并点击登录按钮
            const loginButtonSelector = '#loginButtonId';
            await tab.page.waitForSelector(loginButtonSelector, { timeout: 10000 });
            await tab.page.click(loginButtonSelector);
            log('Clicked login button');

            // 等待导航完成
            await tab.page.waitForNavigation({ timeout: 15000, waitUntil: 'domcontentloaded' });
            log('Navigation completed');
            await tab.captureSnapshot();

            return 'Login Successfully';
        } else {
            throw new Error('无法获取页面快照');
        }
    } catch (err: any) {
        error('Login Failed', err.message);
        throw err;
    }
}


const loginWlxtTool = defineTool({
    capability: 'core', // 修复错误，将 capability 设置为有效值
    schema: {
        name: 'browser_wlxt_login',
        title: 'Login to wlxt of THU',
        description: 'Login to the Tsinghua University wlxt system',
        inputSchema: z.object({
            username: z.string().describe('Account for Logging in'),
            password: z.string().describe('Password'),
        }),
        type: 'destructive',
    },
    handle: async (context, params) => {
        try {
            const result = await login(context);
            return {
                code: [`// ${result}`],
                captureSnapshot: true,
                waitForNetwork: true,
            };
        } catch (err: any) {
            return {
                code: [`// Login failed: ${err.message}`],
                captureSnapshot: true,
                waitForNetwork: true,
            };
        }
    },
});

export default [
    loginWlxtTool,
];