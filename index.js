#!/usr/bin/env node

import { select, confirm } from '@inquirer/prompts';
import { spawn } from 'child_process';
import { access } from 'fs/promises';
import { constants } from 'fs';

// Helper function to check if a command exists in PATH
const commandExists = (command) => {
  return new Promise((resolve) => {
    const child = spawn('command', ['-v', command], { stdio: 'ignore' });
    child.on('close', (code) => resolve(code === 0));
  });
};

// Expanded app configuration
const launchableApps = [
  {
    name: 'Claude',
    type: 'cli',
    command: 'claude',
    installCheck: 'claude',
    install: 'npm install -g @anthropic/claude-cli', // Placeholder, please verify
  },
  {
    name: 'Gemini',
    type: 'cli',
    command: 'gemini',
    installCheck: 'gemini', // Command to check for existence
    install: 'npm install -g @google/gemini-cli',
  },
  {
    name: 'Codex CLI',
    type: 'cli',
    command: 'codex',
    installCheck: 'codex',
    install: 'npm install -g @openai/codex', // Placeholder, please verify
  },
  {
    name: 'Cursor',
    type: 'gui',
    appName: 'Cursor', // App name for `open -a`
    installCheck: '/Applications/Cursor.app', // Path to check
    install: 'https://cursor.sh/',
  },
  
  {
    name: 'VSCode',
    type: 'gui',
    appName: 'Visual Studio Code',
    installCheck: '/Applications/Visual Studio Code.app',
    install: 'https://code.visualstudio.com/download',
  },
  {
    name: 'Windsurf',
    type: 'gui',
    appName: 'Windsurf', // Placeholder
    installCheck: '/Applications/Windsurf.app', // Placeholder
    install: 'https://example.com/windsurf-download', // Placeholder
  },
];

async function isInstalled(app) {
  try {
    if (app.type === 'cli') {
      return await commandExists(app.installCheck);
    }
    if (app.type === 'gui') {
      await access(app.installCheck, constants.F_OK);
      return true;
    }
  } catch (error) {
    return false;
  }
  return false;
}

function launchApp(app) {
  console.log(`Starting ${app.name}...`);
  const command = app.type === 'gui' ? 'open' : app.command;
  const args = app.type === 'gui' ? ['-a', app.appName] : [];

  const child = spawn(command, args, { stdio: 'inherit' });

  child.on('error', (error) => {
    console.error(`Error starting ${app.name}: ${error.message}`);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`${app.name} exited with code ${code}`);
    }
  });
}

async function handleInstallation(app) {
  if (app.type === 'cli') {
    const install = await confirm({
      message: `${app.name} is not installed. Would you like to install it now? (runs: ${app.install})`,
      default: true,
    });
    if (install) {
      console.log(`Installing ${app.name}...`);
      const [cmd, ...args] = app.install.split(' ');
      const child = spawn(cmd, args, { stdio: 'inherit' });
      child.on('close', (code) => {
        if (code === 0) {
          console.log(`${app.name} installed successfully. You can now run the tool again to launch it.`);
        } else {
          console.error(`Installation failed with code ${code}.`);
        }
      });
    }
  } else if (app.type === 'gui') {
    console.log(`${app.name} is not installed in your /Applications folder.`);
    console.log(`Please download and install it from: ${app.install}`);
  }
}

async function main() {
  try {
    const answer = await select({
      message: 'Choose an app to launch:',
      choices: launchableApps.map((app) => ({
        name: app.name,
        value: app.name,
      })),
    });

    const selectedApp = launchableApps.find((app) => app.name === answer);

    if (selectedApp) {
      if (await isInstalled(selectedApp)) {
        launchApp(selectedApp);
      } else {
        await handleInstallation(selectedApp);
      }
    }
  } catch (error) {
    if (error.isTtyError) {
      console.error("Your environment doesn't support interactive prompts.");
    } else {
      console.error("An error occurred:", error);
    }
  }
}

main();