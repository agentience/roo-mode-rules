#!/usr/bin/env node

/**
 * Copyright 2025 Agentience
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Script to update the structure of copy_history.json and migrate data from .copy-history.yaml
 * The new structure will store only one entry per targetDirectory, keyed by the directory path itself.
 */

const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');

// Constants
const COPY_HISTORY_YAML = '.copy-history.yaml';
const COPY_HISTORY_JSON = 'copy_history.json';

/**
 * Main function to update copy_history.json structure and migrate data
 */
function updateCopyHistoryStructure() {
  console.log('Updating copy_history.json structure and migrating data from .copy-history.yaml...');
  
  try {
    // Check if .copy-history.yaml exists
    if (!fs.existsSync(COPY_HISTORY_YAML)) {
      console.error(`Error: ${COPY_HISTORY_YAML} not found.`);
      process.exit(1);
    }
    
    // Read .copy-history.yaml
    const yamlContent = fs.readFileSync(COPY_HISTORY_YAML, 'utf8');
    const targetDirectories = yaml.load(yamlContent);
    
    if (!Array.isArray(targetDirectories)) {
      console.error(`Error: ${COPY_HISTORY_YAML} does not contain a valid list of target directories.`);
      process.exit(1);
    }
    
    console.log(`Found ${targetDirectories.length} target directories in ${COPY_HISTORY_YAML}.`);
    
    // Create new structure
    const newStructure = {};
    const currentTimestamp = new Date().toISOString();
    
    // Process each target directory
    targetDirectories.forEach(targetDir => {
      if (typeof targetDir === 'string' && targetDir.trim()) {
        // Use the target directory as the key and set the current timestamp
        newStructure[targetDir] = {
          timestamp: currentTimestamp
        };
        console.log(`Added entry for target directory: ${targetDir}`);
      }
    });
    
    // Write the new structure to copy_history.json
    fs.writeFileSync(COPY_HISTORY_JSON, JSON.stringify(newStructure, null, 2), 'utf8');
    console.log(`Successfully updated ${COPY_HISTORY_JSON} with the new structure.`);
    
    return true;
  } catch (error) {
    console.error(`Error updating copy_history.json: ${error.message}`);
    return false;
  }
}

// Execute the update function
const success = updateCopyHistoryStructure();
if (success) {
  console.log('Operation completed successfully!');
} else {
  console.error('Operation failed.');
  process.exit(1);
}