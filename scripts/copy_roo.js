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
 * Script to copy the .roo directory to a target directory and handle .roomodes file merging
 * Usage: node scripts/copy_roo.js <target_directory>
 *        node scripts/copy_roo.js -p (or --playback) to copy to all previously used directories
 *        node scripts/copy_roo.js (with no arguments) defaults to playback mode
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Constants
const HISTORY_FILE = '.copy-history.yaml';

// Parse command line arguments
const args = process.argv.slice(2);
let playbackMode = false;
let targetDir = null;

// Default to playback mode if no arguments are provided
if (args.length === 0) {
  playbackMode = true;
}
// Check for playback flag
else if (args.includes('-p') || args.includes('--playback')) {
  playbackMode = true;
  // Remove the playback flag from args
  const filteredArgs = args.filter(arg => arg !== '-p' && arg !== '--playback');
  if (filteredArgs.length > 0) {
    targetDir = filteredArgs[0];
  }
} else if (args.length > 0) {
  targetDir = args[0];
}

// Function to read history file
function readHistoryFile() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const fileContent = fs.readFileSync(HISTORY_FILE, 'utf8');
      if (!fileContent.trim()) {
        return [];
      }
      const history = yaml.load(fileContent);
      return Array.isArray(history) ? history : [];
    }
  } catch (error) {
    console.error(`Error reading history file: ${error.message}`);
  }
  return [];
}

// Function to write to history file
function writeHistoryFile(paths) {
  try {
    const uniquePaths = [...new Set(paths)]; // Remove duplicates
    fs.writeFileSync(HISTORY_FILE, yaml.dump(uniquePaths), 'utf8');
  } catch (error) {
    console.error(`Error writing to history file: ${error.message}`);
  }
}

// Function to add a path to history
function addToHistory(dirPath) {
  const history = readHistoryFile();
  if (!history.includes(dirPath)) {
    history.push(dirPath);
    writeHistoryFile(history);
    console.log(`Added ${dirPath} to copy history.`);
  }
}

// Process the copy operation for a single target directory
function processCopy(targetDir, addToHistoryFlag = true) {
  // Check if target directory exists
  if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
    console.error(`Error: Target directory '${targetDir}' does not exist.`);
    console.error('Please provide a valid directory path.');
    return false;
  }

  // Check if .roo directory exists in current directory
  if (!fs.existsSync('.roo') || !fs.statSync('.roo').isDirectory()) {
    console.error('Error: .roo directory not found in the current directory.');
    console.error('Please ensure you are in the root directory of the roo project.');
    return false;
  }

  // Copy the .roo directory to the target directory
  console.log(`Copying .roo directory to ${targetDir}...`);
  try {
    // Create recursive function to copy directory
    function copyDirRecursive(src, dest) {
      // Create destination directory if it doesn't exist
      if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
      }

      // Read source directory
      const entries = fs.readdirSync(src, { withFileTypes: true });

      // Copy each entry
      for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
          // Recursively copy subdirectory
          copyDirRecursive(srcPath, destPath);
        } else {
          // Copy file
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }

    // Copy .roo directory
    copyDirRecursive('.roo', path.join(targetDir, '.roo'));
    console.log(`Successfully copied .roo directory to ${targetDir}`);
  } catch (error) {
    console.error(`Failed to copy .roo directory to ${targetDir}: ${error.message}`);
    return false;
  }

  // Handle .roomodes file
  const sourceRoomodesPath = '.roomodes';
  const targetRoomodesPath = path.join(targetDir, '.roomodes');

  // Check if source .roomodes file exists
  if (!fs.existsSync(sourceRoomodesPath)) {
    console.log('No .roomodes file found in the source directory. Skipping .roomodes handling.');
    
    // Add to history if successful and not in playback mode
    if (addToHistoryFlag) {
      addToHistory(targetDir);
    }
    
    return true;
  }

  try {
    // If target .roomodes doesn't exist, simply copy the source file
    if (!fs.existsSync(targetRoomodesPath)) {
      console.log(`No .roomodes file found in the target directory. Copying source .roomodes to ${targetDir}...`);
      fs.copyFileSync(sourceRoomodesPath, targetRoomodesPath);
      console.log(`Successfully copied .roomodes file to ${targetDir}`);
    } else {
      // Both source and target .roomodes files exist, need to merge them
      console.log('Found .roomodes files in both source and target directories. Merging...');
      
      // Read source .roomodes file
      const sourceRoomodesContent = fs.readFileSync(sourceRoomodesPath, 'utf8');
      let sourceRoomodes;
      try {
        sourceRoomodes = JSON.parse(sourceRoomodesContent);
      } catch (error) {
        console.error(`Error parsing source .roomodes file: ${error.message}`);
        return false;
      }
      
      // Read target .roomodes file
      const targetRoomodesContent = fs.readFileSync(targetRoomodesPath, 'utf8');
      let targetRoomodes;
      try {
        targetRoomodes = JSON.parse(targetRoomodesContent);
      } catch (error) {
        console.error(`Error parsing target .roomodes file: ${error.message}`);
        return false;
      }
      
      // Ensure customModes arrays exist
      if (!sourceRoomodes.customModes) {
        sourceRoomodes.customModes = [];
      }
      if (!targetRoomodes.customModes) {
        targetRoomodes.customModes = [];
      }
      
      // Create a map of existing custom modes in target by slug
      const targetModesBySlug = new Map();
      targetRoomodes.customModes.forEach(mode => {
        if (mode.slug) {
          targetModesBySlug.set(mode.slug, mode);
        }
      });
      
      // Add source custom modes that don't exist in target
      let modesAdded = 0;
      sourceRoomodes.customModes.forEach(sourceMode => {
        if (sourceMode.slug && !targetModesBySlug.has(sourceMode.slug)) {
          targetRoomodes.customModes.push(sourceMode);
          modesAdded++;
          console.log(`Added custom mode with slug: ${sourceMode.slug}`);
        }
      });
      
      // Write the merged custom modes back to the target file
      fs.writeFileSync(
        targetRoomodesPath,
        JSON.stringify(targetRoomodes, null, 2),
        'utf8'
      );
      
      console.log(`Successfully merged .roomodes files. Added ${modesAdded} new custom mode(s).`);
    }
    
    // Add to history if successful and not in playback mode
    if (addToHistoryFlag) {
      addToHistory(targetDir);
    }
    
    return true;
  } catch (error) {
    console.error(`Error handling .roomodes files: ${error.message}`);
    return false;
  }
}

// Handle playback mode
if (playbackMode) {
  const history = readHistoryFile();
  
  if (history.length === 0) {
    console.log('No copy history found. Please run the script with a target directory first.');
    process.exit(0);
  }
  
  console.log(`Found ${history.length} destination(s) in copy history.`);
  
  // Process each path in history
  for (const dir of history) {
    console.log(`\nProcessing destination: ${dir}`);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      console.error(`Warning: Directory '${dir}' does not exist or is not accessible. Skipping.`);
      continue;
    }
    
    processCopy(dir, false); // Don't add to history during playback
  }
  
  console.log('\nPlayback completed successfully!');
  process.exit(0);
} else {
  // For non-playback mode, ensure target directory is provided
  if (!targetDir) {
    console.error('Error: Target directory not specified.');
    console.error('Usage: node scripts/copy_roo.js <target_directory>');
    console.error('       node scripts/copy_roo.js -p (or --playback) to copy to all previously used directories');
    console.error('       node scripts/copy_roo.js (with no arguments) defaults to playback mode');
    process.exit(1);
  }

  // Execute copy for the specified target directory
  const success = processCopy(targetDir);
  if (success) {
    console.log('Operation completed successfully!');
  } else {
    console.error('Operation failed.');
    process.exit(1);
  }
}