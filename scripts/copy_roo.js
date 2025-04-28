#!/usr/bin/env node

/**
 * Script to copy the .roo directory to a target directory and handle .roomodes file merging
 * Usage: node scripts/copy_roo.js <target_directory>
 */

const fs = require('fs');
const path = require('path');

// Check if target directory argument is provided
if (process.argv.length < 3) {
  console.error('Error: Target directory not specified.');
  console.error('Usage: node scripts/copy_roo.js <target_directory>');
  process.exit(1);
}

const targetDir = process.argv[2];

// Check if target directory exists
if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
  console.error(`Error: Target directory '${targetDir}' does not exist.`);
  console.error('Please provide a valid directory path.');
  process.exit(1);
}

// Check if .roo directory exists in current directory
if (!fs.existsSync('.roo') || !fs.statSync('.roo').isDirectory()) {
  console.error('Error: .roo directory not found in the current directory.');
  console.error('Please ensure you are in the root directory of the roo project.');
  process.exit(1);
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
  process.exit(1);
}

// Handle .roomodes file
const sourceRoomodesPath = '.roomodes';
const targetRoomodesPath = path.join(targetDir, '.roomodes');

// Check if source .roomodes file exists
if (!fs.existsSync(sourceRoomodesPath)) {
  console.log('No .roomodes file found in the source directory. Skipping .roomodes handling.');
  process.exit(0);
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
      process.exit(1);
    }
    
    // Read target .roomodes file
    const targetRoomodesContent = fs.readFileSync(targetRoomodesPath, 'utf8');
    let targetRoomodes;
    try {
      targetRoomodes = JSON.parse(targetRoomodesContent);
    } catch (error) {
      console.error(`Error parsing target .roomodes file: ${error.message}`);
      process.exit(1);
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
} catch (error) {
  console.error(`Error handling .roomodes files: ${error.message}`);
  process.exit(1);
}

console.log('Operation completed successfully!');