/**
 * Copyright (c) Microsoft Corporation.
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

import common from './tools/common.js';
import console from './tools/console.js';
import dialogs from './tools/dialogs.js';
import files from './tools/files.js';
import install from './tools/install.js';
import keyboard from './tools/keyboard.js';
import navigate from './tools/navigate.js';
import network from './tools/network.js';
import pdf from './tools/pdf.js';
import snapshot from './tools/snapshot.js';
import tabs from './tools/tabs.js';
import screen from './tools/screen.js';
import testing from './tools/testing.js';
import loginWlxtTool from './tools/login_wlxt.js';
import navigateWlxtTool from './tools/navigate_wlxt.js';
import downloadResource from './tools/download_wlxt.js';
import overleafhomeTool from './tools/overleaf.js';
import overleafprojTool from './tools/overleaf.js';

import type { Tool } from './tools/tool.js';
import { log } from 'console';

export const snapshotTools: Tool<any>[] = [
  ...common(true),
  ...console,
  ...dialogs(true),
  ...files(true),
  ...install,
  ...keyboard(true),
  ...navigate(true),
  ...network,
  ...pdf,
  ...snapshot,
  ...tabs(true),
  ...testing,
  ...loginWlxtTool,
  ...navigateWlxtTool,
  ...downloadResource,
  ...overleafhomeTool,
  ...overleafprojTool,
];

export const screenshotTools: Tool<any>[] = [
  ...common(false),
  ...console,
  ...dialogs(false),
  ...files(false),
  ...install,
  ...keyboard(false),
  ...navigate(false),
  ...network,
  ...pdf,
  ...screen,
  ...tabs(false),
  ...testing,
  ...loginWlxtTool,
  ...navigateWlxtTool,
  ...downloadResource,
  ...overleafhomeTool,
  ...overleafprojTool,
];
