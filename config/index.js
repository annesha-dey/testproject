/**
 * Configuration Loader
 * Loads environment-specific configuration with environment variable substitution
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load configuration based on NODE_ENV
 */
export function loadConfig() {
  const env = process.env.NODE_ENV || 'development';
  const configFile = env === 'production' ? 'prod.json' : 'dev.json';
  const configPath = path.join(__dirname, configFile);

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  try {
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    
    // Substitute environment variables
    const processedConfig = substituteEnvVars(config);
    
    console.log(`✅ Configuration loaded: ${configFile}`);
    return processedConfig;
  } catch (error) {
    throw new Error(`Failed to load configuration: ${error.message}`);
  }
}

/**
 * Recursively substitute environment variables in config
 */
function substituteEnvVars(obj) {
  if (typeof obj === 'string') {
    // Replace ${VAR_NAME} with environment variable value
    return obj.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const value = process.env[varName];
      if (value === undefined) {
        console.warn(`⚠️ Environment variable ${varName} is not defined, using placeholder`);
        return match; // Keep placeholder if env var not found
      }
      return value;
    });
  } else if (Array.isArray(obj)) {
    return obj.map(item => substituteEnvVars(item));
  } else if (obj !== null && typeof obj === 'object') {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = substituteEnvVars(value);
    }
    return result;
  }
  
  return obj;
}

/**
 * Get specific configuration section
 */
export function getConfig(section) {
  const config = loadConfig();
  return section ? config[section] : config;
}

/**
 * Validate required configuration
 */
export function validateConfig(config) {
  const required = [
    'server.port',
    'database.mongodb.uri'
  ];

  const missing = [];
  
  for (const path of required) {
    if (!getNestedValue(config, path)) {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }

  console.log('✅ Configuration validation passed');
  return true;
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

export default {
  loadConfig,
  getConfig,
  validateConfig
};
