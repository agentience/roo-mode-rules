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
 *        node scripts/copy_roo.js --modes=mode1,mode2 <target_directory>
 *        node scripts/copy_roo.js -p (or --playback) to copy to all previously used directories
 *        node scripts/copy_roo.js (with no arguments) defaults to playback mode
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const os = require('os');
const mkdirp = require('mkdirp');

// Constants
const COPY_HISTORY_JSON = 'copy_history.json';
const TEMP_DIR_PREFIX = 'roo-mode-rules-temp-';
const EXCLUDED_DIRS = ['scripts']; // Directories to exclude from copying
const DEFAULT_MODE_SET_PATH = '.roo/default_mode_set.yaml';

// Parse command line arguments
const args = process.argv.slice(2);
let playbackMode = false;
let targetDir = null;
let additionalModes = [];
let modesToCopy = [];

// Default to playback mode if no arguments are provided
if (args.length === 0) {
  playbackMode = true;
} else {
  // Process arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    // Check for playback flag
    if (arg === '-p' || arg === '--playback') {
      playbackMode = true;
      continue;
    }
    
    // Check for modes flag
    if (arg.startsWith('--modes=')) {
      const modesStr = arg.substring('--modes='.length);
      additionalModes = modesStr.split(',').map(mode => mode.trim()).filter(mode => mode);
      continue;
    }
    
    // If not a flag, assume it's the target directory
    if (!targetDir && !arg.startsWith('-')) {
      targetDir = arg;
    }
  }
}

// Function to read default mode set from YAML file
function readDefaultModeSet() {
  try {
    if (fs.existsSync(DEFAULT_MODE_SET_PATH)) {
      const fileContent = fs.readFileSync(DEFAULT_MODE_SET_PATH, 'utf8');
      const data = yaml.load(fileContent);
      if (data && Array.isArray(data.default_modes)) {
        console.log(`Read default mode set: ${data.default_modes.join(', ')}`);
        return data.default_modes;
      } else {
        console.warn('Invalid format in default_mode_set.yaml. Expected an array of default_modes.');
        return [];
      }
    } else {
      console.warn(`${DEFAULT_MODE_SET_PATH} not found. No default modes will be used.`);
      return [];
    }
  } catch (error) {
    console.error(`Error reading default mode set: ${error.message}`);
    return [];
  }
}

// Function to determine the set of modes to copy
function determineModesToCopy(additionalModes) {
  const defaultModes = readDefaultModeSet();
  
  // Combine default modes and additional modes, ensuring no duplicates
  const combinedModes = [...defaultModes];
  
  additionalModes.forEach(mode => {
    if (!combinedModes.includes(mode)) {
      combinedModes.push(mode);
    }
  });
  
  console.log(`Modes to copy: ${combinedModes.join(', ')}`);
  return combinedModes;
}

// Function to read copy history JSON file
function readCopyHistoryJson() {
  try {
    if (fs.existsSync(COPY_HISTORY_JSON)) {
      const fileContent = fs.readFileSync(COPY_HISTORY_JSON, 'utf8');
      if (!fileContent.trim()) {
        return {};
      }
      const history = JSON.parse(fileContent);
      return typeof history === 'object' && history !== null ? history : {};
    }
  } catch (error) {
    console.error(`Error reading copy history JSON file: ${error.message}`);
  }
  return {};
}

// Function to write to copy history JSON file
function writeCopyHistoryJson(history) {
  try {
    fs.writeFileSync(COPY_HISTORY_JSON, JSON.stringify(history, null, 2), 'utf8');
    console.log(`Updated ${COPY_HISTORY_JSON}`);
  } catch (error) {
    console.error(`Error writing to copy history JSON file: ${error.message}`);
  }
}

// Function to add an operation to copy history JSON
function addToCopyHistoryJson(targetDir, additionalModes) {
  const history = readCopyHistoryJson();
  const timestamp = new Date().toISOString();
  
  // Store only the most recent copy operation for each target directory
  history[targetDir] = {
    timestamp
  };
  
  // Only add additionalModes if there are any
  if (Array.isArray(additionalModes) && additionalModes.length > 0) {
    history[targetDir].additionalModes = [...additionalModes];
  }
  
  writeCopyHistoryJson(history);
}

// Function to selectively copy mode-specific files and directories
function copyModeFiles(modes, tempDir = null) {
  const targetBaseDir = tempDir || targetDir;
  const targetRooDir = path.join(targetBaseDir, '.roo');
  
  // Create the target .roo directory if it doesn't exist
  if (!fs.existsSync(targetRooDir)) {
    fs.mkdirSync(targetRooDir, { recursive: true });
  }
  
  // Copy common directories and files needed by all modes
  const commonDirs = ['.roo/context'];
  
  for (const dir of commonDirs) {
    if (fs.existsSync(dir)) {
      const targetDir = path.join(targetBaseDir, dir);
      copyDirRecursive(dir, targetDir, EXCLUDED_DIRS);
      console.log(`Copied common directory: ${dir}`);
    }
  }
  
  // Read the mode-rule-context.yaml file to get context files for each mode
  const modeRuleContextPath = 'mode-rule-context.yaml';
  if (!fs.existsSync(modeRuleContextPath)) {
    console.error('mode-rule-context.yaml not found');
    return false;
  }
  
  try {
    const modeRuleContextContent = fs.readFileSync(modeRuleContextPath, 'utf8');
    const modeRuleContextData = yaml.load(modeRuleContextContent);
    
    if (!modeRuleContextData || !modeRuleContextData.modes) {
      console.error('No modes found in mode-rule-context.yaml');
      return false;
    }
    
    // Copy mode-specific rules directories and context files
    for (const mode of modes) {
      // Copy the rules directory for this mode
      const rulesDir = `.roo/rules-${mode}`;
      if (fs.existsSync(rulesDir)) {
        const targetRulesDir = path.join(targetBaseDir, rulesDir);
        copyDirRecursive(rulesDir, targetRulesDir, EXCLUDED_DIRS);
        console.log(`Copied rules directory for mode: ${mode}`);
      } else {
        // Create an empty rules directory if it doesn't exist
        const targetRulesDir = path.join(targetBaseDir, rulesDir);
        if (!fs.existsSync(targetRulesDir)) {
          fs.mkdirSync(targetRulesDir, { recursive: true });
        }
        console.log(`Created empty rules directory for mode: ${mode}`);
        
        // Create a placeholder file for the mode
        const placeholderFile = path.join(targetRulesDir, `${mode}-placeholder.md`);
        fs.writeFileSync(placeholderFile, `# ${mode} Mode\n\nThis is a placeholder file for the ${mode} mode.`, 'utf8');
        console.log(`Created placeholder file for ${mode} mode`);
      }
      
      // Copy context files for this mode
      const modeConfig = modeRuleContextData.modes[mode];
      if (modeConfig && modeConfig.context && Array.isArray(modeConfig.context)) {
        for (const contextFile of modeConfig.context) {
          if (fs.existsSync(contextFile)) {
            // Copy to the rules directory
            const fileName = path.basename(contextFile);
            const targetFile = path.join(targetBaseDir, `.roo/rules-${mode}`, fileName);
            
            // Ensure the target directory exists
            const targetDir = path.dirname(targetFile);
            if (!fs.existsSync(targetDir)) {
              fs.mkdirSync(targetDir, { recursive: true });
            }
            
            fs.copyFileSync(contextFile, targetFile);
            console.log(`Copied context file for ${mode}: ${contextFile} -> ${targetFile}`);
          } else {
            console.warn(`Context file not found for ${mode}: ${contextFile}`);
          }
        }
      }
    }
    
    return true;
  } catch (err) {
    console.error(`Error copying mode files: ${err.message}`);
    return false;
  }
}

// Function to create a temporary directory
function createTempDirectory() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), TEMP_DIR_PREFIX));
  console.log(`Created temporary directory: ${tempDir}`);
  return tempDir;
}

// Function to copy directory recursively
function copyDirRecursive(src, dest, excludeDirs = []) {
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
      // Skip excluded directories
      if (excludeDirs.includes(entry.name)) {
        console.log(`Skipping excluded directory: ${entry.name}`);
        continue;
      }
      // Recursively copy subdirectory
      copyDirRecursive(srcPath, destPath, excludeDirs);
    } else {
      // Copy file
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Function to modify context YAML files to include additional modes
function modifyContextYamlFiles(tempDir, additionalModes) {
  const filesToModify = [
    '.roo/context/workflow-orchestration.roo.yaml',
    '.roo/context/task-delegation-patterns.roo.yaml'
  ];

  for (const file of filesToModify) {
    const tempFilePath = path.join(tempDir, file);
    const tempFileDir = path.dirname(tempFilePath);
    
    // Ensure the directory exists
    if (!fs.existsSync(tempFileDir)) {
      fs.mkdirSync(tempFileDir, { recursive: true });
    }
    
    // Copy the original file to the temp directory if it exists
    if (fs.existsSync(file)) {
      // First, copy the file
      fs.copyFileSync(file, tempFilePath);
      
      // Then, modify it
      try {
        const content = fs.readFileSync(tempFilePath, 'utf8');
        const data = yaml.load(content);
        
        // Modify workflow-orchestration.roo.yaml
        if (file.includes('workflow-orchestration.roo.yaml')) {
          // Find all mode references in the file
          const modeReferences = new Set();
          
          // Helper function to extract mode names from steps
          function extractModesFromSteps(steps) {
            if (Array.isArray(steps)) {
              steps.forEach(step => {
                if (step.mode) {
                  modeReferences.add(step.mode);
                }
              });
            }
          }
          
          // Extract modes from task_breakdown_patterns
          if (data.task_breakdown_patterns) {
            Object.values(data.task_breakdown_patterns).forEach(pattern => {
              if (pattern.steps) {
                extractModesFromSteps(pattern.steps);
              }
            });
          }
          
          // Extract modes from complex_task_orchestration
          if (data.complex_task_orchestration) {
            // Multi-phase project pattern
            if (data.complex_task_orchestration.multi_phase_project_pattern?.phases) {
              data.complex_task_orchestration.multi_phase_project_pattern.phases.forEach(phase => {
                if (phase.steps) {
                  extractModesFromSteps(phase.steps);
                }
              });
            }
            
            // Parallel workstreams pattern
            if (data.complex_task_orchestration.parallel_workstreams_pattern?.streams) {
              data.complex_task_orchestration.parallel_workstreams_pattern.streams.forEach(stream => {
                if (stream.steps) {
                  extractModesFromSteps(stream.steps);
                }
              });
            }
          }
          
          // Add additional modes to all steps arrays where they don't already exist
          additionalModes.forEach(mode => {
            if (!modeReferences.has(mode)) {
              // Add to task_breakdown_patterns
              if (data.task_breakdown_patterns?.feature_implementation_workflow?.steps) {
                data.task_breakdown_patterns.feature_implementation_workflow.steps.push({
                  mode: mode,
                  task: `Use ${mode} for specialized tasks`
                });
                console.log(`Added ${mode} to feature_implementation_workflow steps`);
              }
            }
          });
        }
        
        // Modify task-delegation-patterns.roo.yaml
        if (file.includes('task-delegation-patterns.roo.yaml')) {
          // Check if example_delegations exists
          if (data.example_delegations && Array.isArray(data.example_delegations)) {
            // Check if any of the additional modes are already in the examples
            const existingModes = new Set(
              data.example_delegations
                .map(example => {
                  const match = example.example.match(/<mode>(.*?)<\/mode>/);
                  return match ? match[1] : null;
                })
                .filter(Boolean)
            );
            
            // Add examples for additional modes that don't already have one
            additionalModes.forEach(mode => {
              if (!existingModes.has(mode)) {
                data.example_delegations.push({
                  name: `Boomerang to ${mode} Mode`,
                  example: `<new_task>
<mode>${mode}</mode>
<message>
# Task: Example Task for ${mode}

## Rules
Follow all the rules for ${mode} mode, found in markdown files in the folder .roo/rules-${mode}.

## Context
This is an example task for ${mode} mode.

## Objective
Complete the task according to ${mode} mode requirements.

## Requirements
- Requirement 1
- Requirement 2
- Requirement 3

## Deliverables
- Deliverable 1
- Deliverable 2

## Success Criteria
- Success criteria 1
- Success criteria 2

## Next Steps
After completion, the next steps will be determined.
</message>
</new_task>`
                });
                console.log(`Added example delegation for ${mode}`);
              }
            });
          }
        }
        
        // Write the modified data back to the file
        fs.writeFileSync(tempFilePath, yaml.dump(data), 'utf8');
        console.log(`Modified ${file} in temporary directory`);
      } catch (error) {
        console.error(`Error modifying ${file}: ${error.message}`);
      }
    } else {
      console.warn(`Source file does not exist: ${file}`);
    }
  }
}

// Function to manually process context files based on mode-rule-context.yaml
function processContextFiles(tempDir, additionalModes) {
  try {
    // Read the mode-rule-context.yaml file
    const modeRuleContextPath = 'mode-rule-context.yaml';
    if (!fs.existsSync(modeRuleContextPath)) {
      console.error('mode-rule-context.yaml not found');
      return false;
    }
    
    const modeRuleContextContent = fs.readFileSync(modeRuleContextPath, 'utf8');
    const modeRuleContextData = yaml.load(modeRuleContextContent);
    
    if (!modeRuleContextData || !modeRuleContextData.modes) {
      console.error('No modes found in mode-rule-context.yaml');
      return false;
    }
    
    // Process only the modes that are in modesToCopy
    Object.entries(modeRuleContextData.modes).forEach(([modeName, modeConfig]) => {
      // Skip modes that are not in modesToCopy
      if (!modesToCopy.includes(modeName)) {
        console.log(`Skipping mode not in modesToCopy: ${modeName}`);
        return;
      }
      
      if (!modeConfig.context || !Array.isArray(modeConfig.context)) {
        console.warn(`No context files found for mode: ${modeName}`);
        return;
      }
      
      // Create the target directory
      const targetDir = path.join(tempDir, '.roo', `rules-${modeName}`);
      mkdirp.sync(targetDir);
      console.log(`Created directory: ${targetDir}`);
      
      // Copy each context file
      modeConfig.context.forEach(contextFile => {
        try {
          // Check if the source file exists in the temp directory
          const tempContextFile = path.join(tempDir, contextFile);
          if (!fs.existsSync(tempContextFile)) {
            // If not in temp directory, check if it exists in the original directory
            if (fs.existsSync(contextFile)) {
              // Copy from original directory to temp directory first
              const tempContextDir = path.dirname(tempContextFile);
              if (!fs.existsSync(tempContextDir)) {
                fs.mkdirSync(tempContextDir, { recursive: true });
              }
              fs.copyFileSync(contextFile, tempContextFile);
              console.log(`Copied original ${contextFile} to temp directory`);
            } else {
              console.warn(`Source file does not exist: ${contextFile}`);
              return;
            }
          }
          
          // Get the filename without the path
          const fileName = path.basename(contextFile);
          const targetFile = path.join(targetDir, fileName);
          
          // Copy the file from temp context directory to temp rules directory
          fs.copyFileSync(tempContextFile, targetFile);
          console.log(`Copied: ${tempContextFile} -> ${targetFile}`);
        } catch (err) {
          console.error(`Error copying file ${contextFile}: ${err.message}`);
        }
      });
      
      console.log(`Processed mode: ${modeName}`);
    });
    
    // Create directories for additional modes
    additionalModes.forEach(mode => {
      // Only process if the mode is in modesToCopy
      if (modesToCopy.includes(mode)) {
        const modeDir = path.join(tempDir, '.roo', `rules-${mode}`);
        if (!fs.existsSync(modeDir)) {
          mkdirp.sync(modeDir);
          console.log(`Created directory for additional mode: ${modeDir}`);
          
          // Create a placeholder file for the mode
          const placeholderFile = path.join(modeDir, `${mode}-placeholder.md`);
          fs.writeFileSync(placeholderFile, `# ${mode} Mode\n\nThis is a placeholder file for the ${mode} mode.`, 'utf8');
          console.log(`Created placeholder file for ${mode} mode`);
        }
      }
    });
    
    console.log('Context files copying completed successfully!');
    return true;
  } catch (err) {
    console.error(`Error processing context files: ${err.message}`);
    return false;
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

  let tempDir = null;
  let success = true;

  try {
    // Determine the set of modes to copy
    modesToCopy = determineModesToCopy(additionalModes);
    
    // If additional modes are specified, create a temporary directory and modify context files
    if (additionalModes.length > 0) {
      console.log(`Processing with additional modes: ${additionalModes.join(', ')}`);
      
      // Create temporary directory
      tempDir = createTempDirectory();
      
      // Copy mode-rule-context.yaml to temporary directory
      fs.copyFileSync('mode-rule-context.yaml', path.join(tempDir, 'mode-rule-context.yaml'));
      console.log('Copied mode-rule-context.yaml to temporary directory');
      
      // Selectively copy mode files to the temporary directory
      if (!copyModeFiles(modesToCopy, tempDir)) {
        console.error('Failed to copy mode files to temporary directory');
        return false;
      }
      
      // Modify context YAML files in temporary directory
      modifyContextYamlFiles(tempDir, additionalModes);
      
      // Process context files manually
      if (!processContextFiles(tempDir, additionalModes)) {
        console.error('Failed to process context files in temporary directory');
        return false;
      }
      
      // Copy from temporary directory to target directory
      console.log(`Copying from temporary directory to ${targetDir}...`);
      copyDirRecursive(path.join(tempDir, '.roo'), path.join(targetDir, '.roo'), EXCLUDED_DIRS);
      console.log(`Successfully copied .roo directory to ${targetDir}`);
    } else {
      // Selectively copy mode files directly to the target directory
      console.log(`Selectively copying mode files to ${targetDir}...`);
      if (!copyModeFiles(modesToCopy)) {
        console.error('Failed to copy mode files to target directory');
        return false;
      }
      console.log(`Successfully copied mode files to ${targetDir}`);
    }
  } catch (error) {
    console.error(`Failed to copy .roo directory to ${targetDir}: ${error.message}`);
    success = false;
  } finally {
    // Clean up temporary directory if it was created
    if (tempDir && fs.existsSync(tempDir)) {
      try {
        // Use recursive deletion (Node.js >= 14.14.0)
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log(`Removed temporary directory: ${tempDir}`);
      } catch (error) {
        console.error(`Error removing temporary directory: ${error.message}`);
      }
    }
  }

  if (!success) {
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
      // Add to JSON history with additional modes
      addToCopyHistoryJson(targetDir, additionalModes);
    }
    
    return true;
  }

  try {
    // If target .roomodes doesn't exist, create a new one with filtered modes
    if (!fs.existsSync(targetRoomodesPath)) {
      console.log(`No .roomodes file found in the target directory. Creating new .roomodes with filtered modes...`);
      
      // Read source .roomodes file
      const sourceRoomodesContent = fs.readFileSync(sourceRoomodesPath, 'utf8');
      let sourceRoomodes;
      try {
        sourceRoomodes = JSON.parse(sourceRoomodesContent);
      } catch (error) {
        console.error(`Error parsing source .roomodes file: ${error.message}`);
        return false;
      }
      
      // Ensure customModes array exists
      if (!sourceRoomodes.customModes) {
        sourceRoomodes.customModes = [];
      }
      
      // Create a new object for the target .roomodes
      const targetRoomodes = {
        customModes: []
      };
      
      // Filter source custom modes to include only those in the determined set of modes to copy
      const filteredSourceModes = sourceRoomodes.customModes.filter(sourceMode =>
        sourceMode.slug && modesToCopy.includes(sourceMode.slug)
      );
      
      // Add filtered source modes to the target
      filteredSourceModes.forEach(sourceMode => {
        targetRoomodes.customModes.push(sourceMode);
        console.log(`Added custom mode with slug: ${sourceMode.slug}`);
      });
      
      // Add placeholder entries for additional modes that don't exist in source
      additionalModes.forEach(mode => {
        if (!filteredSourceModes.some(sourceMode => sourceMode.slug === mode)) {
          // Create a placeholder entry for the additional mode
          const placeholderMode = {
            slug: mode,
            name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, // Capitalize first letter
            roleDefinition: `Placeholder definition for copied mode: ${mode}.`,
            groups: ["read", "edit", "command", "mcp"],
            source: "project"
          };
          
          targetRoomodes.customModes.push(placeholderMode);
          console.log(`Added placeholder entry for additional mode: ${mode}`);
        }
      });
      
      // Write the filtered modes to the target file
      fs.writeFileSync(
        targetRoomodesPath,
        JSON.stringify(targetRoomodes, null, 2),
        'utf8'
      );
      
      console.log(`Successfully created new .roomodes file with ${targetRoomodes.customModes.length} filtered mode(s).`);
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
      
      // Filter source custom modes to include only those in the determined set of modes to copy
      const filteredSourceModes = sourceRoomodes.customModes.filter(sourceMode =>
        sourceMode.slug && modesToCopy.includes(sourceMode.slug)
      );
      
      // Add filtered source custom modes that don't exist in target
      let modesAdded = 0;
      filteredSourceModes.forEach(sourceMode => {
        if (sourceMode.slug && !targetModesBySlug.has(sourceMode.slug)) {
          targetRoomodes.customModes.push(sourceMode);
          modesAdded++;
          console.log(`Added custom mode with slug: ${sourceMode.slug}`);
        }
      });
      
      // Add placeholder entries for additional modes that don't exist in source or target
      additionalModes.forEach(mode => {
        if (!targetModesBySlug.has(mode) &&
            !filteredSourceModes.some(sourceMode => sourceMode.slug === mode)) {
          // Create a placeholder entry for the additional mode
          const placeholderMode = {
            slug: mode,
            name: `${mode.charAt(0).toUpperCase() + mode.slice(1)} Mode`, // Capitalize first letter
            roleDefinition: `Placeholder definition for copied mode: ${mode}.`,
            groups: ["read", "edit", "command", "mcp"],
            source: "project"
          };
          
          targetRoomodes.customModes.push(placeholderMode);
          modesAdded++;
          console.log(`Added placeholder entry for additional mode: ${mode}`);
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
      // Add to JSON history with additional modes
      addToCopyHistoryJson(targetDir, additionalModes);
    }
    
    return true;
  } catch (error) {
    console.error(`Error handling .roomodes files: ${error.message}`);
    return false;
  }
}

// Handle playback mode
if (playbackMode) {
  const history = readCopyHistoryJson();
  const entries = Object.entries(history);
  
  if (entries.length === 0) {
    console.log('No copy history found. Please run the script with a target directory first.');
    process.exit(0);
  }
  
  console.log(`Found ${entries.length} destination(s) in copy history.`);
  
  // Process each entry in history
  for (const [dir, entry] of entries) {
    // Handle additionalModes property which may not exist in the new structure
    const modes = entry.additionalModes || [];
    
    console.log(`\nProcessing destination: ${dir}`);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      console.error(`Warning: Directory '${dir}' does not exist or is not accessible. Skipping.`);
      continue;
    }
    
    // Set global additionalModes for this playback operation
    additionalModes = modes;
    console.log(`Using additional modes: ${modes.length > 0 ? modes.join(', ') : 'none'}`);
    
    // Reset modesToCopy for this playback operation
    modesToCopy = [];
    
    // Set targetDir for this playback operation
    targetDir = dir;
    
    processCopy(dir, false); // Don't add to history during playback
  }
  
  console.log('\nPlayback completed successfully!');
  process.exit(0);
} else {
  // For non-playback mode, ensure target directory is provided
  if (!targetDir) {
    console.error('Error: Target directory not specified.');
    console.error('Usage: node scripts/copy_roo.js <target_directory>');
    console.error('       node scripts/copy_roo.js --modes=mode1,mode2 <target_directory>');
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