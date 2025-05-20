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
import test from 'node:test';

// Utilities for logging
const log = (message: string) => console.log(`[WLXT] ${message}`);
const error = (message: string, detail?: string) => console.error(`[WLXT ERROR] ${message}${detail ? ': ' + detail : ''}`);

// Define URL patterns as CONFIG
const CONFIG = {
    COURSE_MAIN: 'https://learn.tsinghua.edu.cn/f/wlxt/index/course/student/course?wlkcid=',
    COURSE_FILES: 'https://learn.tsinghua.edu.cn/f/wlxt/kj/wlkc_kjxxb/student/beforePageList?wlkcid=',
    COURSE_HOMEWORK: 'https://learn.tsinghua.edu.cn/f/wlxt/kczy/zy/student/beforePageList?wlkcid=',
    COURSE_HOMEWORK_END: '&sfgk=0',
    URL_MAIN: 'https://learn.tsinghua.edu.cn/f/wlxt/index/course/student/',
};

async function getCourseUrl(context: any, courseName: string): Promise<string> {
    log(`Searching for course URL with name: ${courseName}`);

    try {
        const tab = await context.ensureTab();
        
        // 等待页面加载完成并确保至少有一个课程链接可见
        await tab.page.waitForLoadState('networkidle');
        
        // 使用 JavaScript 的方式检查元素是否可见并获取链接
        const courseLink = await tab.page.evaluate((searchName: string) => {
            const links = Array.from(document.querySelectorAll('a.title.stu'));
            for (const link of links) {
                // 检查元素是否可见
                const style = window.getComputedStyle(link);
                const isVisible = style.display !== 'none' && 
                                style.visibility !== 'hidden' && 
                                style.opacity !== '0';
                
                if (isVisible) {
                    const text = link.textContent?.trim() || '';
                    // 使用更宽松的匹配规则
                    if (text.toLowerCase().includes(searchName.toLowerCase())) {
                        return {
                            text: text,
                            href: link.getAttribute('href') || ''
                        };
                    }
                }
            }
            return null;
        }, courseName);

        if (courseLink) {
            log(`Matched course: ${courseLink.text}`);
            return courseLink.href;
        }

        throw new Error(`Course URL not found for course: ${courseName}`);
    } catch (err: any) {
        error('Failed to get course URL', err.message);
        throw err;
    }
}

async function navigateToCourse(context: any, courseName: string) {

    // if not in CONFIG.URL_MAIN, goto URL_MAIN
    try{
        const tab = await context.ensureTab();
        const currenturl = tab.page.url();
        log(`${currenturl}`)
        if (currenturl != CONFIG.URL_MAIN){
            await tab.page.goto(CONFIG.URL_MAIN);
        }
    } catch(err: any){
        error('Navigate Failed', err.message);
        throw err;
    }

    const courseUrl = await getCourseUrl(context, courseName); 
    log(`Course URL: ${courseUrl}`);

    const fullUrl = CONFIG.COURSE_MAIN + courseUrl.split('wlkcid=')[1];
    log(`Navigating to course: ${fullUrl}`);

    try {
        const tab = await context.ensureTab();
        
        await Promise.all([
            tab.page.goto(fullUrl),
            tab.page.waitForLoadState('domcontentloaded'),
            tab.page.waitForLoadState('networkidle')
        ]);

        await tab.captureSnapshot();
        return courseUrl;
    } catch (err: any) {
        error('Navigate Failed', err.message);
        throw err;
    }
}

async function navigateToHomework(context: any, courseName: string, courseUrl: string) {

    const fullUrl = CONFIG.COURSE_HOMEWORK + courseUrl.split('wlkcid=')[1];
    log(`Navigating to homework: ${fullUrl}`);

    try {
        const tab = await context.ensureTab();
        
        await Promise.all([
            tab.page.goto(fullUrl),
            tab.page.waitForLoadState('domcontentloaded'),
            tab.page.waitForLoadState('networkidle')
        ]);

        await tab.captureSnapshot();
        return 'Navigate Successfully';
    } catch (err: any) {
        error('Navigate Failed', err.message);
        throw err;
    }
}

async function navigateToFile(context: any, courseName: string, courseUrl: string) {

    const fullUrl = CONFIG.COURSE_FILES + courseUrl.split('wlkcid=')[1] + CONFIG.COURSE_HOMEWORK_END;
    log(`Navigating to files: ${fullUrl}`);

    try {
        const tab = await context.ensureTab();
        
        await Promise.all([
            tab.page.goto(fullUrl),
            tab.page.waitForLoadState('domcontentloaded'),
            tab.page.waitForLoadState('networkidle')
        ]);

        await tab.captureSnapshot();
        return 'Navigate Successfully';
    } catch (err: any) {
        error('Navigate Failed', err.message);
        throw err;
    }
}


const navigateCourseTool = defineTool({
    capability: 'core',
    schema: {
        name: 'browser_wlxt_navigate_to_course',
        title: 'Navigate in wlxt of THU',
        description: 'Navigate Courses After Logged in to WLXT (Using loginWlxtTool)',
        inputSchema: z.object({
            courseName: z.string().describe('Course Name'),
        }),
        type: 'destructive',
    },
    handle: async (context, params) =>{
        let result = [];
        try{
            result.push(`Navigating to course page: ${params.courseName}`);
            await navigateToCourse(context, params.courseName);

        } catch (err: any){
            result.push("Navigation Failed")
        }

        return {
            code: result.map(line => `// ${line}`),
            captureSnapshot: true,
            waitForNetwork: true,
        }
    },
});



const navigateCourseFileTool = defineTool({
    capability: 'core',
    schema: {
        name: 'browser_wlxt_navigate_course_file',
        title: 'Navigate in wlxt of THU',
        description: 'Navigate Course File After Logged in to WLXT (Using loginWlxtTool)',
        inputSchema: z.object({
            courseName: z.string().describe('Course Name'),
        }),
        type: 'destructive',
    },
    handle: async (context, params) =>{
        let result = [];
        try{
            result.push(`Navigating to course page: ${params.courseName}`);
            const courseUrl = await navigateToCourse(context, params.courseName);
            result.push(`Goto Course File`);
            await navigateToFile(context, params.courseName, courseUrl);

        } catch (err: any){
            result.push("Navigation Failed")
        }

        return {
            code: result.map(line => `// ${line}`),
            captureSnapshot: true,
            waitForNetwork: true,
        }
    },
});


const navigateCourseHWTool = defineTool({
    capability: 'core',
    schema: {
        name: 'browser_wlxt_navigate_course_homework',
        title: 'Navigate in wlxt of THU',
        description: 'Navigate Course Homework After Logged in to WLXT (Using loginWlxtTool).',
        inputSchema: z.object({
            courseName: z.string().describe('Course Name'),
        }),
        type: 'destructive',
    },
    handle: async (context, params) =>{
        let result = [];
        try{
            result.push(`Navigating to course page: ${params.courseName}`);
            const courseUrl = await navigateToCourse(context, params.courseName);
            result.push(`Goto Course Homework`);
            await navigateToHomework(context, params.courseName, courseUrl);

        } catch (err: any){
            result.push("Navigation Failed")
        }

        return {
            code: result.map(line => `// ${line}`),
            captureSnapshot: true,
            waitForNetwork: true,
        }
    },
});

export default [
    navigateCourseTool,
    navigateCourseFileTool,
    navigateCourseHWTool,
];