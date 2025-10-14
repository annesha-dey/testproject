#!/usr/bin/env node

/**
 * App Generator Script
 * Creates a new app based on the modular template
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createApp(appName) {
  if (!appName) {
    console.error('❌ Please provide an app name');
    console.log('Usage: node create-app.js <app-name>');
    console.log('Example: node create-app.js email-marketing');
    process.exit(1);
  }

  // Validate app name
  if (!/^[a-z][a-z0-9-]*$/.test(appName)) {
    console.error('❌ App name must be lowercase, start with a letter, and contain only letters, numbers, and hyphens');
    process.exit(1);
  }

  const appsDir = path.join(__dirname, 'apps');
  const templateDir = path.join(appsDir, 'profit-analyser');
  const newAppDir = path.join(appsDir, appName);

  // Check if app already exists
  if (fs.existsSync(newAppDir)) {
    console.error(`❌ App '${appName}' already exists`);
    process.exit(1);
  }

  // Check if template exists
  if (!fs.existsSync(templateDir)) {
    console.error('❌ Template app (profit-analyser) not found');
    process.exit(1);
  }

  console.log(`🔄 Creating new app: ${appName}`);

  try {
    // Copy template directory
    copyDirectory(templateDir, newAppDir);

    // Update file contents
    updateAppFiles(newAppDir, appName);

    console.log(`✅ App '${appName}' created successfully!`);
    console.log('');
    console.log('📝 Next steps:');
    console.log(`1. Add your app routes to server.js:`);
    console.log(`   import ${toCamelCase(appName)}Routes from "./apps/${appName}/backend/routes/index.js";`);
    console.log(`   app.use("/api/${appName}", ${toCamelCase(appName)}Routes);`);
    console.log('');
    console.log(`2. Customize your app in: apps/${appName}/`);
    console.log(`3. Start building your app logic in the controllers and routes`);
    console.log('');
    console.log(`🚀 Your app will be available at: /api/${appName}/*`);

  } catch (error) {
    console.error('❌ Error creating app:', error.message);
    
    // Cleanup on error
    if (fs.existsSync(newAppDir)) {
      fs.rmSync(newAppDir, { recursive: true, force: true });
    }
    
    process.exit(1);
  }
}

function copyDirectory(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateAppFiles(appDir, appName) {
  const filesToUpdate = [
    'backend/routes/index.js',
    'backend/controllers/ProductController.js',
    'backend/controllers/AnalyticsController.js',
    'backend/controllers/ReportController.js'
  ];

  const appTitle = toTitleCase(appName);
  const appCamelCase = toCamelCase(appName);

  filesToUpdate.forEach(filePath => {
    const fullPath = path.join(appDir, filePath);
    
    if (fs.existsSync(fullPath)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Replace template-specific content
      content = content.replace(/profit-analyser/g, appName);
      content = content.replace(/Profit Analyser/g, appTitle);
      content = content.replace(/profit analyser/g, appName.replace('-', ' '));
      content = content.replace(/profitAnalyser/g, appCamelCase);
      
      // Update specific comments and descriptions
      if (filePath.includes('routes/index.js')) {
        content = content.replace(
          'Profit Analyser App Routes',
          `${appTitle} App Routes`
        );
        content = content.replace(
          'Main routing file for the profit analyser application',
          `Main routing file for the ${appName.replace('-', ' ')} application`
        );
        content = content.replace(
          'app: "profit-analyser"',
          `app: "${appName}"`
        );
      }
      
      fs.writeFileSync(fullPath, content);
    }
  });
}

function toTitleCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function toCamelCase(str) {
  return str
    .split('-')
    .map((word, index) => 
      index === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join('');
}

// Get app name from command line arguments
const appName = process.argv[2];
createApp(appName);
