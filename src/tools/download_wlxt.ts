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

import { any, z } from 'zod';
import { defineTool } from './tool.js';
import { outputFile } from '../config.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import type { ResourceSchema } from '../resources/resource.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// colearner-mcp/downloads
const DOWNLOAD_DIR = path.join(__dirname, '..', '..', 'downloads');

// Utilities for logging
const log = (message: string) => console.log(`[WLXT DOWNLOAD] ${message}`);
const error = (message: string, detail?: string) => console.error(`[WLXT DOWNLOAD ERROR] ${message}${detail ? ': ' + detail : ''}`);

if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

const CONFIG = {
  SAVE_DIR: DOWNLOAD_DIR,
};

async function downloadCourseRes(context: any, title: string, filetype: any): Promise<ResourceSchema> {
  const tab = await context.ensureTab();
  log(`FileType: ${filetype}`);
  const elements = await tab.page.$$('li[kjbt], li[onclick]');
  const resources = [];


  for (const element of elements) {
    const elementInfo = await element.evaluate((el: HTMLElement) => {
      const titleSpan = el.querySelector<HTMLSpanElement>('span.spancolor');
      const fileType = el.querySelector<HTMLSpanElement>('span.fileType');
      const fileSize = el.querySelector<HTMLSpanElement>('span.fileSize');
      const downloadBtn = el.querySelector<HTMLAnchorElement>('a.btn[onclick*="downloadkj"]');
      
      return {
        title: titleSpan?.textContent || '',
        type: fileType?.textContent || '',
        size: fileSize?.textContent || '',
        downloadId: downloadBtn?.getAttribute('onclick')?.match(/downloadkj\('([^']+)'\)/)?.[1] || ''
      };
    });

    if (!filetype || filetype == "default"){
      if (elementInfo.title.toLowerCase().includes(title.toLowerCase())) {
        resources.push({
          element,
          ...elementInfo
        });
      }
    }
    else{
      if (elementInfo.title.toLowerCase().includes(title.toLowerCase()) && (!filetype || elementInfo.type.toLowerCase() === filetype.toLowerCase())) {
        resources.push({
          element,
          ...elementInfo
        });
      }
    }
  }

  if (resources.length === 0) {
    throw new Error(`Resource with title '${title}' not found.`);
  }

  const resource = resources[0];

  const downloadButton = await resource.element.$('a.btn[onclick*="downloadkj"]');
  const downloadPromise = tab.page.waitForEvent('download');
  await downloadButton.click();
  const download = await downloadPromise;

  const fileType = resource.type.toLowerCase();
  const outputPath = path.join(CONFIG.SAVE_DIR, `${resource.title}.${fileType}`);
  log(`File saved at ${outputPath}`);
  
  await download.saveAs(outputPath);

  return {
    uri: outputPath,
    name: resource.title,
    mimeType: getProperMimeType(fileType),
    description: `WLXT Course Resource: ${resource.title} (Size: ${resource.size})`
  };
}

function getProperMimeType(fileType: string): string {
  const mimeTypes: { [key: string]: string } = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'txt': 'text/plain',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'mp4': 'video/mp4',
    'mp3': 'audio/mpeg'
  };

  const ext = fileType.toLowerCase().replace('.', '');
  return mimeTypes[ext] || `application/${ext}`;
}

const downloadResTool = defineTool({
  capability: 'core',
  schema: {
    name: 'browser_download_wlxt_course_resource',
    title: 'Download Resource',
    description: 'Download a file from current page and save it as a resource for further use. Make Sure you have used browser_wlxt_navigate_course_file tool to be in the file page.',
    inputSchema: z.object({
      resourceName: z.string().describe('Name to save the resource as'),
      resourceType: z.enum(['document', 'image', 'video', 'audio']).describe('Type of resource, enum:["document", "image", "video", "audio"]'),
      fileSuffix: z.string().describe('Provide file suffix (e.g., pdf, docx) if you want to specify, else provide "default".'),
    }),
    type: 'destructive',
  },
  handle: async (context, params) => {
    const result = await downloadCourseRes(context, params.resourceName, params.fileSuffix);

    
    return {
      code: [
        `// Downloaded resource: ${result.name}`,
        `// Type: ${params.resourceType}`,
        `// Path: ${result.uri}`,
      ],
      captureSnapshot: true,
      waitForNetwork: true,
    };
  },
});




export default [
  downloadResTool,
];